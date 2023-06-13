import { Configuration, OpenAIApi } from "openai";
import { Client, IntentsBitField } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on("ready", (c) => {
  console.log("CheapGPT is on and ready");
});

client.login(process.env.DISCORD_API_KEY);

// Where the magic happens
try {
  client.on("messageCreate", async (message) => {
    console.log(message);
    if (message.author.bot) return;
    if (message.system) return;
    if (
      message.channelId === "1114830303740047410" &&
      message.content !== "<@1113624071721193524> start" &&
      message.content !== "<@1113624071721193524> help" &&
      message.content !== "<@1113624071721193524>"
    ) {
      message.reply(
        'type "<@1113624071721193524> start" to create a new channel'
      );
      return;
    }

    await message.channel.sendTyping();

    if (message.content.split(" ")[0] === "<@1113624071721193524>") {
      let text = message.content.replace(/<@1113624071721193524>\s*/, "");

      const command = text.split(" ")[0].toLowerCase();

      if (command === "help" || command === "") {
        message.reply(
          'type "<@1113624071721193524> start" in <#1114830303740047410> to create a new channel\nthen type your message to the bot in the new channel to get a response'
        );
        return;
      }

      /**
       * this is the part where it creates the channel under the persons category
       */
      if (command === "start") {
        const channelName = message.author.id;

        try {
          let category = message.guild.channels.cache.find(
            (channel) => channel.type === 4 && channel.name === channelName
          );
          if (!category) {
            category = await message.guild.channels.create({
              name: channelName,
              type: 4,
              permissionOverwrites: [
                {
                  id: message.guild.id, // For the @everyone role
                  deny: ["1024"], // Deny everyone to view this category, 1024 or 0x400 is the bit value of "VIEW_CHANNEL"
                },
                {
                  id: message.author.id, // For the user
                  allow: ["1024", "2048", "65536"], // Allow only the user to view this category 2048 is the bit value of "SEND_MESSAGES" 65536 is the bit value of "READ_MESSAGE_HISTORY"
                },
              ],
            });
          }

          const channelCount = message.guild.channels.cache.filter(
            (channel) => channel.parentId === category.id
          ).size;

          const channel = await message.guild.channels.create({
            name: message.author.username + " " + (channelCount + 1),
            type: 0,
            parent: category.id,
          });

          message.reply(
            "Created new channel: " +
              message.guild.channels.cache.get(channel.id).toString()
          );
        } catch (error) {
          console.error("Error creating channel: ", error);
          message.channel.send("There was an error creating the channel");
        }
        return;
      }
    }

    let conversationLog = [
      {
        role: "system",
        content:
          "every response must be under 2000 words or less and make sure to use as little tokens as possible",
      },
    ];

    // parameter for fetch() { limit: 20 }
    let prevMessages = await message.channel.messages.fetch();
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
      if (msg.author.id === "1113624071721193524") {
        if (
          msg.content ===
            "type something, after the mention, to get a response" ||
          msg.content ===
            'type "<@1113624071721193524> start" in <#1114830303740047410> to create a new channel\nthen type "<@1113624071721193524> [message]" in the new channel to get a response' ||
          msg.content.slice(0, 20) === "Created new channel:"
        )
          return;
        conversationLog.push({
          role: "assistant",
          content: msg.content,
        });
        return;
      }
      //if (msg.author.id !== client.user.id) return;
      if (message.author.bot) return;
      //if (msg.author.id !== message.author.id) return;

      const userMessage = msg.content.replace(/<@1113624071721193524>\s*/, "");
      if (!userMessage || userMessage === "help" || userMessage === "start")
        return;
      conversationLog.push({
        role: "user",
        content: userMessage,
      });
    });

    // model: "gpt-3.5-turbo"
    // model: "gpt-4"
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: conversationLog,
    });

    let response = completion.data.choices[0].message.content;
    console.log(conversationLog);
    if (response) {
      message.reply(response);
    } else {
      message.channel.send("There was an error generating the message.");
    }
  });
} catch (error) {
  console.log(error);
}
