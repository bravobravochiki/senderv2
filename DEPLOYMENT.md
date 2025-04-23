# Deployment Guide: SpoofTube Sender Bot & Mini App

## Prerequisites

Before starting the deployment process, ensure you have:

- A Telegram account
- Access to [@BotFather](https://t.me/botfather)
- Node.js v18+ installed
- A Netlify account (for Mini App hosting)
- SSL certificate (automatically handled by Netlify)

## 1. Telegram Bot Setup

### 1.1 Create New Bot with BotFather

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the prompts to set:
   - Bot name (e.g., "SpoofTube Sender")
   - Bot username (must end in 'bot')
4. Save the provided API token securely

### 1.2 Configure Bot Settings

1. Use `/mybots` command in BotFather
2. Select your bot
3. Configure the following:
   ```
   /setdescription - Set bot description
   /setabouttext - Set bot about info
   /setuserpic - Upload bot profile picture
   /setcommands - Set available commands
   ```

4. Set bot commands:
   ```
   start - Start the bot and show main menu
   transaction - Create a new transaction
   status - Check transaction status
   history - View transaction history
   help - Show help information
   cancel - Cancel current operation
   ```

## 2. Mini App Configuration

### 2.1 Request Mini App Creation

1. Message BotFather: `/newapp`
2. Select your bot
3. Provide required information:
   - App title: "SpoofTube Sender"
   - Short name: "spooftube"
   - URL: Your Netlify deployment URL

### 2.2 Configure Mini App Settings

1. Deploy the web application to Netlify
2. Set up environment variables in your Netlify deployment:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   WEBAPP_URL=your_netlify_url
   INFURA_URL=your_infura_url
   ```

## 3. Server Deployment

### 3.1 Local Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   WEBAPP_URL=your_netlify_url
   INFURA_URL=your_infura_url
   ```

### 3.2 Production Deployment

#### Option 1: Node.js Server (e.g., DigitalOcean, Heroku)

1. Set up environment variables on your hosting platform
2. Deploy the bot server:
   ```bash
   npm install
   npm run build
   npm run bot
   ```

3. Configure process manager (e.g., PM2):
   ```bash
   npm install -g pm2
   pm2 start npm --name "telegram-bot" -- run bot
   pm2 save
   ```

#### Option 2: Serverless Deployment (e.g., Vercel, Netlify Functions)

1. Configure serverless function
2. Set up webhook URL
3. Update bot to use webhooks instead of polling

## 4. Security Implementation

### 4.1 Environment Variables

Ensure all sensitive data is stored in environment variables:
- Telegram Bot Token
- Infura URL
- Private Keys (never store in code)
- Web App URL

### 4.2 Session Management

The bot implements:
- 30-minute session timeout
- Secure state management
- Input validation
- Rate limiting

### 4.3 Transaction Security

- Private key validation
- Address validation
- Gas price checks
- Transaction confirmation steps

## 5. Testing

### 5.1 Bot Testing

Run the test suite:
```bash
npm run test
```

### 5.2 Manual Testing Checklist

- [ ] Bot starts and shows welcome message
- [ ] All commands work as expected
- [ ] Transaction flow completes successfully
- [ ] Error handling works properly
- [ ] Session timeout functions correctly
- [ ] Mini App opens from bot menu

## 6. Monitoring & Maintenance

### 6.1 Logging

The bot uses Winston for logging:
- Error tracking
- Transaction monitoring
- User activity logging

### 6.2 Performance Monitoring

Monitor:
- Response times
- Error rates
- Transaction success rates
- User engagement metrics

### 6.3 Updates & Maintenance

1. Regular dependency updates:
   ```bash
   npm update
   ```

2. Monitor bot status:
   ```bash
   pm2 status
   pm2 logs telegram-bot
   ```

## 7. Troubleshooting

### Common Issues

1. Bot not responding:
   - Check bot token
   - Verify server status
   - Check logs for errors

2. Transaction failures:
   - Verify Infura URL
   - Check gas prices
   - Validate private keys

3. Mini App issues:
   - Verify WEBAPP_URL
   - Check SSL certificate
   - Validate bot settings

## 8. Support & Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Netlify Documentation](https://docs.netlify.com)
- Project Repository README