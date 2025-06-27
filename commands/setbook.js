const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbook')
        .setDescription('Set the current book for the book club')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the book')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('author')
                .setDescription('The author of the book')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const title = interaction.options.getString('title');
            const author = interaction.options.getString('author');
            const guildId = interaction.guild.id;

            // Get book information from AI
            console.log(`Fetching book info for: ${title}${author ? ` by ${author}` : ''}`);
            const bookInfoResult = await interaction.client.bookService.getBookInfo(title, author);

            if (!bookInfoResult.success) {
                return await interaction.editReply({
                    content: `⚠️ Could not retrieve detailed information for "${title}". Using basic information instead.`,
                    ephemeral: true
                });
            }

            const bookData = bookInfoResult.data;

            // Save book to database
            await interaction.client.db.setCurrentBook(
                guildId,
                bookData.title,
                bookData.author,
                bookData.description,
                bookData.benefits
            );

            // Create announcement embed
            const embed = new EmbedBuilder()
                .setTitle('📚 New Book Club Selection!')
                .setColor('#3498db')
                .addFields(
                    { name: '📖 Title', value: bookData.title, inline: true },
                    { name: '✍️ Author', value: bookData.author, inline: true },
                    { name: '📚 Genre', value: bookData.genre || 'Unknown', inline: true },
                    { name: '📝 Description', value: bookData.description },
                    { name: '🎯 Why Read This Book?', value: bookData.benefits },
                )
                .setFooter({ text: 'Start reading and share your takeaways!' })
                .setTimestamp();

            // Add themes if available
            if (bookData.themes && bookData.themes.length > 0) {
                embed.addFields({
                    name: '🔖 Main Themes',
                    value: bookData.themes.map(theme => `• ${theme}`).join('\n'),
                    inline: false
                });
            }

            // Add key takeaways if available
            if (bookData.key_takeaways && bookData.key_takeaways.length > 0) {
                embed.addFields({
                    name: '💡 What You\'ll Learn',
                    value: bookData.key_takeaways.map(takeaway => `• ${takeaway}`).join('\n'),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

            // Send confirmation to moderator
            await interaction.followUp({
                content: `✅ Successfully set "${bookData.title}" by ${bookData.author} as the current book club selection!`,
                ephemeral: true
            });

            // Log the action
            console.log(`Book set by ${interaction.user.tag} in ${interaction.guild.name}: ${bookData.title} by ${bookData.author}`);

        } catch (error) {
            console.error('Error in setbook command:', error);
            
            const errorMessage = error.message.includes('API') 
                ? '❌ There was an issue connecting to the book information service. Please try again later.'
                : '❌ An error occurred while setting the book. Please try again.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
