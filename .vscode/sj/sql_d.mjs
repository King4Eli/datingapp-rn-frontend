// databaseHandler.mjs
import mysql from 'mysql2/promise';
import env from './tinder_scrape/var.json' with { type: 'json' };

export class DatabaseHandler {
    //constructor
    constructor() { this.conn = null; }

    //connect to database
    async #connect() {
        console.log("\n🟡 Connecting  SQL...");

        try {
            this.conn = await mysql.createConnection({
                host: env.tinder_tool.DB_HOST || 'localhost',
                user: env.tinder_tool.DB_USER || 'root',
                password: env.tinder_tool.DB_PASSWORD || '',
                database: env.tinder_tool.DB_DATABASE || '',
                charset: 'utf8mb4',
                //collation: 'utf8mb4_unicode_ci'
            });
            return true;
        } catch (err) {
            throw new Error(`\n❌ Database connection failed: ${err.message}`);
        }
    }

    //execute query
    async executeQuery(query, params = []) {
        try {
            if (!this.conn) {
                await this.#connect();
            }

            const [rows, fields] = await this.conn.execute(query, params);

            if (query.trim().toUpperCase().startsWith('SELECT')) {
                return rows;
            }

            return {
                status: 'success',
                affected_rows: rows.affectedRows ?? 0,
                lastrowid: rows.insertId ?? null
            };
        } catch (err) {
            throw new Error(`\n❌ Query execution failed: ${err.message}`);
        }
    }

    //close connection
    async close() {
        if (this.conn) {
            await this.conn.end();
            this.conn = null;
        }
    }

    async use(callback) {
        try {
            await this.connect();
            const result = await callback(this);
            return result;
        } finally {
            await this.close();
        }
    }
}




// await db.use(async (conn) => {
//   const rows = await conn.executeQuery('SELECT * FROM users WHERE autoIncrement = ?', [8]);
//   console.log(rows);
// });