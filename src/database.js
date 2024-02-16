import dotenv from "dotenv";
import sqlite3 from "sqlite3";
dotenv.config();

const db = new sqlite3.Database(
    "./database.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
        if (err) return console.error(err.message);
    }
);

export function createTables() {
    db.serialize(() => {
        db.run(
            `CREATE TABLE IF NOT EXISTS users (
            discord_uid TEXT PRIMARY KEY,
            discord_name TEXT NOT NULL,
            amount INTEGER NOT NULL
        )`
        );
    });
}

export function getUser(id) {
    return new Promise((resolve, reject) => {
        db.get(
            `
            SELECT *
            FROM users
            WHERE discord_uid = ?
            `,
            [id],
            (err, row) => {
                if (err) reject(err);
                resolve(row);
            }
        );
    });
}

export function addUser(discordUID, discordName) {
    return new Promise((resolve, reject) => {
        db.run(
            `
            INSERT INTO users (discord_uid, discord_name, amount)
            VALUES (?, ?, 0)
            `,
            [discordUID, discordName],
            (err) => {
                if (err) reject(err);
                resolve();
            }
        );
    });
}

export function addAmount(discordUID, amount) {
    return new Promise((resolve, reject) => {
        db.run(
            `
            UPDATE users
            SET amount = amount + ?
            WHERE discord_uid = ?
            `,
            [amount, discordUID],
            (err) => {
                if (err) reject(err);
                resolve();
            }
        );
    });
}

export function reset(discordUID) {
    return new Promise((resolve, reject) => {
        db.run(
            `
            UPDATE users
            SET amount = 0
            WHERE discord_uid = ?
            `,
            [discordUID],
            (err) => {
                if (err) reject(err);
                resolve();
            }
        );
    });
}
