const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        try {
            const guildId = member.guild.id;
            
            // Get welcome channel
            const welcomeChannelId = await client.db.getWelcomeChannel(guildId);
            if (!welcomeChannelId) {
                console.log(`No welcome channel configured for guild: ${member.guild.name}`);
                return;
            }

            const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
            if (!welcomeChannel) {
                console.log(`Welcome channel not found for guild: ${member.guild.name}`);
                return;
            }

            // Get current book information
            const currentBook = await client.db.getCurrentBook(guildId);
            
            const embed = new EmbedBuilder()
                .setTitle(`📚 Welcome to the Book Club, ${member.displayName}!`)
                .setColor('#2ecc71')
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();

            if (currentBook) {
                embed.setDescription(`We're excited to have you join our reading community!`)
                    .addFields(
                        {
                            name: '📖 Current Book',
                            value: `**${currentBook.title}**\nby ${currentBook.author}`,
                            inline: false
                        },
                        {
                            name: '🎯 Why This Book?',
                            value: currentBook.benefits || 'A great choice for expanding knowledge and perspective!',
                            inline: false
                        },
                        {
                            name: '🚀 How to Participate',
                            value: `• Start reading **${currentBook.title}**\n• Share your thoughts and takeaways in our discussions\n• Engage with other members' insights\n• Earn points for your contributions!`,
                            inline: false
                        },
                        {
                            name: '📊 Commands to Get Started',
                            value: '• `/mystats` - View your reading progress\n• `/leaderboard` - See top contributors\n• `/bookinfo` - Get detailed book information',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'Happy reading! Share your first takeaway to get started 📚' });

                // Add a motivational message based on the book
                const motivationalMessages = [
                    "Every page you read is a step towards growth! 🌱",
                    "Knowledge shared is knowledge multiplied! 💫",
                    "Your unique perspective will enrich our discussions! 🌟",
                    "Reading is the gateway to endless possibilities! 🚪",
                    "Join us in this journey of discovery and learning! 🗺️"
                ];
                
                const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
                embed.addFields({
                    name: '💡 Remember',
                    value: randomMessage,
                    inline: false
                });

            } else {
                embed.setDescription(`Welcome to our book club community! We're excited to have you here.`)
                    .addFields(
                        {
                            name: '📚 Getting Started',
                            value: 'We don\'t have a current book set yet, but stay tuned! Our moderators will announce our next reading selection soon.',
                            inline: false
                        },
                        {
                            name: '🎯 What You Can Do',
                            value: '• Introduce yourself to the community\n• Check out our previous discussions\n• Suggest books you\'d like to read\n• Get familiar with our commands',
                            inline: false
                        },
                        {
                            name: '📊 Useful Commands',
                            value: '• `/bookinfo [title]` - Search for book information\n• `/leaderboard` - See our most active members\n• `/mystats` - Track your engagement',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'Welcome aboard! We can\'t wait to start reading with you 📖' });
            }

            await welcomeChannel.send({ 
                content: `${member}`, // Mention the new member
                embeds: [embed] 
            });

            // Initialize user in database
            await client.db.initializeUser(guildId, member.id, member.displayName);

            console.log(`👋 Welcomed new member: ${member.displayName} to ${member.guild.name}`);

        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    },
};
