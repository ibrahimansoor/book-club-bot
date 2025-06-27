const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View engagement leaderboards')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of leaderboard to view')
                .setRequired(false)
                .addChoices(
                    { name: 'Weekly', value: 'weekly' },
                    { name: 'All Time', value: 'alltime' }
                )),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const type = interaction.options.getString('type') || 'weekly';
            const guildId = interaction.guild.id;

            let leaderboard;
            let title;
            let description;
            let color;

            if (type === 'weekly') {
                leaderboard = await interaction.client.engagementTracker.getWeeklyLeaderboard(guildId, 10);
                title = '🏆 Weekly Engagement Leaderboard';
                description = 'Top contributors this week!';
                color = '#f1c40f';
            } else {
                leaderboard = await interaction.client.engagementTracker.getAllTimeLeaderboard(guildId, 10);
                title = '👑 All-Time Engagement Leaderboard';
                description = 'Hall of Fame - Top contributors of all time!';
                color = '#9b59b6';
            }

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color)
                .setTimestamp();

            if (leaderboard.length === 0) {
                embed.addFields({
                    name: 'No Data Available',
                    value: 'No engagement activity recorded yet. Start sharing your book takeaways!',
                    inline: false
                });
            } else {
                let leaderboardText = '';
                let medalText = '';

                for (let i = 0; i < leaderboard.length; i++) {
                    const entry = leaderboard[i];
                    const member = interaction.guild.members.cache.get(entry.user_id);
                    const username = member ? member.displayName : 'Unknown User';
                    
                    let medal;
                    if (i === 0) medal = '🥇';
                    else if (i === 1) medal = '🥈';
                    else if (i === 2) medal = '🥉';
                    else medal = `${i + 1}.`;

                    const points = type === 'weekly' ? entry.points : entry.points;
                    const extraInfo = type === 'alltime' ? ` (${entry.total_takeaways} takeaways)` : '';
                    
                    leaderboardText += `${medal} **${username}** - ${points} points${extraInfo}\n`;
                }

                embed.addFields({
                    name: 'Rankings',
                    value: leaderboardText,
                    inline: false
                });

                // Add current user's position if not in top 10
                const currentUserId = interaction.user.id;
                const userInTop10 = leaderboard.some(entry => entry.user_id === currentUserId);
                
                if (!userInTop10) {
                    const userStats = await interaction.client.engagementTracker.getUserStats(guildId, currentUserId);
                    if (userStats && userStats.points > 0) {
                        const userPoints = type === 'weekly' ? userStats.weekly_points : userStats.points;
                        if (userPoints > 0) {
                            embed.addFields({
                                name: 'Your Position',
                                value: `📊 **${interaction.user.displayName}** - ${userPoints} points`,
                                inline: false
                            });
                        }
                    }
                }
            }

            // Add book context
            const currentBook = await interaction.client.db.getCurrentBook(guildId);
            if (currentBook) {
                embed.setFooter({ 
                    text: `Current Book: ${currentBook.title} by ${currentBook.author}` 
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in leaderboard command:', error);
            
            const errorMessage = '❌ An error occurred while fetching the leaderboard. Please try again.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
