import bcrypt from "bcryptjs";
import { conn, bot } from "../index.js";

const oneDay = 1000 * 60 * 60 * 24;
const authLifeTime = 1 * oneDay;

export const checkForAuth = async (id) => {
  try {
    const date = (
      await conn.query(
        "SELECT lastlogindate FROM users WHERE telegram_id = " + id
      )
    )[0];
    if (date.length === 0) {
      return false;
    }
    const { lastlogindate } = date[0];
    return Date.now() - lastlogindate < authLifeTime;
  } catch (e) {
    return e.sqlMessage ? e.sqlMessage : "Unhandled Error";
  }
};
export const login = async (id, password) => {
  try {
    const data = (
      await conn.query(`SELECT * FROM users WHERE telegram_id = ${id}`)
    )[0];
    if (data.length === 0) {
      return "У вас нет учетной записи. Пожалуйста, зарегистрируйтесь.";
    }
    const user = data[0];
    const isPassValid = bcrypt.compareSync(password, user.password);
    if (!isPassValid) {
      return "Пароль введен неверно, попробуйте еще раз.";
    }
    const date = new Date(Date.now());
    await conn.query(`UPDATE users SET ? WHERE telegram_id = ${id}`, {
      lastlogindate: date,
    });
    return (
      "Вы успешно авторизоны. Добро пожаловать, " +
      user.name +
      "!\nНажмите /menu для просмотра Главного меню."
    );
  } catch (e) {
    console.log(e);
    return e.sqlMessage ? e.sqlMessage : "Unhandled Error";
  }
};
export const logout = async (id) => {
  try {
    const date = new Date(Date.now() - authLifeTime * 3);
    await conn.query(`UPDATE users SET ? WHERE telegram_id = ${id}`, {
      lastlogindate: date,
    });
    return "Вы вышли из аккаунта и больше не авторизованы.";
  } catch (e) {
    console.log(e);
    return e.sqlMessage ? e.sqlMessage : "Unhandled Error";
  }
};
export const getTableName = async (id) => {
  try {
    const { tablename } = (
      await conn.query(`SELECT tablename FROM users WHERE telegram_id = ${id}`)
    )[0][0];
    return tablename;
  } catch (e) {
    console.log(e);
    return "0";
  }
};
export const registration = async (req, res) => {
  try {
    const { queryId, data, fromId } = req.body;
    const isAlreadyExist = await conn.query(
      "SELECT EXISTS(SELECT id FROM users WHERE telegram_id = ?)",
      data.telegram_id
    );
    console.log(isAlreadyExist[0]);
    console.log(data);
    const date = new Date(Date.now());
    await conn.query(
      `INSERT INTO users SET tablename = "${data.store_id}" , ?`,
      { ...data, lastlogindate: date }
    );
    // await bot.answerWebAppQuery(queryId, {
    //   type: "article",
    //   id: queryId,
    //   title: "Succesfully loaded!",
    //   input_message_content: {
    //     message_text: "Вы успешно зарегистрированы!",
    //   },
    // });
    res.status(200).json({ message: "Okay!" });
  } catch (e) {
    console.error(e);
    // await bot.answerWebAppQuery(queryId, {
    //   type: "article",
    //   id: queryId,
    //   title: "Fail.",
    //   input_message_content: {
    //     message_text: "Произошла ошибка!",
    //   },
    // });
    res.status(500).json({ message: "Произошла ошибка: " + e });
  }
};
9;
