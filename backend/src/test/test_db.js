import { pool } from "../config/db.js";

const testFunction = async () => {
  try {
    const res = await pool.query("SELECT VERSION()");
    console.log(res);
  } catch (err) {
    console.log(`Error: ${err}`);
  } finally {
    await pool.end();
  }
};

testFunction();
