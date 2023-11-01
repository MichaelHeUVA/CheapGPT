import { Configuration, OpenAIApi } from "openai";
import { Client, IntentsBitField } from "discord.js";
import fs from "fs";
import dotenv from "dotenv";
import { getUser, addUser, addAmount, reset } from "./database.js";
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
  console.log("CheapGPT bot is ready");
});

client.login(process.env.DISCORD_API_KEY);

client.on("messageCreate", async (message) => {
  try {
    //console.log(message);

    if (message.author.bot) return;
    if (message.system) return;
    /**
     * Check if the user has the Paid role otherwise it tells them to get the role
     */
    if (message.member?.roles.cache.some((role) => role.name === "Paid")) {
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
         * Only michael.he can do this
         */
        if (
          command === "cancel" &&
          message.member?.roles.cache.some((role) => role.name === "Admin")
        ) {
          const user = text.replace(/cancel\s*/, "").split(" ")[0];
          const channelName = user.replace(/<@/, "").replace(/>/, "");
          if (user) {
            let category = message.guild?.channels.cache.find(
              (channel) => channel.type === 4 && channel.name === channelName
            );
            if (category) {
              message.guild?.channels.cache.forEach(async (channel) => {
                if (channel.parentId === category?.id) {
                  await channel.delete();
                }
              });
              message.reply("Ending conversation with " + user);
              category.delete();
            } else {
              message.reply("User has no channels or is not found");
            }
          } else {
            message.reply("Specify who you are trying to cancel");
          }
          return;
        } else if (command === "cancel") {
          message.reply("You do not have permission to do that");
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
         * Creates the channel under the persons category
         */
        if (command === "start") {
          const channelName = message.author.id;

          try {
            let category = message.guild?.channels.cache.find(
              (channel) => channel.type === 4 && channel.name === channelName
            );
            if (!category) {
              category = await message.guild?.channels.create({
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

            const channelCount = message.guild?.channels.cache.filter(
              (channel) => channel.parentId === category?.id
            ).size;

            const now = new Date();
            const uniqueID = [
              now.getFullYear(),
              now.getMonth() + 1,
              now.getDate(),
              now.getHours(),
              now.getMinutes(),
              now.getSeconds(),
            ].join("-");

            // const channel = await message.guild.channels.create({
            //   name: [message.author.username, uniqueID].join("-"),
            //   type: 0,
            //   parent: category.id,
            // });

            const channel = await message.guild?.channels.create({
              name: uniqueID,
              type: 0,
              parent: category?.id,
            });
            if (channel)
              message.reply(
                "Created new channel: " +
                  message.guild?.channels.cache.get(channel.id)?.toString()
              );
            else
              message.reply(
                "There was an error creating the channel. Please try again."
              );
          } catch (error) {
            console.error("Error creating channel: ", error);
            message.channel.send("There was an error creating the channel");
          }
          return;
        }
      }

      /**
       * Sends the message to the bot and gets a response
       */

      let conversationLog = [
        // {
        //   role: "system",
        //   content: "", //"try to have ever response be less than 2000 characters and make sure to use as little tokens as possible",
        // },
      ];

      // parameter for fetch() { limit: # of messages to fetch }
      let prevMessages = await message.channel.messages.fetch({ limit: 3 });
      prevMessages.reverse();

      prevMessages.forEach((msg) => {
        if (msg.author.id === "1113624071721193524") {
          if (msg.mentions.repliedUser) return;
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
        model: "gpt-4-0613",
        messages: conversationLog,
        temperature: 1,
        // max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const response = completion.data.choices[0].message?.content;

      if ((await getUser(message.author.id)) === undefined) {
        await addUser(message.author.id, message.author.username);
      }

      const prompt_tokens = completion.data.usage?.prompt_tokens;
      const completion_tokens = completion.data.usage?.completion_tokens;
      // const total_tokens = completion.data.usage?.total_tokens;
      const cost = calculateTokenCost(prompt_tokens, completion_tokens);
      await addAmount(message.author.id, cost);

      try {
        if (response) {
          if (response.length > 2000) {
            fs.writeFileSync("response.txt", response);
            message.channel.send({ files: ["./response.txt"] }).then(() => {
              fs.unlinkSync("./response.txt");
            });
          } else {
            message.channel.send(response);
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

      /**
       * Streaming it is too hard might come back to it later
       */
      // let resultText = "";
      // const chunk = completion.data;
      // const lines = chunk.split("\n\n");
      // const parsedLines = lines
      //   .map((line) => line.replace(/^data: /, "").trim())
      //   .filter((line) => line !== "" && line !== "[DONE]");
      // parsedLines.forEach((line) => {
      //   let contentPattern = /"content":"(.*?)"/;
      //   let match = line.match(contentPattern);
      //   let content;
      //   if (match) {
      //     content = match[1];
      //   }
      //   resultText += content;
      //   console.log(resultText.toString());
      // });
      // fs.writeFileSync("response.txt", resultText);
      // resultText = resultText.toString();
      // try {
      //   if (resultText) {
      //     if (resultText.length > 2000) {
      //       fs.writeFileSync("response.txt", resultText);
      //       message.channel.send({ files: ["./response.txt"] }).then(() => {
      //         fs.unlinkSync("./response.txt");
      //       });
      //     } else {
      //       message.channel.send(resultText);
      //     }
      //   } else {
      //     message.reply(
      //       "There was an error generating the message. Please try again."
      //     );
      //   }
      // } catch (error) {
      //   console.log(error);
      //   message.reply("There was an error generating the message.");
      // }
    } else {
      message.reply(
        "You do not have permission to use this bot contact an admin in <#1118386041057968228>"
      );
    }
  } catch (error) {
    console.log(error);
  }
});

function calculateTokenCost(prompt_tokens, completion_tokens) {
  return (prompt_tokens * 0.03) / 1000 + (completion_tokens * 0.06) / 1000;
}
