const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const URL = process.env.RAILWAY_URL;

const bot = new TelegramBot(TOKEN);
const app = express();
app.use(express.json());

const CHECKOUT = 'https://whop.com/checkout/prod_qegRTlXVjWyL6';
const PDF = 'https://assets-2-prod.whop.com/uploads/2026-03-30/1494cc80-c9a2-4218-af2c-7210fa1b4780/application.pdf';
const CHANNEL = 'https://t.me/prodigyprofitstrades';

const emails = new Map();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '🚀 *Welcome to Prodigy Profits Trades!*\n\nPremium XAUUSD (Gold) trading signals.\n\n💎 Plans:\n• Monthly — $99/mo\n• Quarterly — $250/3mo\n• Semi-Annual — $550/6mo\n• Annual — $999/yr',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 Subscribe Now', url: CHECKOUT }],
          [{ text: '📢 Join Our Channel', url: CHANNEL }]
        ]
      }
    }
  );
});

bot.onText(/\/activate (.+)/, (msg, match) => {
  const email = match[1].trim().toLowerCase();
  emails.set(email, msg.chat.id);
  bot.sendMessage(msg.chat.id, '✅ Email *' + email + '* linked!', { parse_mode: 'Markdown' });
});

bot.onText(/\/guide/, (msg) => {
  bot.sendDocument(msg.chat.id, PDF, { caption: '📖 Your XAUUSD Trading Guide!' });
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '📋 *Commands:*\n/start — Subscribe\n/activate <email> — Link email\n/guide — Trading guide\n/help — This message',
    { parse_mode: 'Markdown' }
  );
});

app.post('/webhook', (req, res) => {
  try {
    const { event, data } = req.body;
    if (event === 'payment.succeeded' || event === 'membership.activated') {
      const email = data?.email || data?.user?.email;
      if (email) {
        const chatId = emails.get(email.toLowerCase());
        if (chatId) {
          bot.sendMessage(chatId, '🎉 *Payment Confirmed!* Welcome to Prodigy Profits Trades!', { parse_mode: 'Markdown' });
          bot.sendDocument(chatId, PDF, { caption: '📖 Your XAUUSD Trading Guide' });
        }
      }
    }
  } catch (e) { console.error(e); }
  res.json({ ok: true });
});

app.post('/telegram-webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.json({ status: 'Bot is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  if (URL) {
    bot.setWebHook(URL + '/telegram-webhook').then(() => {
      console.log('Telegram webhook set');
    });
  }
});
