import { Handler } from '@netlify/functions';
import bot from '../../src/bot';

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: 'Method Not Allowed'
      };
    }

    const body = JSON.parse(event.body || '{}');
    await bot.handleUpdate(body);

    return {
      statusCode: 200,
      body: 'OK'
    };
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return {
      statusCode: 500,
      body: error.message
    };
  }
};