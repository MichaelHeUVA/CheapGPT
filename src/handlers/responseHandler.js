import fs from "fs";

export function handleResponse(message, response) {
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
}
