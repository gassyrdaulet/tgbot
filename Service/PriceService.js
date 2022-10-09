import { getTableName } from "./AuthService.js";
import { conn } from "../index.js";

export const createNewPrice = async (data, fromWho) => {
  const tablename = await getTableName(fromWho);
  const final = prepareObjectForDB(data);
  await conn.query(`INSERT INTO ${tablename} SET ?`, final);
};

export const editPrice = async (data, fromWho) => {
  const tablename = await getTableName(fromWho);
  const final = prepareObjectForDB(data);
  await conn.query(
    `UPDATE ${tablename} SET ? , date = CURRENT_TIMESTAMP WHERE id = ${data.id}`,
    final
  );
};

export const activatePrice = async (data, fromWho) => {
  const tablename = await getTableName(fromWho);
  let sql = `UPDATE ${tablename} SET activated = "yes" WHERE`;
  const ids = generateIdsSQL(data.id);
  sql += ids;
  await conn.query(sql);
};

export const deactivatePrice = async (data, fromWho) => {
  const tablename = await getTableName(fromWho);
  let sql = `UPDATE ${tablename} SET activated = "no" WHERE`;
  const ids = generateIdsSQL(data.id);
  sql += ids;
  await conn.query(sql);
};

export const deletePrice = async (data, fromWho) => {
  const tablename = await getTableName(fromWho);
  let sql = `DELETE FROM ${tablename} WHERE`;
  const ids = generateIdsSQL(data.id);
  sql += ids;
  await conn.query(sql);
};

const generateIdsSQL = (ids) => {
  let generatedString = "";
  ids.forEach((element) => {
    generatedString += ` id = ${element} OR`;
  });
  generatedString = generatedString.slice(0, generatedString.length - 3);
  return generatedString;
};

const prepareObjectForDB = (data) => {
  const newprice = {};
  for (let itr = 1; itr <= 5; itr++) {
    const key = "availability" + (itr === 1 ? "" : itr);
    newprice[key] = JSON.stringify({
      $: { storeId: "PP" + itr, available: data[key] === false ? "no" : "yes" },
    });
  }
  newprice.suk = data.suk;
  newprice.suk2 = data.suk2;
  newprice.model = data.model;
  newprice.brand = data.brand;
  newprice.category = data.category;
  newprice.minprice = data.minprice;
  newprice.actualprice = data.minprice;
  newprice.maxprice = data.maxprice;

  return newprice;
};

export const getPriceInfoById = async (req, res) => {
  try {
    const id = req.params.id;
    const fromId = req.query.fromId;
    const tablename = await getTableName(fromId);
    const price = (
      await conn.query(`SELECT * FROM ${tablename} WHERE id = ${id}`)
    )[0];
    res.send(price);
  } catch (e) {
    res.status(500).json({ message: "A server error occured: " + e });
  }
};

export const getAllPrices = async (req, res) => {
  try {
    const fromId = req.body.fromId;
    const tablename = await getTableName(fromId);
    const prices = (await conn.query(`SELECT * FROM ${tablename}`))[0];
    res.send(prices);
  } catch (e) {
    res.status(500).json({ message: "A server error occured: " + e });
  }
};

export const getBrands = async (req, res) => {
  try {
    const respond = [];
    const searchValue = req.query.searchValue;
    const fromId = req.query.fromId;
    const tablename = await getTableName(fromId);
    const sql = `SELECT DISTINCT brand FROM ${tablename}`;
    const brands = (await conn.query(sql))[0];
    const filteredBrands = [...brands].filter((brand) => {
      return brand.brand.toLowerCase().includes(searchValue + "".toLowerCase());
    });
    filteredBrands.map((brand) =>
      respond.push({ value: brand.brand, label: brand.brand })
    );
    res.send(respond);
  } catch (e) {
    res.status(500).json({ message: "A server error occured: " + e });
  }
};

export const getCategories = async (req, res) => {
  try {
    const respond = [];
    const searchValue = req.query.searchValue;
    const fromId = req.query.fromId;
    const tablename = await getTableName(fromId);
    const sql = `SELECT DISTINCT category FROM ${tablename}`;
    const categories = (await conn.query(sql))[0];
    const filteredCategories = [...categories].filter((category) => {
      return category.category
        .toLowerCase()
        .includes(searchValue + "".toLowerCase());
    });
    filteredCategories.map((category) =>
      respond.push({ value: category.category, label: category.category })
    );
    res.send(respond);
  } catch (e) {
    res.status(500).json({ message: "A server error occured: " + e });
  }
};
