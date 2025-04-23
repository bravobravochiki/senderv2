import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

export function useTelegram() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initTelegram = async () => {
      try {
        await WebApp.ready();
        setReady(true);
      } catch (error) {
        console.error('Failed to initialize Telegram WebApp:', error);
      }
    };

    initTelegram();
  }, []);

  return {
    webApp: WebApp,
    ready
  };
}