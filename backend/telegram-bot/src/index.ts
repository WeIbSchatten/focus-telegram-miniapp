import 'dotenv/config';
import express, { Request, Response } from 'express';
import { Telegraf } from 'telegraf';
import { formatNotifyMessage, type NotifyType, type NotifyPayload } from './notify';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = (process.env.MINI_APP_URL || '').trim();
const NOTIFY_SECRET = (process.env.NOTIFY_SECRET || '').trim();
const FOCUS_SERVICE_URL = (process.env.FOCUS_SERVICE_URL || 'http://focus-service:3000').trim().replace(/\/$/, '');
const KIDS_API_URL = (process.env.KIDS_API_URL || '').trim().replace(/\/$/, '');
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

/** Для /status: по telegram_id получить focus_user_id. */
async function fetchFocusUserByTelegram(telegramId: string): Promise<string | null> {
  if (!INTERNAL_API_SECRET || !telegramId) return null;
  const url = `${FOCUS_SERVICE_URL}/api/internal/focus-user-by-telegram?telegram_id=${encodeURIComponent(telegramId)}`;
  try {
    const res = await fetch(url, { headers: { 'X-Internal-Secret': INTERNAL_API_SECRET } });
    if (!res.ok) return null;
    const data = (await res.json()) as { focus_user_id?: string };
    return data.focus_user_id ?? null;
  } catch (e) {
    console.warn('Failed to fetch focus_user_id by telegram:', e);
    return null;
  }
}

/** Для /status: по focus_user_id получить статус ученика в Kids (новое ДЗ, непройденные тесты). */
async function fetchKidsStatus(focusUserId: string): Promise<{
  is_student: boolean;
  new_homework_count: number;
  unpassed_tests_count: number;
} | null> {
  if (!KIDS_API_URL || !INTERNAL_API_SECRET) return null;
  const url = `${KIDS_API_URL}/api/internal/student-status?focus_user_id=${encodeURIComponent(focusUserId)}`;
  try {
    const res = await fetch(url, { headers: { 'X-Internal-Secret': INTERNAL_API_SECRET } });
    if (!res.ok) return null;
    return (await res.json()) as { is_student: boolean; new_homework_count: number; unpassed_tests_count: number };
  } catch (e) {
    console.warn('Failed to fetch Kids status:', e);
    return null;
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
        await bot.telegram.sendMessage(tgId, text, { parse_mode: 'HTML' });
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

const KIDS_URL = MINI_APP_URL ? `${MINI_APP_URL.replace(/\/$/, '')}/kids` : '';
const SENSE_URL = MINI_APP_URL ? `${MINI_APP_URL.replace(/\/$/, '')}/sense` : '';

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

async function setBotCommands(): Promise<void> {
  try {
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Начать и открыть приложение' },
      { command: 'app', description: 'Открыть Focus' },
      { command: 'status', description: 'Статус: новое ДЗ и тесты (Kids)' },
      { command: 'kids', description: 'Focus Kids — английский для детей' },
      { command: 'sense', description: 'Focus Sense — медитации и аффирмации' },
      { command: 'help', description: 'Справка по командам' },
    ]);
    console.log('Bot commands set');
  } catch (e) {
    console.warn('Could not set bot commands:', e);
  }
}

const WELCOME_TEXT = (firstName: string) =>
  `Привет, ${firstName}! 👋\n\n` +
  `Это бот платформы <b>Focus</b> — обучение и развитие в одном месте.\n\n` +
  `📚 <b>Focus Kids</b> — английский для детей: уроки, домашние задания, тесты.\n` +
  `🧘 <b>Focus Sense</b> — медитации, аффирмации и практики для спокойствия.\n\n` +
  `Выбери сервис ниже или нажми кнопку меню рядом с полем ввода.`;

const WELCOME_TEXT_FALLBACK = (firstName: string) =>
  `Привет, ${firstName}! 👋\n\nЭто бот платформы Focus. Настрой MINI_APP_URL с HTTPS в .env для открытия приложения.`;

bot.start(async (ctx) => {
  const firstName = ctx.from?.first_name || 'друг';
  if (!hasValidMiniAppUrl) {
    await ctx.reply(WELCOME_TEXT_FALLBACK(firstName));
    return;
  }
  const keyboard =
    KIDS_URL && SENSE_URL
      ? {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📚 Focus Kids', web_app: { url: KIDS_URL } }, { text: '🧘 Focus Sense', web_app: { url: SENSE_URL } }],
              [{ text: '🚀 Открыть главную Focus', web_app: { url: MINI_APP_URL } }],
            ],
          },
        }
      : {
          reply_markup: {
            inline_keyboard: [[{ text: '🚀 Открыть Focus', web_app: { url: MINI_APP_URL } }]],
          },
        };
  await ctx.reply(WELCOME_TEXT(firstName), { parse_mode: 'HTML', ...keyboard });
});

