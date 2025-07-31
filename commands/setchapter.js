const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchapter')
        .setDescription('Update the current chapter for the book club')
        .addStringOption(option =>
            option.setName('chapter')
                .setDescription('Current chapter being read (e.g., "Chapter 3" or "Chapters 5-7")')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const chapter = interaction.options.getString('chapter');
            const guildId = interaction.guild.id;

            // Get current book
            const currentBook = await interaction.client.db.getCurrentBook(guildId);
            
            if (!currentBook) {
                return await interaction.editReply({
                    content: '❌ No current book is set. Please use `/setbook` to set a book first.',
                    ephemeral: true
                });
            }

            // Update the chapter
            await interaction.client.db.updateCurrentChapter(guildId, chapter);

            // Create confirmation embed
            const embed = new EmbedBuilder()
                .setTitle('📖 Chapter Updated!')
                .setColor('#27ae60')
                .addFields(
                    { name: '📚 Book', value: `**${currentBook.title}** by **${currentBook.author}**`, inline: true },
                    { name: '📖 Current Chapter', value: `**${chapter}**`, inline: true },
                    { name: '📝 Reminder', value: 'Bring your notes and insights to Thursday\'s discussion!', inline: false }
                )
                .setFooter({ text: 'Happy Reading! 📚' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // Send confirmation to moderator
            await interaction.followUp({
                content: `✅ Successfully updated current chapter to **${chapter}** for "${currentBook.title}"!`,
                ephemeral: true
            });

            // Log the action
            console.log(`Chapter updated by ${interaction.user.tag} in ${interaction.guild.name}: ${currentBook.title} - Chapter: ${chapter}`);

        } catch (error) {
            console.error('Error in setchapter command:', error);
            
            const errorMessage = '❌ An error occurred while updating the chapter. Please try again.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
}; 