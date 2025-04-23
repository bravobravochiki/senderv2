# SpoofTube Sender V1 - Telegram Mini App

A Telegram mini app for creating and managing token transactions with bot integration.

## Features

- Full mobile optimization with responsive design
- Native Telegram integration via TWA SDK
- Interactive bot commands for transaction management
- Offline support and data persistence
- Touch-optimized UI with haptic feedback
- Support for multiple token types
- Secure credential management
- Transaction history tracking

## Bot Commands

- `/start` - Initialize the bot and open web interface
- `/transaction` - Start a new transaction flow
- `/help` - Display help information

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure:
   - Set `TELEGRAM_BOT_TOKEN` from [@BotFather](https://t.me/botfather)
   - Configure `WEBAPP_URL` for your deployed mini app
   - Set up `INFURA_URL` for blockchain connectivity

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Start the Telegram bot:
   ```bash
   npm run bot
   ```

## Deployment

1. Build the web app:
   ```bash
   npm run build
   ```

2. Deploy the built files to your hosting service

3. Configure your bot with [@BotFather](https://t.me/botfather):
   - Set up commands
   - Configure web app URL
   - Set up menu button

4. Deploy the bot to your server:
   - Set up environment variables
   - Use PM2 or similar for process management
   - Configure SSL if needed

## Security Considerations

- All sensitive data is encrypted at rest
- Private keys are never stored in plain text
- Network requests are secured via HTTPS
- Input validation on all user data
- Rate limiting on bot commands
- Session management for web app

## Mobile-Specific Features

- Haptic feedback for interactions
- Pull-to-refresh for transaction list
- Bottom sheet for token selection
- Native share integration
- Responsive keyboard handling
- Portrait and landscape support

## Accessibility

- WCAG 2.1 compliant
- Screen reader support
- High contrast mode
- Keyboard navigation
- Touch target sizing

## Error Handling

- Offline detection and recovery
- Network error management
- Transaction failure recovery
- Input validation feedback
- Clear error messages

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details