bot.command('app', async (ctx) => {
  if (!hasValidMiniAppUrl) {
    await ctx.reply('Mini App URL не настроен или не HTTPS. Укажи MINI_APP_URL в .env');
    return;
  }
  const keyboard =
    KIDS_URL && SENSE_URL
      ? {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📚 Focus Kids', web_app: { url: KIDS_URL } }, { text: '🧘 Focus Sense', web_app: { url: SENSE_URL } }],
              [{ text: '🚀 Главная', web_app: { url: MINI_APP_URL } }],
            ],
          },
        }
      : {
          reply_markup: {
            inline_keyboard: [[{ text: 'Открыть Focus', web_app: { url: MINI_APP_URL } }]],
          },
        };
  await ctx.reply('Открой приложение:', keyboard);
});

bot.command('kids', async (ctx) => {
  if (KIDS_URL) {
    await ctx.reply('Focus Kids — английский для детей:', {
      reply_markup: {
        inline_keyboard: [[{ text: '📚 Открыть Focus Kids', web_app: { url: KIDS_URL } }]],
      },
    });
  } else {
    await ctx.reply('Приложение не настроено. Укажи MINI_APP_URL в .env');
  }
});

bot.command('sense', async (ctx) => {
  if (SENSE_URL) {
    await ctx.reply('Focus Sense — медитации и аффирмации:', {
      reply_markup: {
        inline_keyboard: [[{ text: '🧘 Открыть Focus Sense', web_app: { url: SENSE_URL } }]],
      },
    });
  } else {
    await ctx.reply('Приложение не настроено. Укажи MINI_APP_URL в .env');
  }
});

bot.command('status', async (ctx) => {
  const telegramId = String(ctx.from?.id ?? '');
  if (!telegramId) {
    await ctx.reply('Не удалось определить ваш Telegram.');
    return;
  }
  const focusUserId = await fetchFocusUserByTelegram(telegramId);
  if (!focusUserId) {
    await ctx.reply(
      'Ваш Telegram ещё не привязан к аккаунту Focus.\n\nОткройте приложение из бота (кнопка меню или /start) и войдите — тогда команда /status будет показывать новое ДЗ и тесты.',
      { parse_mode: 'HTML' },
    );
    return;
  }
  const status = await fetchKidsStatus(focusUserId);
  if (!status) {
    await ctx.reply('Не удалось загрузить статус Focus Kids. Попробуйте позже.');
    return;
  }
  if (!status.is_student) {
    await ctx.reply('Вы не зарегистрированы как ученик в Focus Kids. Статус ДЗ и тестов доступен только ученикам.');
    return;
  }
  const hw = status.new_homework_count;
  const tests = status.unpassed_tests_count;
  const parts: string[] = [];
  if (hw > 0) parts.push(`📝 Есть новое ДЗ: ${hw}`);
  if (tests > 0) parts.push(`📋 Непройденных тестов: ${tests}`);
  const text =
    parts.length > 0
      ? `<b>Focus Kids — ваш статус</b>\n\n${parts.join('\n')}\n\n👉 Откройте Focus Kids в боте, чтобы выполнить задания.`
      : `<b>Focus Kids — ваш статус</b>\n\nВсё выполнено 👍\nНет нового ДЗ и непройденных тестов.`;
  await ctx.reply(text, { parse_mode: 'HTML' });
});

bot.command('help', async (ctx) => {
  const text =
    `<b>Focus Bot</b> — быстрый доступ к платформе.\n\n` +
    `<b>Команды:</b>\n` +
    `/start — приветствие и кнопки сервисов\n` +
    `/app — открыть приложение (Kids, Sense или главная)\n` +
    `/status — статус: новое ДЗ и тесты (Focus Kids)\n` +
    `/kids — открыть Focus Kids (английский для детей)\n` +
    `/sense — открыть Focus Sense (медитации, аффирмации)\n` +
    `/help — эта справка\n\n` +
    `Кнопка меню рядом с полем ввода тоже открывает приложение.`;
  await ctx.reply(text, { parse_mode: 'HTML' });
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
  await setBotCommands();
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
