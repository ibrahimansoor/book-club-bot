# 🚀 Book Club Bot Setup Guide

## Step 1: Discord Bot Setup

### 1. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Book Club Bot")
3. Go to the "Bot" section and click "Add Bot"
4. Copy the **Bot Token** (keep this secret!)

### 2. Get Application ID
1. In the same Discord Developer Portal
2. Go to "General Information"
3. Copy the **Application ID** (this is your CLIENT_ID)

### 3. Set Bot Permissions
1. Go to "OAuth2" > "URL Generator"
2. Select these scopes:
   - `bot`
   - `applications.commands`
3. Select these bot permissions:
   - Read Messages/View Channels
   - Send Messages
   - Embed Links
   - Add Reactions
   - Use Slash Commands
   - Manage Messages
4. Copy the generated URL and invite the bot to your server

## Step 2: Anthropic API Setup

### 1. Get Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key and copy it

## Step 3: Environment Configuration

### 1. Create .env File
Create a `.env` file in your project root with:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here

# Anthropic AI API (for book information)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Bot Settings
AUTO_DEPLOY_COMMANDS=true

# Optional: Set to 'production' for deployment
NODE_ENV=development
```

### 2. Replace the placeholders:
- `your_discord_bot_token_here` → Your Discord Bot Token
- `your_discord_client_id_here` → Your Discord Application ID
- `your_anthropic_api_key_here` → Your Anthropic API Key

## Step 4: Deploy Commands

Run this command to deploy slash commands to Discord:
```bash
npm run deploy
```

## Step 5: Start the Bot

Start the bot with:
```bash
npm start
```

## Step 6: Configure in Discord

### 1. Set up Channels
Use the `/setup` command to configure channels:
```
/setup channels reminders:#your-book-club-channel
```

### 2. Set a Book
Use `/setbook` to set the current book:
```
/setbook title:"Atomic Habits" author:"James Clear"
```

### 3. Test the System
Use `/setup test` to verify everything is working.

## Troubleshooting

### Bot Not Starting?
- Check if `.env` file exists and has correct values
- Verify Discord token is valid
- Ensure bot is invited to your server

### Commands Not Working?
- Run `npm run deploy` to deploy slash commands
- Check if bot has proper permissions
- Verify CLIENT_ID is correct

### API Errors?
- Check if Anthropic API key is valid
- Bot will use fallback data if API fails
- Books can still be set without API

### Daily Reminders Not Working?
- Use `/setup view` to check channel configuration
- Use `/setup test` to test the reminder system
- Check bot logs for errors

## Commands Reference

### Admin Commands
- `/setup` - Configure bot channels and settings
- `/setbook` - Set the current book for the book club
- `/setup test` - Test the reminder system

### User Commands
- `/bookinfo` - Show current book and bot status
- `/mystats` - View your reading engagement stats
- `/leaderboard` - View weekly/all-time leaderboards

## Scheduled Features

- **Daily Reminders**: 9 AM daily reading reminders
- **Thursday Book Club**: 6 PM Thursday discussion reminders
- **Weekly Leaderboards**: 6 PM Sunday leaderboard generation

## Support

If you encounter issues:
1. Check this setup guide
2. Verify all environment variables are set
3. Ensure bot has proper Discord permissions
4. Check console logs for detailed error messages 