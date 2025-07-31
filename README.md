# 📚 Book Club Bot

A Discord bot for managing book club activities with AI integration, daily reminders, and engagement tracking.

## 🚀 Quick Setup

### 1. Environment Variables
Create a `.env` file with:
```
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
ANTHROPIC_API_KEY=your_anthropic_api_key
AUTO_DEPLOY_COMMANDS=true
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Deploy Commands
```bash
npm run deploy
```

### 4. Start the Bot
```bash
npm start
```

## 📋 Bot Setup in Discord

### Step 1: Configure Channels
Use `/setup channels` to configure:
- **Reminders Channel**: For daily reading reminders (9 AM daily)
- **Leaderboard Channel**: For weekly leaderboards (6 PM Sundays)
- **Welcome Channel**: For welcome messages

**Example:**
```
/setup channels reminders:#book-club-reminders leaderboard:#book-club-leaderboard
```

### Step 2: Set Current Book
Use `/setbook` to set the current book:
```
/setbook title:"Atomic Habits" author:"James Clear"
```

### Step 3: Test the Setup
Use `/setup test` to send a test reminder and verify everything is working.

## 🔧 Commands

### Admin Commands
- `/setup` - Configure bot channels and settings
- `/setbook` - Set the current book for the book club
- `/setup test` - Test the reminder system

### User Commands
- `/bookinfo` - Show current book and bot status
- `/mystats` - View your reading engagement stats
- `/leaderboard` - View weekly/all-time leaderboards

## ⏰ Scheduled Features

- **Daily Reminders**: 9 AM daily reading reminders
- **Thursday Book Club**: 6 PM Thursday discussion reminders
- **Weekly Leaderboards**: 6 PM Sunday leaderboard generation

## 🐛 Troubleshooting

### Daily Reminders Not Working?
1. Check if reminder channel is configured: `/setup view`
2. Verify a book is set: `/bookinfo`
3. Test the reminder system: `/setup test`
4. Check bot logs for errors

### API Errors?
The bot will use fallback data if the AI service is unavailable. Books can still be set and reminders will work.

### Bot Not Responding?
1. Check if the bot is online
2. Verify bot permissions in Discord
3. Check console logs for errors
4. Ensure commands are deployed: `npm run deploy`

## 📊 Features

- **AI-Powered Book Information**: Get detailed book insights
- **Daily Reading Reminders**: Automated daily reminders
- **Thursday Book Club Reminders**: Special Thursday discussion reminders
- **Engagement Tracking**: Points system for participation
- **Weekly Leaderboards**: Track and reward active readers
- **Fallback System**: Works even when AI service is down

## 🔄 Recent Updates

- Fixed Anthropic API model compatibility
- Added Thursday book club reminders
- Improved error handling and fallback systems
- Enhanced logging and debugging
- Added test command for troubleshooting

## 📝 Logs

The bot provides detailed logging:
- Daily reminder execution logs
- API error handling
- Channel configuration status
- Book setting confirmations

Check the console output for detailed information about bot operations.
