import { Configuration, OpenAIApi } from "openai";
import { Client, IntentsBitField } from "discord.js";
import fs from "fs";
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

try {
  client.on("messageCreate", async (message) => {
    console.log(message);
    if (message.author.bot) return;
    if (message.system) return;
    /**
     * Check if the user has the Paid role otherwise it tells them to get the role
     */
    if (message.member.roles.cache.some((role) => role.name === "Paid")) {
      // if its in the get started channel then return
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

      // if its the help channel then return
      if (message.channelId === "1118386041057968228") return;

      await message.channel.sendTyping();

      // @CheapGPT commands
      if (message.content.split(" ")[0] === "<@1113624071721193524>") {
        let text = message.content.replace(/<@1113624071721193524>\s*/, "");

        const command = text.split(" ")[0].toLowerCase();

        if (command === "help" || command === "") {
          message.reply(
            'type "<@1113624071721193524> start" in <#1114830303740047410> or your own channel to create a new channel\nthen type your message to the bot in the new channel to get a response\nto delete your own coversation/channel you can type "<@1113624071721193524> close" to delete the channel'
          );
          return;
        }

        /**
         * Delete the category and all the channels in it
         */
        if (command === "cancel") {
          /**
           * @todo make sure the user is an admin sometime
           * */
          const user = text.replace(/cancel\s*/, "").split(" ")[0];
          const channelName = user.replace(/<@/, "").replace(/>/, "");
          if (user) {
            let category = message.guild.channels.cache.find(
              (channel) => channel.type === 4 && channel.name === channelName
            );
            if (category) {
              message.guild.channels.cache.forEach(async (channel) => {
                if (channel.parentId === category.id) {
                  await channel.delete();
                }
              });
              category.delete();
              message.reply("Ending conversation with " + user);
            } else {
              message.reply("User has no channels or is not found");
            }
          } else {
            message.reply("Specify who you are trying to cancel");
          }
          return;
        }

        /**
         * Deletes the channel
         */
        if (command === "close") {
          if (
            message.channelId !== "1114830303740047410" &&
            message.channelId !== "1118386041057968228"
          )
            message.channel.delete();
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

      /**
       * this is the part where it sends the message to the bot and gets a response
       */

      let conversationLog = [
        {
          role: "system",
          content:
            "try to have ever response be less than 2000 characters and make sure to use as little tokens as possible",
        },
      ];

      // parameter for fetch() { limit: # of messages to fetch }
      let prevMessages = await message.channel.messages.fetch({ limit: 10 });
      prevMessages.reverse();

      prevMessages.forEach((msg) => {
        if (msg.author.id === "1113624071721193524") {
          if (
            msg.content ===
              'type "<@1113624071721193524> start" in <#1114830303740047410> or your own channel to create a new channel\nthen type your message to the bot in the new channel to get a response\nto delete your own coversation/channel you can type "<@1113624071721193524> close" to delete the channel' ||
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

        const userMessage = msg.content.replace(
          /<@1113624071721193524>\s*/,
          ""
        );
        if (!userMessage || userMessage === "help" || userMessage === "start")
          return;
        conversationLog.push({
          role: "user",
          content: userMessage,
        });
      });

      // model: "gpt-3.5-turbo-0613"
      // model: "gpt-4-0613"
      // model: "gpt-3.5-turbo-16k-0613"
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-0613",
        messages: conversationLog,
      });

      let response = completion.data.choices[0].message.content;

      try {
        if (response) {
          if (response.length > 2000) {
            fs.writeFileSync("response.txt", response);
            message.reply({ files: ["./response.txt"] }).then(() => {
              fs.unlinkSync("./response.txt");
            });
          } else {
            message.reply(response);
          }
        } else {
          message.reply(
            "There was an error generating the message. Please try again."
          );
        }
      } catch (error) {
        console.log(error);
        message.reply("There was an error generating the message.");
      }
    } else {
      message.reply(
        "You do not have permission to use this bot contact an admin in <#1118386041057968228>"
      );
    }
  });
} catch (error) {
  console.log(error);
}
