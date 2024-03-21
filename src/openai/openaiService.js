import OpenAI from "openai";
import { calculateTokenCost } from "../utils/utils.js";
import {
    createTables,
    getUser,
    addUser,
    addAmount,
} from "../database/database.js";

export async function getOpenAIReponse(message) {
    const openai = new OpenAI();

    let number_of_images = 0;

    let conversationLog = [
        // {
        //     role: "system",
        //     content: "",
        // },
    ];

    // parameter for fetch() { limit: # of messages to fetch }
    let prevMessages = await message.channel.messages.fetch({
        limit: 5,
    });
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
        if (message.author.bot) return;

        const userMessage = msg.content.replace(
            /<@1113624071721193524>\s*/,
            ""
        );

        if (!userMessage || userMessage === "help" || userMessage === "start")
            return;
        if (msg.attachments.size > 0) {
            msg.attachments.forEach((attachment) => {
                number_of_images++;
                conversationLog.push({
                    role: "user",
                    content: [
                        { type: "text", text: userMessage },
                        {
                            type: "image_url",
                            image_url: {
                                url: attachment.url,
                                detail: "low",
                            },
                        },
                    ],
                });
            });
            return;
        }

        conversationLog.push({
            role: "user",
            content: userMessage,
        });
    });

    // model: "gpt-4-turbo-preview"
    // model: "gpt-4-vision-preview"
    const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: conversationLog,
        max_tokens: 1000,
    });

    createTables();
    if ((await getUser(message.author.id)) === undefined) {
        await addUser(message.author.id, message.author.username);
    }

    const prompt_tokens = completion.usage?.prompt_tokens;
    const completion_tokens = completion.usage?.completion_tokens;
    const cost = calculateTokenCost(
        prompt_tokens,
        completion_tokens,
        number_of_images
    );

    await addAmount(message.author.id, cost);

    return completion.choices[0].message?.content;
}
