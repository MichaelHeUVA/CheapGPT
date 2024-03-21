import OpenAI from "openai";
import { calculateTokenCost } from "../utils/utils.js";
import {
    createTables,
    getUser,
    addUser,
    addAmount,
} from "../database/database.js";

export async function getOpenAIReponse(
    message,
    conversationLog,
    number_of_images
) {
    // model: "gpt-4-turbo-preview"
    // model: "gpt-4-vision-preview"
    let completion;
    if (number_of_images > 0) {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        completion = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: conversationLog,
        });
    } else {
        const openai = new OpenAI({
            baseURL: "https://router.neutrinoapp.com/api/engines",
            apiKey: process.env.NEUTRINO_API_KEY,
        });
        completion = await openai.chat.completions.create({
            model: "chat",
            messages: conversationLog,
        });
    }

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

    console.log(
        `Model used: ${completion.model}\nUser: ${message.author.id}\nCost: ${cost}\nResponse: ${completion.choices[0].message?.content}`
    );
    return completion.choices[0].message?.content;
}
