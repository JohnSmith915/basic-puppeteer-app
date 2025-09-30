import puppeteer from "puppeteer";
import express from "express";

const app = express();

(async () => {
    const port = process.env.PORT || 8080;
    // Start the server
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

    console.log("main func");
    const browser = await puppeteer.launch({
        headless: true, // Run the browser in headless mode
        args: ["--single-process", "--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--no-zygote", "--disable-dev-shm-usage"],
        disableXvfb: true,
        executablePath: "./google-chrome-stable",
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
