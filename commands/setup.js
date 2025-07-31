const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure book club bot settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('Set up bot channels')
                .addChannelOption(option =>
                    option.setName('reminders')
                        .setDescription('Channel for daily reading reminders')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('leaderboard')
                        .setDescription('Channel for weekly leaderboards')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('welcome')
                        .setDescription('Channel for welcome messages')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current bot configuration'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test the reminder system'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guild.id;

            if (subcommand === 'channels') {
                const reminderChannel = interaction.options.getChannel('reminders');
                const leaderboardChannel = interaction.options.getChannel('leaderboard');
                const welcomeChannel = interaction.options.getChannel('welcome');

                let updatedChannels = [];

                // Update reminder channel
                if (reminderChannel) {
                    await interaction.client.db.setReminderChannel(guildId, reminderChannel.id);
                    updatedChannels.push(`📅 **Reminders:** ${reminderChannel}`);
                }

                // Update leaderboard channel
                if (leaderboardChannel) {
                    await interaction.client.db.setLeaderboardChannel(guildId, leaderboardChannel.id);
                    updatedChannels.push(`🏆 **Leaderboard:** ${leaderboardChannel}`);
                }

                // Update welcome channel
                if (welcomeChannel) {
                    await interaction.client.db.setWelcomeChannel(guildId, welcomeChannel.id);
                    updatedChannels.push(`👋 **Welcome:** ${welcomeChannel}`);
                }

                if (updatedChannels.length === 0) {
                    return await interaction.editReply({
                        content: '❌ Please specify at least one channel to configure.\n\n**Example:** `/setup channels reminders:#book-club-reminders`',
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle('✅ Book Club Bot Configuration Updated')
                    .setDescription('The following channels have been configured:')
                    .addFields({
                        name: 'Updated Channels',
                        value: updatedChannels.join('\n'),
                        inline: false
                    })
                    .setColor('#2ecc71')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

            } else if (subcommand === 'view') {
                // Get current configuration
                const reminderChannelId = await interaction.client.db.getReminderChannel(guildId);
                const leaderboardChannelId = await interaction.client.db.getLeaderboardChannel(guildId);
                const welcomeChannelId = await interaction.client.db.getWelcomeChannel(guildId);
                const currentBook = await interaction.client.db.getCurrentBook(guildId);

                const reminderChannel = reminderChannelId ? interaction.guild.channels.cache.get(reminderChannelId) : null;
                const leaderboardChannel = leaderboardChannelId ? interaction.guild.channels.cache.get(leaderboardChannelId) : null;
                const welcomeChannel = welcomeChannelId ? interaction.guild.channels.cache.get(welcomeChannelId) : null;

                const embed = new EmbedBuilder()
                    .setTitle('📚 Book Club Bot Configuration')
                    .setColor('#3498db')
                    .addFields(
                        {
                            name: '📅 Daily Reminders Channel',
                            value: reminderChannel ? `${reminderChannel}` : '❌ Not configured',
                            inline: true
                        },
                        {
                            name: '🏆 Leaderboard Channel',
                            value: leaderboardChannel ? `${leaderboardChannel}` : '❌ Not configured',
                            inline: true
                        },
                        {
                            name: '👋 Welcome Channel',
                            value: welcomeChannel ? `${welcomeChannel}` : '❌ Not configured',
                            inline: true
                        },
                        {
                            name: '📖 Current Book',
                            value: currentBook ? `**${currentBook.title}** by ${currentBook.author}` : '❌ No book set',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'Use /setup channels to configure missing channels' })
                    .setTimestamp();

                // Add engagement stats
                const stats = await interaction.client.engagementTracker.getEngagementStats(guildId);
                embed.addFields({
                    name: '📊 Engagement Stats',
                    value: `👥 **Total Users:** ${stats.totalUsers}\n🔥 **Active This Week:** ${stats.activeThisWeek}\n📝 **Total Takeaways:** ${stats.totalTakeaways}`,
                    inline: false
                });

                // Add setup instructions if channels are missing
                if (!reminderChannel || !leaderboardChannel) {
                    embed.addFields({
                        name: '🔧 Setup Instructions',
                        value: 'To get the bot working properly:\n1. Use `/setup channels reminders:#your-channel`\n2. Use `/setup channels leaderboard:#your-channel`\n3. Use `/setbook` to set a current book',
                        inline: false
                    });
                }

                await interaction.editReply({ embeds: [embed] });

            } else if (subcommand === 'test') {
                const reminderChannelId = await interaction.client.db.getReminderChannel(guildId);
                const currentBook = await interaction.client.db.getCurrentBook(guildId);

                if (!reminderChannelId) {
                    return await interaction.editReply({
                        content: '❌ No reminder channel configured! Please use `/setup channels reminders:#your-channel` first.',
                    });
                }

                if (!currentBook) {
                    return await interaction.editReply({
                        content: '❌ No current book set! Please use `/setbook` to set a book first.',
                    });
                }

                const channel = interaction.guild.channels.cache.get(reminderChannelId);
                if (!channel) {
                    return await interaction.editReply({
                        content: '❌ Reminder channel not found! Please reconfigure the reminder channel.',
                    });
                }

                // Send test reminder
                const { EmbedBuilder } = require('discord.js');
                const testEmbed = new EmbedBuilder()
                    .setTitle('🧪 Test Reminder')
                    .setDescription('This is a test reminder to verify the bot is working correctly!')
                    .setColor('#f39c12')
                    .addFields(
                        { name: '📖 Current Book', value: `**${currentBook.title}** by **${currentBook.author}**`, inline: true },
                        { name: '📢 Channel', value: `${channel}`, inline: true },
                        { name: '✅ Status', value: 'Bot is working correctly!', inline: true }
                    )
                    .setFooter({ text: 'Test reminder sent via /setup test' })
                    .setTimestamp();

                await channel.send({ embeds: [testEmbed] });
                await interaction.editReply({
                    content: `✅ Test reminder sent to ${channel}! The bot is working correctly.`,
                });

            }

        } catch (error) {
            console.error('Error in setup command:', error);
            
            const errorMessage = '❌ An error occurred while updating the configuration. Please try again.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
