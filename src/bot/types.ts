import TelegramBot from 'node-telegram-bot-api';

export interface BotTransaction {
  token?: string;
  targetAddress?: string;
  amount?: string;
  gasPrice?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface BotContext {
  activeTransactions: Map<number, BotTransaction>;
  sessions: Map<number, UserSession>;
}

export interface UserSession {
  userId: number;
  chatId: number;
  state: SessionState;
  data: SessionData;
  lastActivity: number;
  authenticated: boolean;
}

export interface SessionData {
  infuraUrl?: string;
  privateKey?: string;
  targetAddress?: string;
  selectedToken?: string;
  amount?: string;
  gasPrice?: string;
}

export type SessionState = 
  | 'IDLE'
  | 'AWAITING_INFURA'
  | 'AWAITING_PRIVATE_KEY'
  | 'AWAITING_TARGET_ADDRESS'
  | 'AWAITING_TOKEN'
  | 'AWAITING_AMOUNT'
  | 'AWAITING_GAS_PRICE'
  | 'CONFIRMING_TRANSACTION';

export interface CommandHandler {
  command: string;
  description: string;
  handler: (bot: TelegramBot, msg: TelegramBot.Message, context: BotContext) => Promise<void>;
}

export interface MenuButton {
  text: string;
  callback_data: string;
}

export interface MenuOptions {
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: TelegramBot.InlineKeyboardMarkup;
}