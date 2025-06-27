const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} is online and ready!`);
        console.log(`🌐 Connected to ${client.guilds.cache.size} server(s)`);
        
        // Set bot activity
        client.user.setActivity('📚 Book Club discussions', { 
            type: ActivityType.Watching 
        });

        // Initialize database for all guilds
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                await client.db.initializeGuild(guildId);
                console.log(`📊 Initialized database for guild: ${guild.name}`);
            } catch (error) {
                console.error(`❌ Failed to initialize guild ${guild.name}:`, error);
            }
        }

        console.log('🚀 Book Club Bot is fully operational!');
        console.log('📚 Ready to track reading engagement and manage book clubs!');
    },
};
