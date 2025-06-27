class EngagementTracker {
    constructor(database) {
        this.db = database;
        this.pointsConfig = {
            TAKEAWAY_POST: 5,           // Base points for sharing a takeaway
            QUALITY_BONUS: 5,           // Bonus for high-quality takeaways (score 8+)
            DISCUSSION_REPLY: 3,        // Points for meaningful replies
            DAILY_ENGAGEMENT: 2,        // Points for daily participation
            WEEKLY_GOAL_COMPLETE: 10,   // Bonus for completing weekly goals
            FIRST_POST_DAILY: 3         // Bonus for first meaningful post of the day
        };
        
        // Keywords that indicate book-related content
        this.bookKeywords = [
            'takeaway', 'learned', 'insight', 'chapter', 'book', 'reading',
            'author', 'lesson', 'thought', 'reflection', 'quote', 'page',
            'concept', 'idea', 'philosophy', 'principle', 'theory',
            'understand', 'realize', 'discover', 'apply', 'implement'
        ];
    }

    async trackMessage(guildId, userId, username, message, channelId) {
        try {
            // Check if message contains book-related content
            if (!this.isBookRelated(message.content)) {
                return { tracked: false, reason: 'Not book-related content' };
            }

            // Initialize user if needed
            await this.db.initializeUser(guildId, userId, username);

            // Analyze message quality
            const currentBook = await this.db.getCurrentBook(guildId);
            const bookContext = currentBook ? `${currentBook.title} by ${currentBook.author}` : 'Current book club book';
            
            // For now, use basic scoring (can be enhanced with AI later)
            const qualityScore = this.analyzeMessageQuality(message.content);
            
            // Calculate points
            let points = this.pointsConfig.TAKEAWAY_POST;
            
            // Quality bonus
            if (qualityScore >= 8) {
                points += this.pointsConfig.QUALITY_BONUS;
            }
            
            // Daily engagement bonus
            const isFirstPostToday = await this.isFirstPostToday(guildId, userId);
            if (isFirstPostToday) {
                points += this.pointsConfig.FIRST_POST_DAILY;
            }

            // Add takeaway to database
            await this.db.addTakeaway(
                guildId, 
                userId, 
                message.id, 
                channelId, 
                message.content.substring(0, 500), // Limit content length
                points
            );

            return {
                tracked: true,
                points: points,
                qualityScore: qualityScore,
                bonuses: {
                    qualityBonus: qualityScore >= 8,
                    dailyBonus: isFirstPostToday
                }
            };

        } catch (error) {
            console.error('Error tracking message:', error);
            return { tracked: false, error: error.message };
        }
    }

    isBookRelated(content) {
        const lowerContent = content.toLowerCase();
        
        // Check for book-related keywords
        const hasBookKeywords = this.bookKeywords.some(keyword => 
            lowerContent.includes(keyword)
        );
        
        // Check for thoughtful content indicators
        const hasThoughtfulContent = [
            /\b(i think|i believe|i feel|my opinion|in my view)\b/i,
            /\b(this reminds me|this makes me think|i realized)\b/i,
            /\b(the author|the writer|the book says|according to)\b/i,
            /\b(key takeaway|main point|important lesson)\b/i
        ].some(pattern => pattern.test(content));
        
        // Check minimum length for meaningful content
        const hasMinimumLength = content.trim().length >= 30;
        
        return (hasBookKeywords || hasThoughtfulContent) && hasMinimumLength;
    }

    analyzeMessageQuality(content) {
        let score = 1;
        
        // Length scoring
        if (content.length > 50) score += 1;
        if (content.length > 100) score += 1;
        if (content.length > 200) score += 1;
        if (content.length > 300) score += 1;
        
        // Quality indicators
        const qualityPatterns = [
            /\b(because|since|therefore|however|although|while|moreover|furthermore)\b/i, // Connective words
            /\b(example|instance|experience|situation|case)\b/i, // Examples
            /\b(learn|understand|realize|discover|insight|perspective)\b/i, // Learning words
            /\b(apply|implement|use|practice|try)\b/i, // Application words
            /[.!?].*[.!?]/, // Multiple sentences
            /["'].*["']/, // Quotes
        ];
        
        qualityPatterns.forEach(pattern => {
            if (pattern.test(content)) score += 1;
        });
        
        // Personal reflection indicators
        const personalReflection = [
            /\b(i think|i believe|i feel|my opinion|personally)\b/i,
            /\b(this reminds me|this makes me think|i realized|i noticed)\b/i,
            /\b(in my experience|from my perspective|i've found)\b/i
        ];
        
        if (personalReflection.some(pattern => pattern.test(content))) {
            score += 2;
        }
        
        return Math.min(10, score);
    }

    async isFirstPostToday(guildId, userId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const sql = `SELECT COUNT(*) as count FROM takeaways 
                        WHERE guild_id = ? AND user_id = ? 
                        AND DATE(created_at) = ?`;
            
            const result = await this.db.get(sql, [guildId, userId, today]);
            return result.count === 0;
        } catch (error) {
            console.error('Error checking daily post:', error);
            return false;
        }
    }

    async getWeeklyLeaderboard(guildId, limit = 10) {
        return await this.db.getWeeklyLeaderboard(guildId, limit);
    }

    async getAllTimeLeaderboard(guildId, limit = 10) {
        return await this.db.getAllTimeLeaderboard(guildId, limit);
    }

    async getUserStats(guildId, userId) {
        return await this.db.getUserStats(guildId, userId);
    }

    async resetWeeklyPoints(guildId) {
        // Store current week's leaderboard before reset
        const leaderboard = await this.getWeeklyLeaderboard(guildId, 20);
        
        if (leaderboard.length > 0) {
            const weekEnd = new Date();
            const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            const sql = `INSERT INTO weekly_leaderboards (guild_id, week_start, week_end, leaderboard_data) 
                        VALUES (?, ?, ?, ?)`;
            
            await this.db.run(sql, [
                guildId,
                weekStart.toISOString(),
                weekEnd.toISOString(),
                JSON.stringify(leaderboard)
            ]);
        }
        
        // Reset weekly points
        return await this.db.resetWeeklyPoints(guildId);
    }

    async getEngagementStats(guildId) {
        try {
            const totalUsers = await this.db.get(
                `SELECT COUNT(*) as count FROM user_engagement WHERE guild_id = ?`,
                [guildId]
            );
            
            const activeThisWeek = await this.db.get(
                `SELECT COUNT(*) as count FROM user_engagement WHERE guild_id = ? AND weekly_points > 0`,
                [guildId]
            );
            
            const totalTakeaways = await this.db.get(
                `SELECT COUNT(*) as count FROM takeaways WHERE guild_id = ?`,
                [guildId]
            );
            
            const avgWeeklyPoints = await this.db.get(
                `SELECT AVG(weekly_points) as avg FROM user_engagement WHERE guild_id = ? AND weekly_points > 0`,
                [guildId]
            );

            return {
                totalUsers: totalUsers.count,
                activeThisWeek: activeThisWeek.count,
                totalTakeaways: totalTakeaways.count,
                avgWeeklyPoints: Math.round(avgWeeklyPoints.avg || 0)
            };
        } catch (error) {
            console.error('Error getting engagement stats:', error);
            return {
                totalUsers: 0,
                activeThisWeek: 0,
                totalTakeaways: 0,
                avgWeeklyPoints: 0
            };
        }
    }

    async addManualPoints(guildId, userId, points, reason = 'Manual adjustment') {
        try {
            await this.db.addPoints(guildId, userId, points);
            
            // Log the manual adjustment
            const sql = `INSERT INTO takeaways (guild_id, user_id, message_id, channel_id, content, points_awarded) 
                        VALUES (?, ?, ?, ?, ?, ?)`;
            
            await this.db.run(sql, [guildId, userId, 'manual', 'manual', reason, points]);
            
            return { success: true, pointsAdded: points };
        } catch (error) {
            console.error('Error adding manual points:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = EngagementTracker;
