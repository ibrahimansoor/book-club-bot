const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Ignore bot messages and system messages
        if (message.author.bot || message.system) return;
        
        // Only process guild messages
        if (!message.guild) return;

        // Skip if database isn't initialized
        if (!client.db || !client.engagementTracker) {
            console.log('⚠️ Database or engagement tracker not initialized');
            return;
        }

        try {
            const guildId = message.guild.id;
            const userId = message.author.id;
            const username = message.member?.displayName || message.author.username;

            console.log(`📝 Processing message from ${username}: "${message.content.substring(0, 50)}..."`);

            // Track the message for engagement
            const trackingResult = await client.engagementTracker.trackMessage(
                guildId, 
                userId, 
                username, 
                message, 
                message.channel.id
            );

            console.log(`📊 Tracking result for ${username}:`, trackingResult);

            // If message was tracked and earned points, send feedback
            if (trackingResult.tracked && trackingResult.points > 0) {
                console.log(`✅ Successfully tracked message from ${username} for ${trackingResult.points} points`);
                
                // Send a subtle reaction to acknowledge the contribution
                try {
                    await message.react('📚');
                    
                    // For high-quality posts, add bonus reactions
                    if (trackingResult.bonuses?.qualityBonus) {
                        await message.react('⭐');
                    }
                    
                    if (trackingResult.bonuses?.dailyBonus) {
                        await message.react('🔥');
                    }

                } catch (reactionError) {
                    console.log('Could not add reaction:', reactionError.message);
                }

                // Send point notifications more frequently for testing
                const shouldNotify = Math.random() < 0.7; // 70% chance for testing
                
                if (shouldNotify || trackingResult.points >= 8) {
                    const pointsEmoji = trackingResult.points >= 10 ? '🏆' : trackingResult.points >= 8 ? '⭐' : '📖';
                    
                    const embed = new EmbedBuilder()
                        .setColor('#2ecc71')
                        .setDescription(`${pointsEmoji} **+${trackingResult.points} points** for sharing your insights!`)
                        .setFooter({ text: 'Use /mystats to see your progress' });

                    // Add bonus explanation if applicable
                    if (trackingResult.bonuses?.qualityBonus || trackingResult.bonuses?.dailyBonus) {
                        let bonusText = '';
                        if (trackingResult.bonuses.qualityBonus) {
                            bonusText += '⭐ Quality bonus! ';
                        }
                        if (trackingResult.bonuses.dailyBonus) {
                            bonusText += '🔥 First post today! ';
                        }
                        embed.addFields({
                            name: 'Bonus Points',
                            value: bonusText.trim(),
                            inline: false
                        });
                    }

                    try {
                        await message.reply({ embeds: [embed] });
                    } catch (replyError) {
                        console.log('Could not send points notification:', replyError.message);
                    }
                }
            } else {
                console.log(`❌ Message from ${username} NOT tracked. Reason:`, trackingResult.reason || 'Unknown reason');
                
                // Log the content analysis for debugging
                if (trackingResult.reason === 'Not book-related content') {
                    console.log(`📄 Message content: "${message.content}"`);
                    console.log(`📏 Content length: ${message.content.length}`);
                }
            }

        } catch (error) {
            console.error('❌ Error in messageCreate event:', error);
        }
    },
};
