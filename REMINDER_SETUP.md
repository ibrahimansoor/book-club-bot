# 📚 Book Club Reminder Setup Guide

## 🎯 **Step-by-Step Setup**

### Step 1: Configure Reminder Channel
In your Discord server, run this command:
```
/setup channels reminders:#book-club
```

### Step 2: Set Your Current Book
Set the book you're reading with the current chapter:
```
/setbook title:"8 weeks to sales greatness" author:"Joe Nolan" chapter:"Chapter 3"
```

### Step 3: Test the Setup
Verify everything is working:
```
/setup test
```

### Step 4: Check Current Status
View your current configuration:
```
/bookinfo
```

## ⏰ **What You'll Get:**

### Daily Reminders (9 AM every day)
**Channel**: `#book-club`
**Message**: 
```
📚 Daily Reading Reminder
Don't forget to read **8 weeks to sales greatness** by **Joe Nolan** today!
📖 **Current Chapter:** Chapter 3

📖 Current Progress: Share your thoughts and takeaways!
🎯 Goal: Keep the reading momentum going!
```

### Thursday Reminders (9 AM Thursdays)
**Channel**: `#book-club`
**Message**:
```
📚 Thursday Book Club Reminder!
It's Thursday! Time for our book club discussion! 📖
📖 **Current Chapter:** Chapter 3

📖 Current Book: **8 weeks to sales greatness** by **Joe Nolan**
🕕 Time: Join us for our weekly discussion!
📝 Bring Your Notes: Come prepared with your insights, questions, and takeaways from this week's reading!
💬 Discussion: Share your thoughts, questions, and insights about this week's reading!
```

## 🔧 **Update Chapters as You Progress**

When you move to a new chapter:
```
/setchapter chapter:"Chapter 4"
```

## 📋 **Troubleshooting**

### If commands don't work:
1. Check if the bot is online in your Discord server
2. Try `/bookinfo` to see if the bot responds
3. Check Railway dashboard for deployment status

### If reminders aren't sending:
1. Verify the channel is configured: `/setup view`
2. Test the reminder system: `/setup test`
3. Check bot logs in Railway dashboard

## 🎉 **That's It!**

Once you complete these steps, you'll have:
- ✅ Daily reading reminders at 9 AM
- ✅ Thursday discussion reminders at 9 AM
- ✅ Chapter tracking and updates
- ✅ "Bring Your Notes" reminders for Thursday discussions 