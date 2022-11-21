import { readFile } from "fs/promises";
const config = JSON.parse(
  await readFile(new URL("../config/Token.json", import.meta.url))
);
const webAppURL = config.webAppURL;

export const deleteMenu = {
  reply_markup: JSON.stringify({
    remove_keyboard: true,
  }),
};
export const forceReplyForCreateNewPrice = {
  reply_markup: JSON.stringify({
    force_reply: true,
    input_field_placeholder: "Введите значение...",
  }),
};
export const mainWebAppOptions = {
  disable_notification: true,
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        {
          text: "Все прайсы 📋",
          web_app: { url: webAppURL },
        },
      ],
      [{ text: "Добавить прайс ➕", web_app: { url: webAppURL + "/new" } }],
      [{ text: "Помощь ℹ️", callback_data: "empty" }],
      [{ text: "Скачать XML price 💾", callback_data: "empty" }],
      [{ text: "Настройки ⚙️", web_app: { url: webAppURL + "/settings" } }],
      [{ text: "ВЫЙТИ 🚪", callback_data: "confirm logout" }],
    ],
    resize_keyboard: true,
  }),
};
export const goBackOption = {
  reply_markup: JSON.stringify({
    keyboard: [[{ text: "/menu" }]],
    resize_keyboard: true,
  }),
};
export const unauthorizedMenu = [
  { command: "/start", description: "Запустить бота" },
  {
    command: "/info",
    description: "Получить дополнительную информацию",
  },
];
export const authorizedMenu = [
  { command: "/start", description: "Запустить бота" },
  { command: "/menu", description: "Главное меню" },
  { command: "/info", description: "Получить дополнительную информацию" },
  { command: "/exit", description: "Выйти из меню" },
];
