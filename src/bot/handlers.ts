import TelegramBot from 'node-telegram-bot-api';
import { ethers } from 'ethers';
import { SUPPORTED_TOKENS } from '../config/tokens';
import { logger } from './logger';
import { createMainMenu, createTokenMenu, createConfirmationMenu } from './menus';
import type { BotContext, UserSession, SessionState } from './types';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export async function handleStart(bot: TelegramBot, msg: TelegramBot.Message, context: BotContext) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId) {
    await bot.sendMessage(chatId, 'Error: Could not identify user');
    return;
  }

  // Initialize or reset user session
  const session: UserSession = {
    userId,
    chatId,
    state: 'IDLE',
    data: {},
    lastActivity: Date.now(),
    authenticated: false
  };

  context.sessions.set(chatId, session);

  const mainMenu = createMainMenu();
  
  await bot.sendMessage(
    chatId,
    'Welcome to SpoofTube Sender Bot! 🤖\n\n' +
    'This bot helps you create and manage token transactions.\n\n' +
    '*Available Commands:*\n' +
    '/start - Show this welcome message\n' +
    '/transaction - Create a new transaction\n' +
    '/status - Check transaction status\n' +
    '/history - View transaction history\n' +
    '/help - Show help information\n' +
    '/cancel - Cancel current operation',
    {
      parse_mode: 'Markdown',
      reply_markup: mainMenu
    }
  );
}

export async function handleHelp(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    '📖 *SpoofTube Sender Bot Help*\n\n' +
    '*Commands:*\n' +
    '`/start` - Initialize bot and show main menu\n' +
    '`/transaction` - Start new transaction\n' +
    '`/status` - Check transaction status\n' +
    '`/history` - View transaction history\n' +
    '`/help` - Show this help message\n' +
    '`/cancel` - Cancel current operation\n\n' +
    '*Transaction Process:*\n' +
    '1. Start with /transaction\n' +
    '2. Enter Infura URL\n' +
    '3. Provide private key\n' +
    '4. Select token\n' +
    '5. Enter target address\n' +
    '6. Specify amount\n' +
    '7. Set gas price\n' +
    '8. Confirm transaction\n\n' +
    '*Security Tips:*\n' +
    '• Never share your private keys\n' +
    '• Verify all transaction details\n' +
    '• Check gas prices before confirming\n' +
    '• Keep your session active\n\n' +
    '*Need More Help?*\n' +
    'Use the web interface for advanced features',
    { parse_mode: 'Markdown' }
  );
}

export async function handleTransaction(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  context: BotContext
) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId) {
    await bot.sendMessage(chatId, 'Error: Could not identify user');
    return;
  }

  // Initialize transaction session
  const session: UserSession = {
    userId,
    chatId,
    state: 'AWAITING_INFURA',
    data: {},
    lastActivity: Date.now(),
    authenticated: false
  };

  context.sessions.set(chatId, session);

  await bot.sendMessage(
    chatId,
    'Please enter your Infura URL:\n' +
    'Format: `https://mainnet.infura.io/v3/your-project-id`',
    { parse_mode: 'Markdown' }
  );
}

export async function handleCancel(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  context: BotContext
) {
  const chatId = msg.chat.id;
  
  // Clear session
  context.sessions.delete(chatId);
  
  await bot.sendMessage(
    chatId,
    '❌ Current operation cancelled.\n' +
    'Use /start to begin a new operation.',
    createMainMenu()
  );
}

