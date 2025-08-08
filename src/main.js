// src/main.js
import { Client, Databases, ID } from "node-appwrite";
import TelegramBot from "node-telegram-bot-api";

// متغیرهای محیطی از Appwrite Function
const API_KEY = process.env["real-estate-bot-api"];
const TELEGRAM_TOKEN = process.env["telegram-bot-token"];
const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID; 
const API_ENDPOINT = process.env.APPWRITE_FUNCTION_ENDPOINT;

// اتصال به Appwrite
const client = new Client()
    .setEndpoint(API_ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

// اتصال به تلگرام
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// برای ذخیره وضعیت کاربر
const userStates = {};

// شروع مکالمه
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: "askPhone" };

    bot.sendMessage(chatId, "لطفا شماره تلفنت رو ارسال کن:", {
        reply_markup: {
            keyboard: [
                [{ text: "ارسال شماره تلفن 📱", request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

// گرفتن شماره تلفن
bot.on("contact", (msg) => {
    const chatId = msg.chat.id;
    if (userStates[chatId]?.step === "askPhone") {
        userStates[chatId].phone = msg.contact.phone_number;
        userStates[chatId].step = "askFirstName";

        bot.sendMessage(chatId, "اسمت رو وارد کن:");
    }
});

// گرفتن اسم
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const state = userStates[chatId];

    if (!state) return;

    if (state.step === "askFirstName" && !msg.contact) {
        state.first_name = msg.text;
        state.step = "askLastName";
        bot.sendMessage(chatId, "فامیلت رو وارد کن:");
    }
    else if (state.step === "askLastName") {
        state.last_name = msg.text;
        saveUserData(state)
            .then(() => {
                bot.sendMessage(chatId, "اطلاعاتت با موفقیت ذخیره شد ✅");
                delete userStates[chatId];
            })
            .catch(err => {
                console.error(err);
                bot.sendMessage(chatId, "خطا در ذخیره اطلاعات ❌");
            });
    }
});

// ذخیره در دیتابیس Appwrite
async function saveUserData(data) {
    await databases.createDocument(
        "real-estate",     // databaseId
        "clients",         // collectionId
        ID.unique(),
        {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone
        }
    );
}
