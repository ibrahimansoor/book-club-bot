const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bookinfo')
        .setDescription('Get information about the current book or search for a specific book')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Search for a specific book (leave empty for current book)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('author')
                .setDescription('Author of the book to search for')
                .setRequired(false)),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const searchTitle = interaction.options.getString('title');
            const searchAuthor = interaction.options.getString('author');
            const guildId = interaction.guild.id;

            let bookData;
            let isCurrentBook = false;

            if (!searchTitle) {
                // Get current book information
                const currentBook = await interaction.client.db.getCurrentBook(guildId);
                
                if (!currentBook) {
                    return await interaction.editReply({
                        content: '📚 No book is currently set for this book club. Ask a moderator to use `/setbook` to set one!',
                    });
                }

                bookData = {
                    title: currentBook.title,
                    author: currentBook.author,
                    description: currentBook.description,
                    benefits: currentBook.benefits,
                    start_date: currentBook.start_date
                };
                isCurrentBook = true;

            } else {
                // Search for specific book using AI
                const bookInfoResult = await interaction.client.bookService.getBookInfo(searchTitle, searchAuthor);
                
                if (!bookInfoResult.success) {
                    return await interaction.editReply({
                        content: `❌ Could not find information for "${searchTitle}"${searchAuthor ? ` by ${searchAuthor}` : ''}. Please check the title and try again.`,
                    });
                }

                bookData = bookInfoResult.data;
            }

            const embed = new EmbedBuilder()
                .setTitle(`📖 ${bookData.title}`)
                .setColor(isCurrentBook ? '#27ae60' : '#3498db')
                .setTimestamp();

            // Basic book information
            embed.addFields(
                { name: '✍️ Author', value: bookData.author, inline: true },
                { name: '📚 Genre', value: bookData.genre || 'Unknown', inline: true }
            );

            // Add current book indicator
            if (isCurrentBook) {
                embed.addFields({ name: '📌 Status', value: '✅ **Current Book Club Selection**', inline: true });
                
                // Add start date if available
                if (bookData.start_date) {
                    const startDate = new Date(bookData.start_date);
                    embed.addFields({ 
                        name: '📅 Started Reading', 
                        value: startDate.toLocaleDateString(), 
                        inline: true 
                    });
                }
            }

            // Description
            if (bookData.description) {
                embed.addFields({
                    name: '📝 Description',
                    value: bookData.description,
                    inline: false
                });
            }

            // Benefits/Why read this book
            if (bookData.benefits) {
                embed.addFields({
                    name: '🎯 Why Read This Book?',
                    value: bookData.benefits,
                    inline: false
                });
            }

            // Themes
            if (bookData.themes && bookData.themes.length > 0) {
                embed.addFields({
                    name: '🔖 Main Themes',
                    value: bookData.themes.map(theme => `• ${theme}`).join('\n'),
                    inline: true
                });
            }

            // Target audience
            if (bookData.target_audience) {
                embed.addFields({
                    name: '👥 Best For',
                    value: bookData.target_audience,
                    inline: true
                });
            }

            // Key takeaways
            if (bookData.key_takeaways && bookData.key_takeaways.length > 0) {
                embed.addFields({
                    name: '💡 Key Takeaways',
                    value: bookData.key_takeaways.map(takeaway => `• ${takeaway}`).join('\n'),
                    inline: false
                });
            }

            // If this is the current book, add engagement stats
            if (isCurrentBook) {
                const stats = await interaction.client.engagementTracker.getEngagementStats(guildId);
                
                if (stats.totalTakeaways > 0) {
                    embed.addFields({
                        name: '📊 Community Engagement',
                        value: `📝 **${stats.totalTakeaways}** takeaways shared\n👥 **${stats.activeThisWeek}** active readers this week`,
                        inline: false
                    });
                }

                embed.setFooter({ text: 'Share your takeaways and join the discussion!' });
            } else {
                embed.setFooter({ text: 'Suggest this book to your book club moderator!' });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in bookinfo command:', error);
            
            const errorMessage = error.message.includes('API') 
                ? '❌ There was an issue connecting to the book information service. Please try again later.'
                : '❌ An error occurred while fetching book information. Please try again.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
