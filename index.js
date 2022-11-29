process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const token = "" // insert token here or use env var
const bot = new TelegramBot(token, {polling: true});
const ListenerInstance = require("./listener")

const authenticated_users = [352534776, 775286586]
const listener = new ListenerInstance(bot, authenticated_users)
listener.Listen() //main listener
