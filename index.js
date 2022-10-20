import TelegramApi from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import fs from "fs";
import express from "express";
import cors from "cors";
import https from "https";
import { readFile } from "fs/promises";
import CryptoJS from "crypto-js";
import priceRouter from "./ServerRoutes/PriceRoutes.js";
import Stickers from "./Stickers/Stickers.js";
import {
  checkForAuth,
  login,
  logout,
  registration,
} from "./Service/AuthService.js";
import {
  mainWebAppOptions,
  unauthorizedMenu,
  authorizedMenu,
  deleteMenu,
  goBackOption,
  forceReplyForCreateNewPrice,
} from "./MenuAndOptions/KeyboardOptions.js";
import {
  createNewPrice,
  activatePrice,
  deactivatePrice,
  editPrice,
  deletePrice,
} from "./Service/PriceService.js";
export const conn = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  database: "kaspi_price_list",
  port: "3306",
  password: "",
});

const config = JSON.parse(
  await readFile(new URL("./config/Token.json", import.meta.url))
);
const { token, Port, SecurePort, webAppURL } = config;
const privateKey = fs.readFileSync("./keys/privkey.pem", "utf8");
const certificate = fs.readFileSync("./keys/cert.pem", "utf8");
const ca = fs.readFileSync("./keys/chain.pem", "utf8");
const credentials = {
  key: privateKey,
  cert: certificate,
  ca,
};
const moreinfo = 'Подробнее <a href="https://kaspi.kz">+7 (776) 829 08 79</a>';
const replytimeout = 20; //В секундах

export const bot = new TelegramApi(token, { polling: true });
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api", priceRouter);
app.listen(Port, () => {
  console.log("server started on port " + Port);
});
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(SecurePort, () => {
  console.log("HTTPS server started on port " + SecurePort + "...");
});

const removeReplyListener = (id) => {
  bot.removeReplyListener(id);
};

