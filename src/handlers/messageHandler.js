import { getOpenAIReponse } from "../openai/openaiService.js";
import { handleResponse } from "./responseHandler.js";

export async function handleMessage(message) {
    try {
        // console.log(message);

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
                let text = message.content.replace(
                    /<@1113624071721193524>\s*/,
                    ""
                );

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
                    message.member?.roles.cache.some(
                        (role) => role.name === "Admin"
                    )
                ) {
                    const user = text.replace(/cancel\s*/, "").split(" ")[0];
                    const channelName = user.replace(/<@/, "").replace(/>/, "");
                    if (user) {
                        let category = message.guild?.channels.cache.find(
                            (channel) =>
                                channel.type === 4 &&
                                channel.name === channelName
                        );
                        if (category) {
                            message.guild?.channels.cache.forEach(
                                async (channel) => {
                                    if (channel.parentId === category?.id) {
                                        await channel.delete();
                                    }
                                }
                            );
                            message.reply("Ending conversation with " + user);
                            category.delete();
                        } else {
                            message.reply(
                                "User has no channels or is not found"
                            );
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
                            (channel) =>
                                channel.type === 4 &&
                                channel.name === channelName
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
                                        allow: [
                                            "1024",
                                            "2048",
                                            "32768",
                                            "65536",
                                        ], // Allow only the user to view this category 2048 is the bit value of "SEND_MESSAGES" 32768 is the bit value of "ATTACH_FILES" 65536 is the bit value of "READ_MESSAGE_HISTORY"
                                    },
                                ],
                            });
                        }

                        const now = new Date();
                        const uniqueID = [
                            now.getFullYear(),
                            now.getMonth() + 1,
                            now.getDate(),
                            now.getHours(),
                            now.getMinutes(),
                            now.getSeconds(),
                        ].join("-");

                        const channel = await message.guild?.channels.create({
                            name: uniqueID,
                            type: 0,
                            parent: category?.id,
                        });
                        if (channel)
                            message.reply(
                                "Created new channel: " +
                                    message.guild?.channels.cache
                                        .get(channel.id)
                                        ?.toString()
                            );
                        else
                            message.reply(
                                "There was an error creating the channel. Please try again."
                            );
                        return;
                    } catch (error) {
                        console.error("Error creating channel: ", error);
                        message.channel.send(
                            "There was an error creating the channel"
                        );
                    }
                    return;
                }
            }

            let response = await getOpenAIReponse(message);
            handleResponse(message, response);
        } else {
            message.reply(
                "You do not have permission to use this bot contact an admin in <#1118386041057968228>"
            );
        }
    } catch (error) {
        console.log(error);
    }
}
