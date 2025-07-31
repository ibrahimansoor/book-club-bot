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

            let bookData;
            let usingFallback = false;

            if (!bookInfoResult.success) {
                console.log('Using fallback book data due to API error');
                usingFallback = true;
                bookData = bookInfoResult.data;
            } else {
                bookData = bookInfoResult.data;
            }

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
                .setColor(usingFallback ? '#e74c3c' : '#3498db')
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

            // Add warning if using fallback data
            if (usingFallback) {
                embed.addFields({
                    name: '⚠️ Note',
                    value: 'Limited book information available due to API issues. The book has been set successfully, but detailed information may be incomplete.',
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

            // Send confirmation to moderator
            const confirmationMessage = usingFallback 
                ? `✅ Successfully set "${bookData.title}" by ${bookData.author} as the current book club selection! (Limited information due to API issues)`
                : `✅ Successfully set "${bookData.title}" by ${bookData.author} as the current book club selection!`;

            await interaction.followUp({
                content: confirmationMessage,
                ephemeral: true
            });

            // Log the action
            console.log(`Book set by ${interaction.user.tag} in ${interaction.guild.name}: ${bookData.title} by ${bookData.author}`);

            // Check if reminder channel is configured
            const reminderChannel = await interaction.client.db.getReminderChannel(guildId);
            if (!reminderChannel) {
                await interaction.followUp({
                    content: '💡 **Tip:** Use `/setup channels reminders:#your-channel` to configure daily reminders for this book!',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('Error in setbook command:', error);
            
            let errorMessage = '❌ An error occurred while setting the book. Please try again.';
            
            if (error.message.includes('API') || error.message.includes('anthropic')) {
                errorMessage = '❌ There was an issue connecting to the book information service. The book has been set with basic information.';
            } else if (error.message.includes('database')) {
                errorMessage = '❌ There was an issue saving the book to the database. Please try again.';
            }
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
