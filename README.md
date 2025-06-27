# 📚 Book Club Discord Bot

A comprehensive Discord bot designed to manage book clubs with AI-powered book information, engagement tracking, and automated features.

## ✨ Features

### 🤖 AI-Powered Book Management
- **Smart Book Information**: Get detailed book summaries, benefits, and insights using AI
- **Automatic Book Analysis**: AI evaluates user takeaways and assigns quality scores
- **Discussion Generation**: AI creates thought-provoking discussion questions

### 📊 Engagement Tracking
- **Points System**: Reward users for sharing takeaways and participating
- **Quality Analysis**: Higher quality posts earn bonus points
- **Weekly & All-Time Leaderboards**: Gamify reading engagement
- **Personal Statistics**: Track individual progress and achievements

### 🔄 Automated Features
- **Daily Reading Reminders**: Automatic daily prompts to keep reading momentum
- **Weekly Leaderboards**: Automated weekly engagement summaries
- **New Member Welcome**: Greet new members with current book information

### 👑 Moderator Tools
- **Book Management**: Set current books with AI-powered information retrieval
- **Channel Configuration**: Set up dedicated channels for different features
- **Manual Point Adjustments**: Fine-tune user engagement scores

## 🚀 Commands

### Moderator Commands
- `/setbook <title> [author]` - Set the current book with AI-powered information
- `/setup channels` - Configure bot channels (reminders, leaderboard, welcome)
- `/setup view` - View current bot configuration

### User Commands
- `/bookinfo [title] [author]` - Get information about current or specific books
- `/leaderboard [type]` - View weekly or all-time engagement rankings
- `/mystats` - View personal reading statistics and achievements

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 16.0.0 or higher
- Discord Application and Bot Token
- Anthropic API Key (for AI features)

### 1. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "Bot" section:
   - Click "Add Bot"
   - Copy the **Bot Token** (keep this secret!)
   - Enable "Message Content Intent" under Privileged Gateway Intents
4. Go to "General Information":
   - Copy the **Application ID** (this is your CLIENT_ID)
5. Go to "OAuth2" > "URL Generator":
   - Select "bot" and "applications.commands" scopes
   - Select these bot permissions:
     - Read Messages/View Channels
     - Send Messages
     - Embed Links
     - Add Reactions
     - Use Slash Commands
     - Manage Messages (for moderation features)
   - Copy the generated URL and invite the bot to your server

### 2. Anthropic API Setup

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key and copy it

### 3. Local Development Setup

```bash
# Clone or download the bot files
# Create a new directory for your bot
mkdir book-club-bot
cd book-club-bot

# Copy all the bot files into this directory

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your tokens
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Deploy Commands

```bash
# Deploy slash commands to Discord
npm run deploy
```

### 5. Test Locally

```bash
# Start the bot
npm start

# Or for development with auto-restart
npm run dev
```

## 🚂 Railway Deployment

### 1. Prepare for Deployment

1. Create a GitHub repository
2. Push all your bot files to the repository
3. Make sure your `.env` file is NOT committed (it should be in `.gitignore`)

### 2. Deploy on Railway

1. Go to [Railway](https://railway.app)
2. Sign up/in with GitHub
3. Click "New Project" > "Deploy from GitHub repo"
4. Select your bot repository
5. Add environment variables:
   - Go to your project > Variables tab
   - Add each variable from your `.env` file:
     - `DISCORD_TOKEN`
     - `CLIENT_ID`
     - `ANTHROPIC_API_KEY`
     - `NODE_ENV=production`

### 3. Configure Railway Settings

1. In your Railway project settings:
   - **Start Command**: `npm start`
   - **Build Command**: `npm install`
2. The bot will automatically deploy!

### 4. Deploy Commands on Railway

After successful deployment, you need to deploy the slash commands:

1. In Railway, go to your project
2. Open the deployment logs
3. In the terminal/console section, run:
   ```bash
   npm run deploy
   ```

## 📋 Bot Configuration

### 1. Initial Setup in Discord

Once your bot is online in your server:

```
/setup channels reminders:#book-reminders leaderboard:#leaderboard welcome:#welcome
```

### 2. Set Your First Book

```
/setbook title:Atomic Habits author:James Clear
```

### 3. Test Features

- Check `/bookinfo` to see current book information
- Share a book-related message to test engagement tracking
- Use `/mystats` to see your statistics
- Check `/leaderboard` to see rankings

## 🔧 Customization

### Engagement Points Configuration

Edit `services/engagementTracker.js` to adjust the points system:

```javascript
this.pointsConfig = {
    TAKEAWAY_POST: 5,           // Base points for takeaways
    QUALITY_BONUS: 5,           // Bonus for high-quality posts
    DISCUSSION_REPLY: 3,        // Points for replies
    DAILY_ENGAGEMENT: 2,        // Daily participation bonus
    WEEKLY_GOAL_COMPLETE: 10,   // Weekly milestone bonus
    FIRST_POST_DAILY: 3         // First post of the day bonus
};
```

### Scheduled Tasks

The bot automatically:
- Sends daily reading reminders at 9 AM
- Generates weekly leaderboards on Sundays at 6 PM

To change these times, edit the cron expressions in `index.js`:

```javascript
// Daily reminder at 9 AM
cron.schedule('0 9 * * *', async () => {
    await sendDailyReminder();
});

