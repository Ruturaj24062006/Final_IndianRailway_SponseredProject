const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT,
    database: process.env.SUPABASE_DB_NAME,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false,
    },
});

pool.connect()
    .then(() => console.log("Database Connected ✅"))
    .catch((err) => console.log("Database Error ❌", err));

pool.on("error", (err) => {
    console.error("Unexpected error on idle database client:", err);
});

module.exports = pool;