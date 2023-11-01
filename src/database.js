import dotenv from "dotenv";
import mysql from "mysql2";
dotenv.config();

const pool = mysql
  .createPool({
    host: process.env.MYSQL_HOST,
    user: "root",
    password: process.env.MYSQL_PASSWORD,
    database: "cheapgpt",
  })
  .promise();

export async function getUser(id) {
  const [rows] = await pool.query(
    `
      SELECT * 
      FROM users 
      WHERE discord_uid = ?
      `,
    [id]
  );
  return rows[0];
}

export async function addUser(discordUID, discordName) {
  if (await getUser(discordUID)) return;
  await pool.query(
    `
      INSERT INTO users (discord_uid, discord_name, amount)
      VALUES (?, ?, ?)
      `,
    [discordUID, discordName, 0]
  );
}

export async function addAmount(discordUID, amount) {
  await pool.query(
    `
        UPDATE users
        SET amount = amount + ?
        WHERE discord_uid = ?
        `,
    [amount, discordUID]
  );
}

export async function reset(discordUID) {
  await pool.query(
    `
        UPDATE users
        SET amount = 0
        WHERE discord_uid = ?
        `,
    [discordUID]
  );
}
