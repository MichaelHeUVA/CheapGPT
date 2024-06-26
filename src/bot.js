import { Client, IntentsBitField } from "discord.js";
import { handleMessage } from "./discord/messageHandler.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.login(process.env.DISCORD_API_KEY);

client.on("ready", (c) => {
    console.log("CheapGPT bot is ready");
});

client.on("messageCreate", async (message) => {
    handleMessage(message);
});
