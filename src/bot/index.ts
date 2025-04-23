import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { logger } from './logger';
import {
  handleStart,
  handleHelp,
  handleTransaction,
  handleCancel,
  handleMessage,
  handleCallback
} from './handlers';
import type { BotContext, CommandHandler } from './types';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.WEBAPP_URL;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!url) {
  throw new Error('WEBAPP_URL is required for webhook setup');
}

// Initialize bot with webhook in production, polling in development
const bot = new TelegramBot(token, {
  webHook: process.env.NODE_ENV === 'production'
});

// Initialize bot context
const context: BotContext = {
  activeTransactions: new Map(),
  sessions: new Map()
};

// Define command handlers
const commands: CommandHandler[] = [
  {
    command: 'start',
    description: 'Start the bot and show main menu',
    handler: handleStart
  },
  {
    command: 'help',
    description: 'Show help information',
    handler: handleHelp
  },
  {
    command: 'transaction',
    description: 'Create a new transaction',
    handler: handleTransaction
  },
  {
    command: 'cancel',
    description: 'Cancel current operation',
    handler: handleCancel
  }
];

// Setup webhook in production
if (process.env.NODE_ENV === 'production') {
  const webhookPath = '/webhook/' + token;
  const webhookUrl = url + webhookPath;

  // Remove any existing webhook
  bot.deleteWebHook()
    .then(() => {
      // Set the new webhook
      return bot.setWebHook(webhookUrl);
    })
    .then(() => {
      logger.info(`Webhook set to ${webhookUrl}`);
    })
    .catch((error) => {
      logger.error('Error setting webhook:', error);
    });

  // Handle webhook
  bot.on('webhook_error', (error) => {
    logger.error('Webhook error:', error);
  });
} else {
  // Use polling in development
  bot.startPolling()
    .then(() => {
      logger.info('Bot started polling...');
    })
    .catch((error) => {
      logger.error('Polling error:', error);
    });
}

// Register command handlers
commands.forEach(({ command, handler }) => {
  bot.onText(new RegExp(`^/${command}`), (msg) => {
    try {
      handler(bot, msg, context);
    } catch (error) {
      logger.error(`Error handling /${command}:`, error);
    }
  });
});

// Handle regular messages
bot.on('message', (msg) => {
  if (msg.text?.startsWith('/')) return; // Skip commands
  try {
    handleMessage(bot, msg, context);
  } catch (error) {
    logger.error('Error handling message:', error);
  }
});

// Handle callback queries
bot.on('callback_query', (query) => {
  try {
    handleCallback(bot, query, context);
  } catch (error) {
    logger.error('Error handling callback query:', error);
  }
});

// Set bot commands
bot.setMyCommands(commands.map(({ command, description }) => ({
  command,
  description
})));

export default bot;