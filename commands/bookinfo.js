const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bookinfo')
        .setDescription('Show information about the current book and bot status'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const guildId = interaction.guild.id;
            const currentBook = await interaction.client.db.getCurrentBook(guildId);
            const reminderChannel = await interaction.client.db.getReminderChannel(guildId);
            const leaderboardChannel = await interaction.client.db.getLeaderboardChannel(guildId);

            const embed = new EmbedBuilder()
                .setTitle('📚 Book Club Status')
                .setColor('#3498db')
                .setTimestamp();

            if (currentBook) {
                embed.addFields(
                    { name: '📖 Current Book', value: `**${currentBook.title}** by **${currentBook.author}**`, inline: true },
                    { name: '📅 Started', value: new Date(currentBook.start_date).toLocaleDateString(), inline: true },
                    { name: '📝 Description', value: currentBook.description || 'No description available', inline: false }
                );

                if (currentBook.current_chapter) {
                    embed.addFields({
                        name: '📖 Current Chapter',
                        value: `**${currentBook.current_chapter}** - Bring your notes to Thursday's discussion!`,
                        inline: false
                    });
                }

                if (currentBook.benefits) {
                    embed.addFields({
                        name: '🎯 Benefits',
                        value: currentBook.benefits,
                        inline: false
                    });
                }
            } else {
                embed.addFields({
                    name: '📖 Current Book',
                    value: '❌ No book currently set\nUse `/setbook` to set a book',
                    inline: false
                });
            }

            // Channel configuration status
            const channelStatus = [];
            if (reminderChannel) {
                const channel = interaction.guild.channels.cache.get(reminderChannel);
                channelStatus.push(`✅ **Daily Reminders:** ${channel || 'Channel not found'}`);
            } else {
                channelStatus.push('❌ **Daily Reminders:** Not configured');
            }

            if (leaderboardChannel) {
                const channel = interaction.guild.channels.cache.get(leaderboardChannel);
                channelStatus.push(`✅ **Weekly Leaderboard:** ${channel || 'Channel not found'}`);
            } else {
                channelStatus.push('❌ **Weekly Leaderboard:** Not configured');
            }

            embed.addFields({
                name: '📢 Channel Configuration',
                value: channelStatus.join('\n'),
                inline: false
            });

            // Bot status
            const botStatus = [];
            botStatus.push(`🟢 **Bot Status:** Online`);
            botStatus.push(`⏰ **Daily Reminders:** ${reminderChannel ? 'Configured (9 AM daily)' : 'Not configured'}`);
            botStatus.push(`📚 **Thursday Reminders:** ${reminderChannel ? 'Configured (6 PM Thursdays)' : 'Not configured'}`);
            botStatus.push(`🏆 **Weekly Leaderboard:** ${leaderboardChannel ? 'Configured (6 PM Sundays)' : 'Not configured'}`);

            embed.addFields({
                name: '🤖 Bot Status',
                value: botStatus.join('\n'),
                inline: false
            });

            // Setup instructions if needed
            if (!currentBook || !reminderChannel) {
                embed.addFields({
                    name: '🔧 Setup Instructions',
                    value: !currentBook 
                        ? '1. Use `/setbook` to set a current book\n2. Use `/setup channels reminders:#your-channel` to configure reminders'
                        : 'Use `/setup channels reminders:#your-channel` to configure daily reminders',
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in bookinfo command:', error);
            
            const errorMessage = '❌ An error occurred while fetching book information.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
