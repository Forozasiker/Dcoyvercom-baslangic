# DcOyver.com Discord Bot

Discord bot for DcOyver.com server listing platform with setup system and voting.

## Features

- ✅ Prefix commands (oyver, oylar, setup)
- ✅ Slash commands (/oy-ver, /oylar)
- ✅ Setup system with modal (Administrator only)
- ✅ Category system (Public/Private/Game)
- ✅ MongoDB integration
- ✅ 24-hour vote cooldown
- ✅ Server statistics tracking

## Installation

```bash
npm install
```

## Configuration

Edit `settings.json`:

```json
{
  "MONGO_URI": "mongodb://localhost:27017/dcoyver",
  "BOT_TOKEN": "your_bot_token_here",
  "PREFIX": "!",
  "OWNER_IDS": [],
  "WEBSITE_URL": "https://dcoyver.com"
}
```

## Run

```bash
npm start
```

## Commands

### Prefix Commands
- `!setup` - Setup server (Administrator only)
- `!oyver` - Vote for the server
- `!oylar kontrol` - Check vote status
- `!oylar sıralama` - Top voters leaderboard
- `!oylar sunucu` - Server vote statistics

### Slash Commands
- `/oy-ver` - Vote for the server
- `/oylar kontrol` - Check vote status
- `/oylar sıralama` - Top voters leaderboard
- `/oylar sunucu` - Server vote statistics

## Setup System

1. Administrator runs `!setup`
2. Clicks "Setup Start" button
3. Fills modal with:
   - Server description (20-500 chars)
   - Category (public/private/game)
4. Server is added to DcOyver.com!

## Categories

- **Public** (🌐) - General community servers
- **Private** (🔒) - Private/exclusive servers
- **Game** (🎮) - Gaming servers