const start = async () => {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const fromWho = msg.from.id;
    const text = msg.text;
    const isAuth = await checkForAuth(msg.from.id);
    if (!isAuth) {
      bot.setMyCommands(unauthorizedMenu);
      if (msg.reply_to_message) {
        return;
      }
      if (text === "/info") {
        await bot.sendMessage(chatId, moreinfo, { parse_mode: "HTML" });
        return;
      }
      if (text !== "/start") {
        return;
      }
      await bot.sendSticker(chatId, Stickers.keyBoyBeingShy);
      await bot.sendMessage(chatId, "Вы не авторизованы.", {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: "Войти", callback_data: "login" }],
            [
              {
                text: "Зарегистрироваться",
                web_app: { url: webAppURL + "/register" },
              },
            ],
          ],
        }),
      });
      return;
    }
    bot.setMyCommands(authorizedMenu);
    if (text === "/info" && !msg.reply_to_message) {
      await bot.sendMessage(chatId, moreinfo, { parse_mode: "HTML" });
      return;
    }
    if (text === "/start" && !msg.reply_to_message) {
      await bot.sendSticker(chatId, Stickers.keyBoySmiling);
      await bot.sendMessage(
        chatId,
        "Привет, бот уже работает. \nНажми /menu для вывода Главного меню."
      );
      return;
    }
    if (text === "/menu" && !msg.reply_to_message) {
      await bot.sendMessage(
        chatId,
        "Вы находитесь в Главном меню:",
        mainWebAppOptions
      );
      return;
    }
    if (text === "/exit" && !msg.reply_to_message) {
      return bot.sendMessage(chatId, "До свидания 👋", deleteMenu);
    }
    if (text === "Настройки ⚙️" && !msg.reply_to_message) {
      await bot
        .sendMessage(chatId, "Загрузка...", {
          ...deleteMenu,
        })
        .then(async (msg2) => {
          await bot.deleteMessage(chatId, msg2.message_id);
        });
      await bot.sendMessage(chatId, "Настройки...", {
        ...goBackOption,
      });
      return;
    }
    if (text === "Закрыть меню ⛔️" && !msg.reply_to_message) {
      await bot
        .sendMessage(chatId, "Выходим с меню...", deleteMenu)
        .then(async (msg) => {
          await bot.deleteMessage(chatId, msg.message_id);
        });
      return;
    }
    if (msg?.web_app_data?.data) {
      try {
        const data = JSON.parse(msg?.web_app_data?.data);
        if (data.method === "new") {
          createNewPrice(data, fromWho);
        } else if (data.method === "edit") {
          editPrice(data, fromWho);
        } else if (data.method === "activate") {
          activatePrice(data, fromWho);
        } else if (data.method === "deactivate") {
          deactivatePrice(data, fromWho);
        } else if (data.method === "delete") {
          deletePrice(data, fromWho);
        }
        await bot.sendMessage(chatId, "Данные успешно обработаны!");
      } catch (e) {
        await bot.sendMessage(chatId, "Не удалось обработать данные. " + e);
        console.log(e);
      }
    }
  });

  bot.on("callback_query", async (msg) => {
    const chatId = msg.message.chat.id;
    const fromWho = msg.message.from.id;
    const queryId = msg.id;
    const text = msg.message.text;
    const data = msg.data;
    if (data === "login") {
      try {
        await bot.deleteMessage(chatId, msg.message.message_id);
      } catch (e) {
        return;
      }
      await bot
        .sendMessage(
          chatId,
          msg.from.id + ": " + msg.from.first_name + "? Введите пароль:",
          { ...forceReplyForCreateNewPrice }
        )
        .then(async (msg2) => {
          const replylistenerid = bot.onReplyToMessage(
            msg2.chat.id,
            msg2.message_id,
            async (msg) => {
              bot.removeReplyListener(replylistenerid);
              const response = await login(msg.from.id, msg.text);
              if (response.startsWith("Вы успешно")) {
                bot.setMyCommands(authorizedMenu);
                await bot.sendSticker(chatId, Stickers.keyBoyCheering);
              }
              await bot.sendMessage(chatId, response);
            }
          );
          setTimeout(removeReplyListener, replytimeout * 1000, replylistenerid);
        });
      return;
    }
    const isAuth = await checkForAuth(msg.from.id);
    if (!isAuth) {
      if (data === "empty") {
        data;
        await bot.answerCallbackQuery(msg.id, { text: "empty" });
        return;
      }
      bot.answerCallbackQuery(msg.id, { text: "Ошибка! Вы не авторизованы." });
      bot.setMyCommands(unauthorizedMenu);
      return;
    }
    if (data === "confirm logout") {
      await bot.sendMessage(
        chatId,
        "Вы действительно хотите выйти из аккаунта?",
        {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                { text: "Нет", callback_data: "Назад 🔙" },
                { text: " ", callback_data: "empty" },
                { text: "Да", callback_data: "logout" },
              ],
              [{ text: "Главное меню 🔙", callback_data: "Назад 🔙" }],
            ],
          }),
        }
      );
      bot.answerCallbackQuery(msg.id, {
        text: "Вы пытаетесь выйти из аккаунта.",
      });
      return;
    }
    if (data === "logout") {
      try {
        await bot.deleteMessage(chatId, msg.message.message_id);
      } catch (e) {
        return;
      }
      await logout(msg.from.id);
      await bot.sendMessage(
        chatId,
        "Вы вышли из аккаунта и больше не авторизованы.",
        deleteMenu
      );
      bot.setMyCommands(unauthorizedMenu);
      return;
    }

    if (data === "Назад 🔙") {
      await bot.sendMessage(
        chatId,
        "Вы находитесь в главном меню:",
        mainWebAppOptions
      );
      await bot.deleteMessage(chatId, msg.message.message_id);
      await bot.answerCallbackQuery(msg.id, { text: "Back" });
      return;
    }
    if (data === "empty") {
      data;
      await bot.answerCallbackQuery(msg.id, {
        text: "empty",
      });
      return;
    }
  });
};

function checkWebAppSignature(token, initData) {
  const q = new URLSearchParams(initData);
  const hash = q.get("hash");
  q.delete("hash");
  const v = Array.from(q.entries());
  v.sort(([aN, aV], [bN, bV]) => aN.localeCompare(bN));
  const data_check_string = v.map(([n, v]) => `${n}=${v}`).join("\n");
  var secret_key = CryptoJS.HmacSHA256(token, "WebAppData");
  var key = CryptoJS.HmacSHA256(data_check_string, secret_key).toString(
    CryptoJS.enc.Hex
  );
  return key === hash;
}

console.log(
  checkWebAppSignature(
    token,
    "query_id=AAFy6bwtAAAAAHLpvC1tXVAY&user=%7B%22id%22%3A767355250%2C%22first_name%22%3A%22Gassyr%22%2C%22last_name%22%3A%22Daulet%22%2C%22username%22%3A%22FassKoba%22%2C%22language_code%22%3A%22ru%22%7D&auth_date=1665172912&hash=eac64e0aafa0d8c41161a112fc93380a2b3454a9a6bf0e7dd3b136c14fab79f5"
  )
);
start();
