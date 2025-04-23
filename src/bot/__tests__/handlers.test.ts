import { describe, it, expect, vi, beforeEach } from 'vitest';
import TelegramBot from 'node-telegram-bot-api';
import { handleStart, handleTransaction, handleCancel } from '../handlers';
import type { BotContext } from '../types';

describe('Bot Handlers', () => {
  let mockBot: any;
  let mockContext: BotContext;

  beforeEach(() => {
    mockBot = {
      sendMessage: vi.fn().mockResolvedValue({}),
      editMessageText: vi.fn().mockResolvedValue({}),
      answerCallbackQuery: vi.fn().mockResolvedValue({})
    };

    mockContext = {
      activeTransactions: new Map(),
      sessions: new Map()
    };
  });

  describe('handleStart', () => {
    it('should send welcome message with main menu', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456 }
      };

      await handleStart(mockBot as TelegramBot, msg as any, mockContext);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('Welcome to SpoofTube Sender Bot'),
        expect.objectContaining({
          parse_mode: 'Markdown',
          reply_markup: expect.any(Object)
        })
      );
    });
  });

  describe('handleTransaction', () => {
    it('should initialize transaction session and request Infura URL', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456 }
      };

      await handleTransaction(mockBot as TelegramBot, msg as any, mockContext);

      expect(mockContext.sessions.has(123)).toBe(true);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('Please enter your Infura URL'),
        expect.any(Object)
      );
    });
  });

  describe('handleCancel', () => {
    it('should clear session and send confirmation', async () => {
      const msg = {
        chat: { id: 123 }
      };

      mockContext.sessions.set(123, {
        userId: 456,
        chatId: 123,
        state: 'AWAITING_INFURA',
        data: {},
        lastActivity: Date.now(),
        authenticated: false
      });

      await handleCancel(mockBot as TelegramBot, msg as any, mockContext);

      expect(mockContext.sessions.has(123)).toBe(false);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('Current operation cancelled'),
        expect.any(Object)
      );
    });
  });
});