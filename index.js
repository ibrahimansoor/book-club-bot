const { Client, GatewayIntentBits, Collection, EmbedBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const Database = require('./utils/database');
const BookService = require('./services/bookService');
const EngagementTracker = require('./services/engagementTracker');
require('dotenv').config();

// Create client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Collections and services
client.commands = new Collection();
client.cooldowns = new Collection();
client.db = new Database();
client.bookService = new BookService();
client.engagementTracker = new EngagementTracker(client.db);

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        }
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`✅ Loaded event: ${event.name}`);
    }
}

// Auto-deploy commands function
async function deployCommands() {
    const commands = [];
    
    // Grab all command data
    for (const [name, command] of client.commands) {
        if ('data' in command) {
            commands.push(command.data.toJSON());
        }
    }
    
    if (commands.length === 0) {
        throw new Error('No commands found to deploy');
    }
    
    // Deploy to Discord
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
    );
    
    console.log(`✅ Successfully deployed ${data.length} slash commands globally`);
    
    // List deployed commands
    commands.forEach(command => {
        console.log(`   • /${command.name} - ${command.description}`);
    });
    
    return data;
}

// Initialize database when bot is ready
client.once('ready', async () => {
    console.log(`📚 ${client.user.tag} is online and ready!`);
    console.log(`🌐 Connected to ${client.guilds.cache.size} server(s)`);
    
    // Set bot activity
    client.user.setActivity('📚 Book Club discussions', { 
        type: 4 // ActivityType.Custom in newer versions
    });

    // Initialize database
    try {
        await client.db.init();
        console.log('✅ Database initialized');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
    
    // Auto-deploy commands if environment variable is set
    if (process.env.AUTO_DEPLOY_COMMANDS === 'true') {
        console.log('🚀 Auto-deploying slash commands...');
        try {
            await deployCommands();
            console.log('✅ Slash commands deployed successfully!');
        } catch (error) {
            console.error('❌ Failed to deploy slash commands:', error);
        }
    }
    
    // Initialize database for all guilds
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            await client.db.initializeGuild(guildId);
            console.log(`📊 Initialized database for guild: ${guild.name}`);
        } catch (error) {
            console.error(`❌ Failed to initialize guild ${guild.name}:`, error);
        }
    }
    
    // Setup scheduled tasks
    setupScheduledTasks();
    
    console.log('🚀 Book Club Bot is fully operational!');
    console.log('📚 Ready to track reading engagement and manage book clubs!');
});

// Scheduled Tasks
function setupScheduledTasks() {
    // Daily reading reminder at 9 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('📅 Running daily reading reminder...');
        await sendDailyReminder();
    });
    
    // Thursday book club reminder at 6 PM
    cron.schedule('0 18 * * 4', async () => {
        console.log('📚 Running Thursday book club reminder...');
        await sendThursdayBookClubReminder();
    });
    
    // Weekly leaderboard on Sundays at 6 PM
    cron.schedule('0 18 * * 0', async () => {
        console.log('🏆 Generating weekly leaderboard...');
        await generateWeeklyLeaderboard();
    });
    
    console.log('⏰ Scheduled tasks configured');
}

