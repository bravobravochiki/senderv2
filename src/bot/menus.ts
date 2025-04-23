import type { MenuOptions } from './types';
import { SUPPORTED_TOKENS } from '../config/tokens';

export function createMainMenu(): MenuOptions {
  return {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔄 New Transaction', callback_data: 'menu:transaction' },
          { text: '📊 Status', callback_data: 'menu:status' }
        ],
        [
          { text: '📜 History', callback_data: 'menu:history' },
          { text: '❓ Help', callback_data: 'menu:help' }
        ],
        [
          { text: '🌐 Open Web App', web_app: { url: process.env.WEBAPP_URL || '' } }
        ]
      ]
    }
  };
}

export function createTokenMenu(): MenuOptions {
  const tokenButtons = Object.entries(SUPPORTED_TOKENS).map(([symbol, token]) => ({
    text: `${token.name} (${symbol})`,
    callback_data: `token:${symbol}`
  }));

  // Create rows of 2 buttons each
  const keyboard = tokenButtons.reduce((acc: any[][], button, index) => {
    if (index % 2 === 0) {
      acc.push([button]);
    } else {
      acc[acc.length - 1].push(button);
    }
    return acc;
  }, []);

  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

export function createConfirmationMenu(): MenuOptions {
  return {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Confirm', callback_data: 'confirm:yes' },
          { text: '❌ Cancel', callback_data: 'confirm:no' }
        ]
      ]
    }
  };
}