const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");

// Helper to resolve employee UUID from HRMS ID
async function getActorUuid(hrms_id) {
  if (!hrms_id) return null;
  const res = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [hrms_id.toUpperCase()]);
  return res.rows.length > 0 ? res.rows[0].id : null;
}

/**
 * Preview rows from staging table employee_import
 * GET /api/admin/import/preview
 */
exports.getImportPreview = async (req, res) => {
  try {
    const previewRes = await pool.query("SELECT * FROM employee_import");
    const rowCount = previewRes.rows.length;

    return res.status(200).json({
      success: true,
      count: rowCount,
      data: previewRes.rows
    });
  } catch (error) {
    console.error("Error fetching import preview:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching staging preview data."
    });
  }
};

/**
 * Execute the bulk import engine
 * POST /api/admin/import/execute
 */
exports.executeImport = async (req, res) => {
  const client = await pool.connect();
  try {
    const actorUuid = await getActorUuid(req.user.hrms_id);
    if (!actorUuid) {
      return res.status(403).json({
        success: false,
        message: "Logged-in user profile not found."
      });
    }

    // Start database transaction
    await client.query("BEGIN");

    // 1. Fetch staging rows
    const stagingRes = await client.query("SELECT * FROM employee_import");
    const stagingRows = stagingRes.rows;

    if (stagingRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "No staging records found in employee_import to import."
      });
    }

    // 2. Fetch existing employees HRMS IDs to detect duplicates
    const existingEmpRes = await client.query("SELECT hrms_id FROM employees WHERE hrms_id IS NOT NULL");
    const existingHrmsSet = new Set(existingEmpRes.rows.map(r => r.hrms_id.trim().toUpperCase()));

    // 3. Fetch stations and roles maps
    const stationsRes = await client.query("SELECT id, station_code FROM stations");
    const stationMap = {};
    stationsRes.rows.forEach(s => {
      stationMap[s.station_code.trim().toUpperCase()] = s.id;
    });

    const rolesRes = await client.query("SELECT id, role_name FROM roles");
    const roleMap = {};
    rolesRes.rows.forEach(r => {
      roleMap[r.role_name.trim().toLowerCase()] = r.id;
    });

    const imported = [];
    const skipped = [];
    const failed = [];

    // Pre-hash default password "Railway@123" to reuse
    const defaultPasswordHash = await bcrypt.hash("Railway@123", 10);

    // 4. Process each row
    for (const row of stagingRows) {
      const hrmsId = row.hrms_id ? row.hrms_id.trim() : null;
      const fullName = row.full_name ? row.full_name.trim() : "";
      const stationCode = row.station_code ? row.station_code.trim().toUpperCase() : null;
      const designationRaw = row.designation ? row.designation.trim() : "";
      const pfNumber = row.pf_number ? row.pf_number.trim() : null;
      const mobile = row.mobile ? row.mobile.trim() : null;
      const categoryGrade = row.category_grade ? row.category_grade.trim().toUpperCase() : null;

      // Validation check
      if (!hrmsId) {
        failed.push({
          name: fullName,
          error: "Missing HRMS ID"
        });
        continue;
      }

      // Duplicate Prevention Check
      if (existingHrmsSet.has(hrmsId.toUpperCase())) {
        skipped.push({
          hrms_id: hrmsId,
          full_name: fullName,
          reason: "Employee with this HRMS ID already exists in system."
        });
        continue;
      }

      // Station code lookup
      const stationId = stationMap[stationCode] || null;

      // Role parsing & normalization
      let roleNameNormalized = "Pointsman";
      if (/station master/i.test(designationRaw)) {
        roleNameNormalized = "Station Master";
      } else if (/ti/i.test(designationRaw) || /traffic inspector/i.test(designationRaw)) {
        roleNameNormalized = "Traffic Inspector";
      } else if (/pointsman/i.test(designationRaw)) {
        roleNameNormalized = "Pointsman";
      } else if (/superintendent/i.test(designationRaw)) {
        roleNameNormalized = "Station Superintendent";
      } else if (/supervisor/i.test(designationRaw)) {
        roleNameNormalized = "Station Supervisor";
      } else if (/manager/i.test(designationRaw)) {
        roleNameNormalized = "Train Manager";
      } else if (/aom/i.test(designationRaw)) {
        roleNameNormalized = "AOM";
      }

      const roleId = roleMap[roleNameNormalized.toLowerCase()] || 1; // default to Pointsman if not mapped

      try {
        // Insert into employees
        const insertEmpText = `
          INSERT INTO employees (
            full_name, hrms_id, pf_number, role_id, station_id, designation, category_grade, status, risk_level, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active', 'Normal', NOW(), NOW())
          RETURNING id;
        `;
        const empVal = [fullName, hrmsId.toUpperCase(), pfNumber, roleId, stationId, roleNameNormalized, categoryGrade];
        const newEmpRes = await client.query(insertEmpText, empVal);
        const newEmpId = newEmpRes.rows[0].id;

        // Insert into user_accounts
        const insertUserText = `
          INSERT INTO user_accounts (employee_id, hrms_id, password_hash, is_active, created_at)
          VALUES ($1, $2, $3, true, NOW());
        `;
        await client.query(insertUserText, [newEmpId, hrmsId.toUpperCase(), defaultPasswordHash]);

        imported.push({
          hrms_id: hrmsId,
          full_name: fullName,
          designation: roleNameNormalized,
          station_code: stationCode
        });

        // Add to cached existing set to prevent duplicates within the same staging run
        existingHrmsSet.add(hrmsId.toUpperCase());
      } catch (insertErr) {
        console.error(`Failed to insert employee ${fullName}:`, insertErr.message);
        failed.push({
          hrms_id: hrmsId,
          full_name: fullName,
          error: insertErr.message
        });
      }
    }

    // 5. Truncate staging table upon successful execution
    await client.query("TRUNCATE TABLE employee_import");

    // Commit transaction
    await client.query("COMMIT");

    // 6. Log import event to append-only system audit logs
    await logAuditEvent({
      employee_id: null,
      action: "IMPORT_ROSTER",
      module_name: "Import",
      performed_by: actorUuid,
      remarks: `Executed bulk employee roster import. Status: Imported: ${imported.length}, Skipped: ${skipped.length}, Failed: ${failed.length}.`,
      severity: "WARNING"
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalStaged: stagingRows.length,
        importedCount: imported.length,
        skippedCount: skipped.length,
        failedCount: failed.length
      },
      imported,
      skipped,
      failed
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction failed inside executeImport:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during transaction execution."
    });
  } finally {
    client.release();
  }
};