// Weekly leaderboard on Sundays at 6 PM  
cron.schedule('0 18 * * 0', async () => {
    await generateWeeklyLeaderboard();
});
```

## 📁 Project Structure

```
book-club-bot/
├── commands/           # Slash command definitions
│   ├── setbook.js     # Set current book
│   ├── setup.js       # Configure bot settings
│   ├── leaderboard.js # View rankings
│   ├── mystats.js     # User statistics
│   └── bookinfo.js    # Book information
├── events/            # Discord event handlers
│   ├── ready.js       # Bot startup
│   ├── guildMemberAdd.js # Welcome new members
│   ├── interactionCreate.js # Handle commands
│   └── messageCreate.js # Track engagement
├── services/          # Core bot services
│   ├── bookService.js # AI book information
│   └── engagementTracker.js # Points & tracking
├── utils/             # Utility modules
│   └── database.js    # SQLite database operations
├── index.js           # Main bot file
├── deploy-commands.js # Deploy slash commands
├── package.json       # Dependencies & scripts
├── .env.example       # Environment variables template
└── README.md          # This file
```

## 🎯 Usage Examples

### For Moderators

1. **Setting a new book:**
   ```
   /setbook title:The 7 Habits of Highly Effective People author:Stephen Covey
   ```

2. **Configuring channels:**
   ```
   /setup channels reminders:#daily-reading leaderboard:#weekly-stats
   ```

3. **Viewing configuration:**
   ```
   /setup view
   ```

### For Members

1. **Checking current book:**
   ```
   /bookinfo
   ```

2. **Viewing your progress:**
   ```
   /mystats
   ```

3. **Sharing a takeaway** (just type in any channel):
   ```
   Just finished chapter 3 of Atomic Habits. The concept of habit stacking is brilliant! 
   I'm going to try linking my new reading habit to my morning coffee routine.
   ```

4. **Checking leaderboard:**
   ```
   /leaderboard type:weekly
   ```

## 🐛 Troubleshooting

### Bot Not Responding
- Check if bot is online in Discord
- Verify bot has proper permissions in channels
- Check Railway logs for errors

### Commands Not Working
- Redeploy commands: `npm run deploy`
- Check if bot has "Use Slash Commands" permission
- Verify CLIENT_ID is correct

### Database Issues
- Database is automatically created as `bookclub.db`
- On Railway, database persists between deployments
- For fresh start, delete the database file

### AI Features Not Working
- Verify ANTHROPIC_API_KEY is set correctly
- Check if you have API credits remaining
- Bot will fallback to basic features if AI fails

## 📈 Advanced Features

### Custom Book Keywords

Edit the `bookKeywords` array in `services/engagementTracker.js` to customize what content gets tracked:

```javascript
this.bookKeywords = [
    'takeaway', 'learned', 'insight', 'chapter', 'book', 'reading',
    // Add your custom keywords here
    'reflection', 'application', 'mindset'
];
```

### Adding New Commands

1. Create a new file in `/commands/`
2. Follow the existing command structure
3. Redeploy commands with `npm run deploy`

### Database Queries

Access the database directly for custom analytics:

```javascript
// Get all takeaways for a specific book
const takeaways = await client.db.all(
    'SELECT * FROM takeaways WHERE guild_id = ? AND created_at > ?',
    [guildId, bookStartDate]
);
```

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Railway deployment logs
3. Verify all environment variables are set
4. Ensure bot has proper Discord permissions

## 📄 License

MIT License - feel free to modify and distribute!

---

Happy reading! 📚✨
