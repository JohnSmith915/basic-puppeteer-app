import puppeteer from "puppeteer";
import express from "express";

const app = express();

import fs from "fs";
import path from "path";

function getProjectStructure(startFile) {
    const rootDir = path.dirname(path.resolve(startFile));
    let result = "";

    function walk(dir, indent = "") {
        const items = fs.readdirSync(dir, { withFileTypes: true }).filter((item) => item.name !== "node_modules");

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const isLast = i === items.length - 1;
            const pointer = isLast ? "└─ " : "├─ ";

            result += indent + pointer + item.name + "\n";

            if (item.isDirectory()) {
                const newIndent = indent + (isLast ? "   " : "│  ");
                walk(path.join(dir, item.name), newIndent);
            }
        }
    }

    walk(rootDir);
    return result.trim();
}
(async () => {
    const port = process.env.PORT || 8080;
    // Start the server
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

    app.get("/file", (req, res) => {
        res.type("text/plain").send(getProjectStructure(process.cwd()));
    });

    console.log("main func");
    const browser = await puppeteer.launch({
        headless: true, // Run the browser in headless mode
        args: ["--single-process", "--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--no-zygote", "--disable-dev-shm-usage"],
        disableXvfb: true,
        executablePath: "./google-chrome-stable",
        timeout: 60000,
    });
    console.log("browser started");

    const page = await browser.newPage();
    await page.goto("https://example.com");
    console.log("page loaded");

    app.get("/", async (req, res) => {
        try {
            const screenshotBuffer = await page.screenshot({ type: "png", fullPage: true });
            res.set("Content-Type", "image/png");
            res.send(screenshotBuffer);
        } catch (err) {
            console.error("Screenshot error:", err.message);
            // instead of blowing up, just send text back
            res.status(500).send("Screenshot unavailable (page may be reloading)");
        }
    });
})();
