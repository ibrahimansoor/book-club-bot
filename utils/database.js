const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(path.join(__dirname, '..', 'bookclub.db'), (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const tables = [
            // Guild settings
            `CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id TEXT PRIMARY KEY,
                reminder_channel_id TEXT,
                leaderboard_channel_id TEXT,
                welcome_channel_id TEXT,
                moderator_role_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Current books per guild
            `CREATE TABLE IF NOT EXISTS current_books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                description TEXT,
                benefits TEXT,
                current_chapter TEXT,
                start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (guild_id) REFERENCES guild_settings (guild_id)
            )`,
            
            // User engagement tracking
            `CREATE TABLE IF NOT EXISTS user_engagement (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                user_id TEXT,
                username TEXT,
                points INTEGER DEFAULT 0,
                weekly_points INTEGER DEFAULT 0,
                total_takeaways INTEGER DEFAULT 0,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Individual takeaways/posts
            `CREATE TABLE IF NOT EXISTS takeaways (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                user_id TEXT,
                message_id TEXT,
                channel_id TEXT,
                content TEXT,
                points_awarded INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Weekly leaderboard history
            `CREATE TABLE IF NOT EXISTS weekly_leaderboards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                week_start DATETIME,
                week_end DATETIME,
                leaderboard_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }
        console.log('✅ Database tables created/verified');
    }

    // Helper method to run SQL queries
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Helper method to get single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Helper method to get all rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Guild Settings Methods
    async initializeGuild(guildId) {
        try {
            const sql = `INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)`;
            return await this.run(sql, [guildId]);
        } catch (error) {
            console.error(`Error initializing guild ${guildId}:`, error);
            throw error;
        }
    }

    async setReminderChannel(guildId, channelId) {
        await this.initializeGuild(guildId);
        const sql = `UPDATE guild_settings SET reminder_channel_id = ? WHERE guild_id = ?`;
        return await this.run(sql, [channelId, guildId]);
    }

    async setLeaderboardChannel(guildId, channelId) {
        await this.initializeGuild(guildId);
        const sql = `UPDATE guild_settings SET leaderboard_channel_id = ? WHERE guild_id = ?`;
        return await this.run(sql, [channelId, guildId]);
    }

    async setWelcomeChannel(guildId, channelId) {
        await this.initializeGuild(guildId);
        const sql = `UPDATE guild_settings SET welcome_channel_id = ? WHERE guild_id = ?`;
        return await this.run(sql, [channelId, guildId]);
    }

    async getReminderChannel(guildId) {
        const result = await this.get(`SELECT reminder_channel_id FROM guild_settings WHERE guild_id = ?`, [guildId]);
        return result?.reminder_channel_id;
    }

    async getLeaderboardChannel(guildId) {
        const result = await this.get(`SELECT leaderboard_channel_id FROM guild_settings WHERE guild_id = ?`, [guildId]);
        return result?.leaderboard_channel_id;
    }

    async getWelcomeChannel(guildId) {
        const result = await this.get(`SELECT welcome_channel_id FROM guild_settings WHERE guild_id = ?`, [guildId]);
        return result?.welcome_channel_id;
    }

    // Book Management Methods
    async setCurrentBook(guildId, title, author, description, benefits, chapter = null) {
        // Deactivate current book
        await this.run(`UPDATE current_books SET is_active = 0 WHERE guild_id = ? AND is_active = 1`, [guildId]);
        
        // Add new book
        const sql = `INSERT INTO current_books (guild_id, title, author, description, benefits, current_chapter) VALUES (?, ?, ?, ?, ?, ?)`;
        return await this.run(sql, [guildId, title, author, description, benefits, chapter]);
    }

    async getCurrentBook(guildId) {
        const sql = `SELECT * FROM current_books WHERE guild_id = ? AND is_active = 1 ORDER BY start_date DESC LIMIT 1`;
        return await this.get(sql, [guildId]);
    }

    async updateCurrentChapter(guildId, chapter) {
        const sql = `UPDATE current_books SET current_chapter = ? WHERE guild_id = ? AND is_active = 1`;
        return await this.run(sql, [chapter, guildId]);
    }

    // User Engagement Methods
    async initializeUser(guildId, userId, username) {
        const sql = `INSERT OR IGNORE INTO user_engagement (guild_id, user_id, username) VALUES (?, ?, ?)`;
        return await this.run(sql, [guildId, userId, username]);
    }

    async addPoints(guildId, userId, points) {
        await this.initializeUser(guildId, userId, 'Unknown');
        const sql = `UPDATE user_engagement 
                     SET points = points + ?, 
                         weekly_points = weekly_points + ?,
                         last_activity = CURRENT_TIMESTAMP 
                     WHERE guild_id = ? AND user_id = ?`;
        return await this.run(sql, [points, points, guildId, userId]);
    }

    async addTakeaway(guildId, userId, messageId, channelId, content, points = 5) {
        // Add takeaway record
        const takeawaySql = `INSERT INTO takeaways (guild_id, user_id, message_id, channel_id, content, points_awarded) 
                            VALUES (?, ?, ?, ?, ?, ?)`;
        await this.run(takeawaySql, [guildId, userId, messageId, channelId, content, points]);
        
        // Update user engagement
        await this.addPoints(guildId, userId, points);
        
        // Increment takeaway count
        const updateSql = `UPDATE user_engagement 
                          SET total_takeaways = total_takeaways + 1 
                          WHERE guild_id = ? AND user_id = ?`;
        return await this.run(updateSql, [guildId, userId]);
    }

    async getWeeklyLeaderboard(guildId, limit = 10) {
        const sql = `SELECT user_id, username, weekly_points as points 
                     FROM user_engagement 
                     WHERE guild_id = ? AND weekly_points > 0 
                     ORDER BY weekly_points DESC 
                     LIMIT ?`;
        return await this.all(sql, [guildId, limit]);
    }

    async getAllTimeLeaderboard(guildId, limit = 10) {
        const sql = `SELECT user_id, username, points, total_takeaways 
                     FROM user_engagement 
                     WHERE guild_id = ? AND points > 0 
                     ORDER BY points DESC 
                     LIMIT ?`;
        return await this.all(sql, [guildId, limit]);
    }

    async resetWeeklyPoints(guildId) {
        const sql = `UPDATE user_engagement SET weekly_points = 0 WHERE guild_id = ?`;
        return await this.run(sql, [guildId]);
    }

    async getUserStats(guildId, userId) {
        const sql = `SELECT * FROM user_engagement WHERE guild_id = ? AND user_id = ?`;
        return await this.get(sql, [guildId, userId]);
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;
