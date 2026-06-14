const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");

// Setup uploads directory path
const uploadsDir = path.join(__dirname, "..", "uploads");

// Helper to resolve employee UUID from HRMS ID
async function getActorUuid(hrms_id) {
  if (!hrms_id) return null;
  const res = await pool.query("SELECT id FROM employees WHERE UPPER(hrms_id) = $1", [hrms_id.toUpperCase()]);
  return res.rows.length > 0 ? res.rows[0].id : null;
}

// Ensure local uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("Created uploads directory at:", uploadsDir);
  } catch (err) {
    console.error("Error creating uploads directory:", err.message);
  }
}

/**
 * Upload an employee document (Base64 payload)
 * POST /api/documents/upload
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { employee_id, document_type, fileName, fileData } = req.body;

    if (!employee_id || !document_type || !fileName || !fileData) {
      return res.status(400).json({
        success: false,
        message: "employee_id, document_type, fileName, and fileData (Base64) are required fields."
      });
    }

    const actorUuid = await getActorUuid(req.user.hrms_id);
    if (!actorUuid) {
      return res.status(403).json({
        success: false,
        message: "Logged-in user profile not found."
      });
    }

    // Verify target employee exists
    const checkEmp = await pool.query("SELECT full_name FROM employees WHERE id = $1", [employee_id]);
    if (checkEmp.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target employee profile not found."
      });
    }
    const targetEmployeeName = checkEmp.rows[0].full_name;

    // Clean filename and create unique save name
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileExt = (path.extname(sanitizedFileName) || "").toLowerCase();
    
    // Check file extension against whitelist
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file extension. Only .pdf, .png, .jpg, .jpeg are allowed."
      });
    }

    // Decode base64 file data
    const base64Content = fileData.split(";base64,").pop();
    const fileBuffer = Buffer.from(base64Content, "base64");

    // Enforce 5MB limit
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (fileBuffer.length > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        message: "File size exceeds the 5MB limit."
      });
    }

    // Magic bytes verification
    // PDF: %PDF- (hex: 25 50 44 46)
    // PNG: \x89PNG (hex: 89 50 4e 47)
    // JPEG: \xff\xd8\xff (hex: ff d8 ff)
    let magicMatch = false;
    const hexHeader = fileBuffer.slice(0, 4).toString("hex").toLowerCase();

    if (fileExt === ".pdf" && hexHeader === "25504446") {
      magicMatch = true;
    } else if (fileExt === ".png" && hexHeader === "89504e47") {
      magicMatch = true;
    } else if ((fileExt === ".jpg" || fileExt === ".jpeg") && hexHeader.startsWith("ffd8ff")) {
      magicMatch = true;
    }

    if (!magicMatch) {
      return res.status(400).json({
        success: false,
        message: "File validation failed. Magic bytes do not match the expected extension."
      });
    }

    const baseName = path.basename(sanitizedFileName, fileExt);
    const uniqueSaveName = `${employee_id}_${baseName}_${Date.now()}${fileExt}`;
    const fileLocalPath = path.join(uploadsDir, uniqueSaveName);

    // Save to disk
    fs.writeFileSync(fileLocalPath, fileBuffer);

    // Relational file path stored in database
    const relativeFilePath = `/uploads/${uniqueSaveName}`;

    // Insert into DB
    const insertQuery = `
      INSERT INTO employee_documents (employee_id, document_type, file_url, uploaded_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [employee_id, document_type, relativeFilePath]);
    const documentRecord = result.rows[0];

    // Log to system audit trail
    await logAuditEvent({
      employee_id: employee_id,
      action: "UPLOAD_DOCUMENT",
      module_name: "Documents",
      performed_by: actorUuid,
      remarks: `Uploaded ${document_type} file (${fileName}) for employee ${targetEmployeeName}. Path: ${relativeFilePath}`,
      severity: "INFO"
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded and registered successfully",
      data: documentRecord
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving uploaded document."
    });
  }
};

/**
 * Get all documents for a specific employee
 * GET /api/documents/:employee_id
 */
exports.getEmployeeDocuments = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const selectQuery = `
      SELECT * FROM employee_documents
      WHERE employee_id = $1
      ORDER BY uploaded_at DESC;
    `;
    const result = await pool.query(selectQuery, [employee_id]);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching dossier documents."
    });
  }
};

/**
 * Delete a document from server and DB
 * DELETE /api/documents/:id
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const actorUuid = await getActorUuid(req.user.hrms_id);
    if (!actorUuid) {
      return res.status(403).json({
        success: false,
        message: "User profile not found."
      });
    }

    // Get the document record
    const selectQuery = `SELECT * FROM employee_documents WHERE id = $1;`;
    const result = await pool.query(selectQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document record not found"
      });
    }

    const doc = result.rows[0];

    // Attempt to delete physical file from server
    if (doc.file_url) {
      // file_url is /uploads/unique_filename.ext
      const fileName = path.basename(doc.file_url);
      const filePath = path.join(uploadsDir, fileName);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log("Physical file deleted:", filePath);
        } catch (fileErr) {
          console.error("Could not delete physical file:", filePath, fileErr.message);
          // Keep going to remove the DB record in case of mismatch
        }
      }
    }

    // Delete DB record
    await pool.query("DELETE FROM employee_documents WHERE id = $1;", [id]);

    // Log to system audit trail
    await logAuditEvent({
      employee_id: doc.employee_id,
      action: "DELETE_DOCUMENT",
      module_name: "Documents",
      performed_by: actorUuid,
      remarks: `Deleted document ID ${id} (${doc.document_type}). Path was: ${doc.file_url}`,
      severity: "WARNING"
    });

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting document"
    });
  }
};
