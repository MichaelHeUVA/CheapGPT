import fs from "fs";
import mjAPI from "mathjax-node";
import svg2png from "svg2png";

export function handleResponse(message, response) {
    try {
        // mjAPI.config({
        //     MathJax: {
        //         // Add your configuration here
        //     },
        // });
        // mjAPI.start();
        // mjAPI.typeset(
        //     {
        //         math: response,
        //         format: "TeX", // or "inline-TeX", "MathML"
        //         svg: true, // Generates SVG output
        //     },
        //     function (data) {
        //         if (!data.errors) {
        //             // Convert SVG to PNG using svg2png
        //             svg2png(Buffer.from(data.svg))
        //                 .then((buffer) => {
        //                     // Save the PNG image
        //                     fs.writeFileSync("output.png", buffer);
        //                 })
        //                 .catch((e) =>
        //                     console.error("Error converting SVG to PNG:", e)
        //                 );
        //         }
        //     }
        // );

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
