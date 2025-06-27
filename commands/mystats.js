const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mystats')
        .setDescription('View your book club engagement statistics'),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            // Get user stats
            const userStats = await interaction.client.engagementTracker.getUserStats(guildId, userId);

            if (!userStats) {
                return await interaction.editReply({
                    content: '📊 You haven\'t started engaging yet! Share your first book takeaway to begin tracking your progress.',
                });
            }

            // Get current book
            const currentBook = await interaction.client.db.getCurrentBook(guildId);

            // Calculate user's position in weekly and all-time leaderboards
            const weeklyLeaderboard = await interaction.client.engagementTracker.getWeeklyLeaderboard(guildId, 100);
            const allTimeLeaderboard = await interaction.client.engagementTracker.getAllTimeLeaderboard(guildId, 100);

            const weeklyPosition = weeklyLeaderboard.findIndex(entry => entry.user_id === userId) + 1;
            const allTimePosition = allTimeLeaderboard.findIndex(entry => entry.user_id === userId) + 1;

            const embed = new EmbedBuilder()
                .setTitle(`📊 ${interaction.user.displayName}'s Book Club Stats`)
                .setColor('#3498db')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp();

            // Main stats
            embed.addFields(
                {
                    name: '🏆 Total Points',
                    value: `**${userStats.points}** points`,
                    inline: true
                },
                {
                    name: '🔥 This Week',
                    value: `**${userStats.weekly_points}** points`,
                    inline: true
                },
                {
                    name: '📝 Total Takeaways',
                    value: `**${userStats.total_takeaways}** shared`,
                    inline: true
                }
            );

            // Leaderboard positions
            let positionText = '';
            if (weeklyPosition > 0) {
                positionText += `🗓️ **Weekly Rank:** #${weeklyPosition}\n`;
            }
            if (allTimePosition > 0) {
                positionText += `👑 **All-Time Rank:** #${allTimePosition}`;
            }
            
            if (positionText) {
                embed.addFields({
                    name: '📈 Your Rankings',
                    value: positionText,
                    inline: false
                });
            }

            // Progress indicators
            let progressText = '';
            
            // Points-based achievements
            if (userStats.points >= 100) {
                progressText += '🌟 **Centurion** - 100+ points earned!\n';
            } else if (userStats.points >= 50) {
                progressText += '⭐ **Half Century** - 50+ points earned!\n';
            } else if (userStats.points >= 25) {
                progressText += '🔸 **Quarter Master** - 25+ points earned!\n';
            }

            // Takeaway-based achievements
            if (userStats.total_takeaways >= 20) {
                progressText += '📚 **Wisdom Keeper** - 20+ takeaways shared!\n';
            } else if (userStats.total_takeaways >= 10) {
                progressText += '📖 **Knowledge Sharer** - 10+ takeaways shared!\n';
            } else if (userStats.total_takeaways >= 5) {
                progressText += '✏️ **Active Reader** - 5+ takeaways shared!\n';
            }

            // Weekly consistency
            if (userStats.weekly_points >= 20) {
                progressText += '🔥 **Weekly Warrior** - 20+ points this week!\n';
            } else if (userStats.weekly_points >= 10) {
                progressText += '💪 **Consistent Contributor** - 10+ points this week!\n';
            }

            if (progressText) {
                embed.addFields({
                    name: '🏅 Achievements',
                    value: progressText,
                    inline: false
                });
            }

            // Next milestone
            let nextMilestone = '';
            if (userStats.points < 25) {
                nextMilestone = `🎯 **Next Goal:** Reach 25 points for Quarter Master status (${25 - userStats.points} points to go)`;
            } else if (userStats.points < 50) {
                nextMilestone = `🎯 **Next Goal:** Reach 50 points for Half Century status (${50 - userStats.points} points to go)`;
            } else if (userStats.points < 100) {
                nextMilestone = `🎯 **Next Goal:** Reach 100 points for Centurion status (${100 - userStats.points} points to go)`;
            } else {
                nextMilestone = '🎉 **Amazing!** You\'ve reached all major milestones!';
            }

            embed.addFields({
                name: '🎯 Progress',
                value: nextMilestone,
                inline: false
            });

            // Current book context
            if (currentBook) {
                embed.setFooter({ 
                    text: `Current Book: ${currentBook.title} by ${currentBook.author}` 
                });
            }

            // Last activity
            if (userStats.last_activity) {
                const lastActivity = new Date(userStats.last_activity);
                const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
                
                let activityText = '';
                if (daysSinceActivity === 0) {
                    activityText = 'Today';
                } else if (daysSinceActivity === 1) {
                    activityText = 'Yesterday';
                } else {
                    activityText = `${daysSinceActivity} days ago`;
                }

                embed.addFields({
                    name: '⏰ Last Activity',
                    value: activityText,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in mystats command:', error);
            
            const errorMessage = '❌ An error occurred while fetching your stats. Please try again.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
