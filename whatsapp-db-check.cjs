require("dotenv").config();
const pool = require("./backend/db");

(async () => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS db, current_schema() AS schema, current_setting('search_path') AS search_path, to_regclass('public.whatsapp_sessions') AS table_present"
    );
    console.log(result.rows[0]);
  } catch (e) {
    console.error(e.message);
  } finally {
    await pool.end();
  }
})();
