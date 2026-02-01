import 'dotenv/config';
import express, { Request, Response } from 'express';
import { Telegraf } from 'telegraf';
import { formatNotifyMessage, type NotifyType, type NotifyPayload } from './notify';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = (process.env.MINI_APP_URL || '').trim();
const NOTIFY_SECRET = (process.env.NOTIFY_SECRET || '').trim();
const FOCUS_SERVICE_URL = (process.env.FOCUS_SERVICE_URL || 'http://focus-service:3000').trim().replace(/\/$/, '');
const INTERNAL_API_SECRET = (process.env.INTERNAL_API_SECRET || '').trim();
const NOTIFY_PORT = parseInt(process.env.NOTIFY_PORT ?? '4000', 10);

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required. Set it in .env');
  process.exit(1);
}

const hasValidMiniAppUrl = MINI_APP_URL.startsWith('https://');
if (!MINI_APP_URL) {
  console.warn('MINI_APP_URL is not set. Menu button will not be set.');
} else if (!hasValidMiniAppUrl) {
  console.warn('MINI_APP_URL must be HTTPS. Menu button will not be set.');
}

const bot = new Telegraf(BOT_TOKEN);

// ——— HTTP server для приёма уведомлений от Focus Kids ———
async function fetchTelegramIds(focusUserIds: string[]): Promise<Record<string, string | null>> {
  if (focusUserIds.length === 0) return {};
  if (!INTERNAL_API_SECRET) {
    console.warn('INTERNAL_API_SECRET not set, cannot resolve telegram IDs');
    return {};
  }
  const idsParam = focusUserIds.join(',');
  const url = `${FOCUS_SERVICE_URL}/api/internal/telegram-ids?ids=${encodeURIComponent(idsParam)}`;
  try {
    const res = await fetch(url, {
      headers: { 'X-Internal-Secret': INTERNAL_API_SECRET },
    });
    if (!res.ok) {
      console.error('Focus service telegram-ids error:', res.status, await res.text());
      return {};
    }
    return (await res.json()) as Record<string, string | null>;
  } catch (e) {
    console.error('Failed to fetch telegram IDs from focus-service:', e);
    return {};
  }
}

const notifyApp = express();
notifyApp.use(express.json());

notifyApp.post('/notify', async (req: Request, res: Response) => {
  const secret = req.headers['x-notify-secret'] as string | undefined;
  if (!NOTIFY_SECRET || secret !== NOTIFY_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { focus_user_ids, type, payload } = req.body as {
    focus_user_ids?: string[];
    type?: NotifyType;
    payload?: NotifyPayload;
  };
  if (!Array.isArray(focus_user_ids) || focus_user_ids.length === 0 || !type) {
    res.status(400).json({ error: 'focus_user_ids (array) and type required' });
    return;
  }
  const uniqueIds = [...new Set(focus_user_ids as string[])];
  const telegramIds = await fetchTelegramIds(uniqueIds);
  const text = formatNotifyMessage(type, payload ?? {});
  let sent = 0;
  const withTg = Object.values(telegramIds).filter(Boolean).length;
  const withoutTg = uniqueIds.length - withTg;
  if (withoutTg > 0) {
    console.warn(`Notify: ${withoutTg} of ${uniqueIds.length} users have no Telegram linked (open Mini App from bot or link in profile).`);
  }
  for (const tgId of Object.values(telegramIds)) {
    if (tgId) {
      try {
        await bot.telegram.sendMessage(tgId, text);
        sent++;
      } catch (e) {
        console.warn('Failed to send to', tgId, e);
      }
    }
  }
  res.json({ sent, total: uniqueIds.length });
});

notifyApp.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ——— Бот: long polling и команды ———
async function ensurePolling(): Promise<void> {
  try {
    const info = await bot.telegram.getWebhookInfo();
    if (info.url) {
      await bot.telegram.deleteWebhook({ drop_pending_updates: false });
      console.log('Webhook removed, using long polling');
    }
  } catch (e) {
    console.warn('Could not check/delete webhook:', e);
  }
}

async function setMenuButton(): Promise<void> {
  if (!MINI_APP_URL || !MINI_APP_URL.startsWith('https://')) return;
  try {
    await bot.telegram.setChatMenuButton({
      menuButton: {
        type: 'web_app',
        text: 'Открыть Focus',
        web_app: { url: MINI_APP_URL },
      },
    });
    console.log('Menu button set to:', MINI_APP_URL);
  } catch (e) {
    console.error('Failed to set menu button:', e);
  }
}

bot.start(async (ctx) => {
  const firstName = ctx.from?.first_name || 'друг';
  const text = hasValidMiniAppUrl
    ? `Привет, ${firstName}! 👋\n\nЭто бот платформы Focus. Нажми кнопку ниже или кнопку меню рядом с полем ввода, чтобы открыть приложение.`
    : `Привет, ${firstName}! 👋\n\nЭто бот платформы Focus. Настрой MINI_APP_URL с HTTPS в .env для открытия приложения.`;
  const replyMarkup = hasValidMiniAppUrl
    ? {
        reply_markup: {
          inline_keyboard: [[{ text: '🚀 Открыть Focus', web_app: { url: MINI_APP_URL } }]],
        },
      }
    : {};
  await ctx.reply(text, replyMarkup);
});

bot.command('app', async (ctx) => {
  if (hasValidMiniAppUrl) {
    await ctx.reply('Открой приложение:', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Открыть Focus', web_app: { url: MINI_APP_URL } }]],
      },
    });
  } else {
    await ctx.reply('Mini App URL не настроен или не HTTPS. Укажи MINI_APP_URL в .env');
  }
});

async function main(): Promise<void> {
  try {
    const me = await bot.telegram.getMe();
    console.log('Bot connected:', me.username);
  } catch (e) {
    console.error('Invalid token or network. Check TELEGRAM_BOT_TOKEN:', e);
    process.exit(1);
  }
  await ensurePolling();
  await setMenuButton();
  notifyApp.listen(NOTIFY_PORT, () => {
    console.log(`Notify server listening on port ${NOTIFY_PORT}. POST /notify with X-Notify-Secret.`);
  });

  await bot.launch();
  console.log('Focus Telegram bot is running. Send /start in Telegram.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
