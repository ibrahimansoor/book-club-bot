const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
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

// Initialize database when bot is ready
client.once('ready', async () => {
    console.log(`📚 ${client.user.tag} is online and ready!`);
    
    // Initialize database
    await client.db.init();
    console.log('✅ Database initialized');
    
    // Setup scheduled tasks
    setupScheduledTasks();
});

// Scheduled Tasks
function setupScheduledTasks() {
    // Daily reading reminder at 9 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('📅 Running daily reading reminder...');
        await sendDailyReminder();
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
        const guilds = client.guilds.cache;
        
        for (const [guildId, guild] of guilds) {
            const currentBook = await client.db.getCurrentBook(guildId);
            const reminderChannel = await client.db.getReminderChannel(guildId);
            
            if (currentBook && reminderChannel) {
                const channel = guild.channels.cache.get(reminderChannel);
                if (channel) {
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
                }
            }
        }
    } catch (error) {
        console.error('Error sending daily reminder:', error);
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