export async function handleMessage(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  context: BotContext
) {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!text) return;

  const session = context.sessions.get(chatId);
  if (!session) return;

  // Update last activity
  session.lastActivity = Date.now();

  // Check session timeout
  if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
    context.sessions.delete(chatId);
    await bot.sendMessage(
      chatId,
      '⚠️ Your session has expired. Please start a new transaction with /transaction'
    );
    return;
  }

  try {
    switch (session.state) {
      case 'AWAITING_INFURA':
        if (!text.startsWith('https://mainnet.infura.io/v3/')) {
          await bot.sendMessage(chatId, '❌ Invalid Infura URL format. Please try again.');
          return;
        }
        session.data.infuraUrl = text;
        session.state = 'AWAITING_PRIVATE_KEY';
        await bot.sendMessage(
          chatId,
          'Please enter your private key:\n' +
          'Warning: Never share your private key with anyone!'
        );
        break;

      case 'AWAITING_PRIVATE_KEY':
        try {
          // Validate private key
          new ethers.Wallet(text);
          session.data.privateKey = text;
          session.state = 'AWAITING_TOKEN';
          await bot.sendMessage(
            chatId,
            'Select a token:',
            createTokenMenu()
          );
        } catch (error) {
          await bot.sendMessage(chatId, '❌ Invalid private key format. Please try again.');
        }
        break;

      case 'AWAITING_TARGET_ADDRESS':
        if (!ethers.isAddress(text)) {
          await bot.sendMessage(chatId, '❌ Invalid Ethereum address. Please try again.');
          return;
        }
        session.data.targetAddress = text;
        session.state = 'AWAITING_AMOUNT';
        await bot.sendMessage(chatId, 'Enter the amount to send:');
        break;

      case 'AWAITING_AMOUNT':
        if (isNaN(Number(text)) || Number(text) <= 0) {
          await bot.sendMessage(chatId, '❌ Invalid amount. Please enter a positive number.');
          return;
        }
        session.data.amount = text;
        session.state = 'AWAITING_GAS_PRICE';
        await bot.sendMessage(
          chatId,
          'Enter gas price in Gwei:\n' +
          'Recommended: 0.1 Gwei for pending transactions'
        );
        break;

      case 'AWAITING_GAS_PRICE':
        if (isNaN(Number(text)) || Number(text) < 0.1) {
          await bot.sendMessage(chatId, '❌ Invalid gas price. Please enter a number >= 0.1');
          return;
        }
        session.data.gasPrice = text;
        session.state = 'CONFIRMING_TRANSACTION';
        
        // Show transaction summary
        const summary = createTransactionSummary(session.data);
        await bot.sendMessage(
          chatId,
          summary,
          createConfirmationMenu()
        );
        break;

      default:
        logger.warn(`Unhandled session state: ${session.state}`);
        break;
    }
  } catch (error) {
    logger.error('Error handling message:', error);
    await bot.sendMessage(
      chatId,
      '❌ An error occurred. Please try again or use /cancel to start over.'
    );
  }
}

export async function handleCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  context: BotContext
) {
  if (!query.message || !query.data) return;

  const chatId = query.message.chat.id;
  const session = context.sessions.get(chatId);

  if (!session) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Session expired. Please start a new transaction.',
      show_alert: true
    });
    return;
  }

  try {
    const [action, value] = query.data.split(':');

    switch (action) {
      case 'token':
        if (SUPPORTED_TOKENS[value]) {
          session.data.selectedToken = value;
          session.state = 'AWAITING_TARGET_ADDRESS';
          await bot.editMessageText(
            'Please enter the target address:',
            {
              chat_id: chatId,
              message_id: query.message.message_id
            }
          );
        }
        break;

      case 'confirm':
        if (value === 'yes') {
          // Process transaction
          await processTransaction(bot, session);
        } else {
          // Cancel transaction
          context.sessions.delete(chatId);
          await bot.sendMessage(
            chatId,
            '❌ Transaction cancelled.\n' +
            'Use /transaction to start a new one.',
            createMainMenu()
          );
        }
        break;

      default:
        logger.warn(`Unhandled callback action: ${action}`);
        break;
    }

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    logger.error('Error handling callback:', error);
    await bot.answerCallbackQuery(query.id, {
      text: 'An error occurred. Please try again.',
      show_alert: true
    });
  }
}

function createTransactionSummary(data: any): string {
  return '📝 *Transaction Summary*\n\n' +
    `Token: ${data.selectedToken}\n` +
    `Amount: ${data.amount}\n` +
    `To: ${data.targetAddress}\n` +
    `Gas Price: ${data.gasPrice} Gwei\n\n` +
    'Please confirm the transaction details.';
}

async function processTransaction(bot: TelegramBot, session: UserSession) {
  const { chatId, data } = session;

  try {
    const provider = new ethers.JsonRpcProvider(data.infuraUrl);
    const wallet = new ethers.Wallet(data.privateKey!, provider);
    
    const tokenConfig = SUPPORTED_TOKENS[data.selectedToken!];
    const amount = ethers.parseUnits(data.amount!, tokenConfig.decimals);
    const gasPrice = ethers.parseUnits(data.gasPrice!, 'gwei');

    // Send transaction
    const tx = await wallet.sendTransaction({
      to: data.targetAddress,
      value: amount,
      gasPrice
    });

    await bot.sendMessage(
      chatId,
      '✅ *Transaction Submitted*\n\n' +
      `Hash: \`${tx.hash}\`\n\n` +
      'Track status with /status command.',
      {
        parse_mode: 'Markdown',
        reply_markup: createMainMenu().reply_markup
      }
    );

  } catch (error: any) {
    logger.error('Transaction error:', error);
    await bot.sendMessage(
      chatId,
      '❌ Transaction failed:\n' +
      error.message || 'Unknown error',
      createMainMenu()
    );
  }
}