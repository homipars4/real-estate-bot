import TelegramBot from 'node-telegram-bot-api';
import { Client, Databases, ID } from 'node-appwrite';

// --- اتصال به Appwrite ---
const client = new Client()
    .setEndpoint(process.env.API_ENDPOINT) // مثلا https://cloud.appwrite.io/v1
    .setProject(process.env.PROJECT_ID)
    .setKey(process.env['real-estate-bot-api']); // API Key

const databases = new Databases(client);

// اطلاعات دیتابیس و کالکشن
const DATABASE_ID = process.env.DATABASE_ID;
const COLLECTION_ID = process.env.COLLECTION_USERS_ID;

// --- اتصال به تلگرام ---
const bot = new TelegramBot(process.env['telegram-bot-token'], { polling: true });

// یک آبجکت ساده برای ذخیره موقت وضعیت هر کاربر
const userStates = {};

// مرحله اول: استارت
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'name' };
    bot.sendMessage(chatId, 'سلام! لطفاً نام و نام خانوادگی خود را وارد کنید:');
});

// گرفتن پیام‌های متنی
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!userStates[chatId]) return; // اگر استارت نکرده بود

    const state = userStates[chatId];

    if (state.step === 'name' && text !== '/start') {
        state.fullName = text;
        state.step = 'phone';
        bot.sendMessage(chatId, 'لطفاً شماره تماس خود را ارسال کنید:', {
            reply_markup: {
                keyboard: [[{ text: 'ارسال شماره 📱', request_contact: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }

    // گرفتن شماره
    if (state.step === 'phone' && msg.contact) {
        const phone = msg.contact.phone_number;
        state.phone = phone;

        try {
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(),
                {
                    name: state.fullName,
                    phone: state.phone,
                    telegram_id: chatId
                }
            );

            bot.sendMessage(chatId, '✅ اطلاعات شما با موفقیت ثبت شد.');
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, '❌ خطا در ذخیره‌سازی اطلاعات.');
        }

        delete userStates[chatId]; // پاک کردن وضعیت
    }
});
