import pg from "pg";
// null when DATABASE_URL is not set (tests / UI-only runs). Callers must handle that.
export const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL }) : null;