// Daily reading reminder function
async function sendDailyReminder() {
    try {
        console.log('📅 Starting daily reminder process...');
        const guilds = client.guilds.cache;
        console.log(`📊 Processing ${guilds.size} guilds for daily reminders`);
        
        for (const [guildId, guild] of guilds) {
            console.log(`📚 Processing guild: ${guild.name} (${guildId})`);
            
            const currentBook = await client.db.getCurrentBook(guildId);
            const reminderChannel = await client.db.getReminderChannel(guildId);
            
            console.log(`📖 Current book: ${currentBook ? currentBook.title : 'None'}`);
            console.log(`📢 Reminder channel: ${reminderChannel ? 'Configured' : 'Not configured'}`);
            
            if (currentBook && reminderChannel) {
                const channel = guild.channels.cache.get(reminderChannel);
                if (channel) {
                    console.log(`📤 Sending daily reminder to channel: ${channel.name}`);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('📚 Daily Reading Reminder')
                        .setDescription(`Don't forget to read **${currentBook.title}** by **${currentBook.author}** today!`)
                        .setColor('#3498db')
                        .addFields(
                            { name: '📖 Current Progress', value: 'Share your thoughts and takeaways!', inline: true },
                            { name: '🎯 Goal', value: 'Keep the reading momentum going!', inline: true }
                        )
                        .setFooter({ text: 'Happy Reading! 📚' })
                        .setTimestamp();
                    
                    await channel.send({ embeds: [embed] });
                    console.log(`✅ Daily reminder sent to ${guild.name}`);
                } else {
                    console.log(`❌ Channel not found for guild: ${guild.name}`);
                }
            } else {
                if (!currentBook) {
                    console.log(`⚠️ No current book set for guild: ${guild.name}`);
                }
                if (!reminderChannel) {
                    console.log(`⚠️ No reminder channel configured for guild: ${guild.name}`);
                }
            }
        }
        console.log('✅ Daily reminder process completed');
    } catch (error) {
        console.error('❌ Error sending daily reminder:', error);
    }
}

// Thursday book club reminder function
async function sendThursdayBookClubReminder() {
    try {
        console.log('📚 Starting Thursday book club reminder process...');
        const guilds = client.guilds.cache;
        
        for (const [guildId, guild] of guilds) {
            console.log(`📚 Processing guild for Thursday reminder: ${guild.name}`);
            
            const currentBook = await client.db.getCurrentBook(guildId);
            const reminderChannel = await client.db.getReminderChannel(guildId);
            
            if (currentBook && reminderChannel) {
                const channel = guild.channels.cache.get(reminderChannel);
                if (channel) {
                    console.log(`📤 Sending Thursday reminder to channel: ${channel.name}`);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('📚 Thursday Book Club Reminder!')
                        .setDescription(`It's Thursday! Time for our book club discussion! 📖`)
                        .setColor('#e74c3c')
                        .addFields(
                            { name: '📖 Current Book', value: `**${currentBook.title}** by **${currentBook.author}**`, inline: true },
                            { name: '🕕 Time', value: 'Join us for our weekly discussion!', inline: true },
                            { name: '💬 Discussion', value: 'Share your thoughts, questions, and insights about this week\'s reading!', inline: false }
                        )
                        .setFooter({ text: 'Happy Reading and Discussing! 📚' })
                        .setTimestamp();
                    
                    await channel.send({ embeds: [embed] });
                    console.log(`✅ Thursday reminder sent to ${guild.name}`);
                }
            }
        }
        console.log('✅ Thursday book club reminder process completed');
    } catch (error) {
        console.error('❌ Error sending Thursday book club reminder:', error);
    }
}

// Weekly leaderboard function
async function generateWeeklyLeaderboard() {
    try {
        const guilds = client.guilds.cache;
        
        for (const [guildId, guild] of guilds) {
            const leaderboardChannel = await client.db.getLeaderboardChannel(guildId);
            
            if (leaderboardChannel) {
                const channel = guild.channels.cache.get(leaderboardChannel);
                if (channel) {
                    const leaderboard = await client.engagementTracker.getWeeklyLeaderboard(guildId);
                    
                    if (leaderboard.length > 0) {
                        const embed = new EmbedBuilder()
                            .setTitle('🏆 Weekly Engagement Leaderboard')
                            .setDescription('Top contributors this week!')
                            .setColor('#f1c40f')
                            .setTimestamp();
                        
                        let leaderboardText = '';
                        leaderboard.forEach((entry, index) => {
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📖';
                            const user = guild.members.cache.get(entry.userId);
                            const username = user ? user.displayName : 'Unknown User';
                            leaderboardText += `${medal} **${username}** - ${entry.points} points\n`;
                        });
                        
                        embed.addFields({ name: 'Rankings', value: leaderboardText || 'No activity this week' });
                        
                        await channel.send({ embeds: [embed] });
                        
                        // Reset weekly points
                        await client.engagementTracker.resetWeeklyPoints(guildId);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error generating weekly leaderboard:', error);
    }
}

// Error handlers
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Login
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});
