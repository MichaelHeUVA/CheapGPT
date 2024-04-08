import puppeteer from "puppeteer";

export async function generateLatex(input) {
    let html = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <title>My Document</title>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
                body {
                    height: max-content;
                    width: max-content;
                    font-size: 24px;
                    padding: 10px;
                    color: white;
                    background-color: rgba(0, 0, 0, 0);
                    background-color: black;
                    font-family: "Roboto", sans-serif;
                }
            </style>
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css"
                integrity="sha384-wcIxkf4k558AjM3Yz3BBFQUbk/zgIYC2R0QpeeYb+TwlBVMrlgLqwRjRtGZiK7ww"
                crossorigin="anonymous"
            />
    
            <!-- The loading of KaTeX is deferred to speed up page rendering -->
            <script
                defer
                src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js"
                integrity="sha384-hIoBPJpTUs74ddyc4bFZSM1TVlQDA60VBbJS0oA934VSz82sBx1X7kSx2ATBDIyd"
                crossorigin="anonymous"
            ></script>
    
            <!-- To automatically render math in text elements, include the auto-render extension: -->
            <script
                defer
                src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js"
                integrity="sha384-43gviWU0YVjaDtb/GhzOouOXtZMP/7XUzwPTstBeZFe/+rCMvRwr4yROQP43s0Xk"
                crossorigin="anonymous"
                onload="renderMathInElement(document.body);"
            ></script>
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css"
                integrity="sha384-wcIxkf4k558AjM3Yz3BBFQUbk/zgIYC2R0QpeeYb+TwlBVMrlgLqwRjRtGZiK7ww"
                crossorigin="anonymous"
            />
            <script
                defer
                src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js"
                integrity="sha384-hIoBPJpTUs74ddyc4bFZSM1TVlQDA60VBbJS0oA934VSz82sBx1X7kSx2ATBDIyd"
                crossorigin="anonymous"
            ></script>
            <script
                defer
                src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js"
                integrity="sha384-43gviWU0YVjaDtb/GhzOouOXtZMP/7XUzwPTstBeZFe/+rCMvRwr4yROQP43s0Xk"
                crossorigin="anonymous"
            ></script>
            <script>
                document.addEventListener("DOMContentLoaded", function () {
                    renderMathInElement(document.body, {
                        // customised options
                        // • auto-render specific keys, e.g.:
                        delimiters: [
                            { left: "$$", right: "$$", display: true },
                            { left: "$", right: "$", display: false },
                            { left: "\\(", right: "\\)", display: false },
                            { left: "\\[", right: "\\]", display: true },
                        ],
                        // • rendering keys, e.g.:
                        throwOnError: false,
                    });
                });
            </script>
    
            <script
                type="module"
                src="https://md-block.verou.me/md-block.js"
            ></script>
        </head>
        <body>
            <md-block>${input}</md-block>
        </body>
    </html>    
    `;

    const encodedHtml = encodeURIComponent(html);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`data:text/html,${encodedHtml}`, {
        waitUntil: "networkidle0",
    });
    const content = await page.$("body");

    if (content != null) {
        const imageBuffer = await content.screenshot({
            omitBackground: true,
        });

        await page.close();
        await browser.close();
        return imageBuffer;
    }
}
