import fs from "fs";
import { generateLatex } from "../puppeteer/puppeteerService.js";

export async function handleResponse(message, response) {
    try {
        if (response) {
            if (response.length <= 2000) {
                message.channel.send(response);
            }
            // else {
            //     fs.writeFileSync("response.txt", response);
            //     message.channel.send({ files: ["./response.txt"] }).then(() => {
            //         fs.unlinkSync("./response.txt");
            //     });
            // }
            const latex = await generateLatex(response);
            message.channel.send({
                files: [
                    {
                        attachment: latex,
                    },
                ],
            });
        } else {
            message.reply(
                "There was an error generating the message. Please try again."
            );
        }
    } catch (error) {
        console.log(error);
        message.reply("There was an error generating the message.");
    }
}
