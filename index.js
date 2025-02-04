const { chromium } = require('playwright');
const http = require('http');
const url = require('url');
const cheerio = require('cheerio');

// Apply basic stealth by setting random User-Agent and disabling WebGL
async function getLastUpdate(username) {
    const profileUrl = `https://mydramalist.com/profile/${username}`;
    console.log(`Scraping URL: ${profileUrl}`);

    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-software-rasterizer",
            ]
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        const page = await context.newPage();

        // Apply WebGL and Webdriver stealth techniques
        await page.addInitScript(() => {
            // Disable WebGL
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { app: {}, webstore: {}, runtime: {} }; // Mock Chrome object
            delete navigator.__proto__.webdriver;
        });

        await page.goto(profileUrl, { waitUntil: "domcontentloaded" });

        const html = await page.content();
        await browser.close(); // Close browser after getting content

        const $ = cheerio.load(html);
        const list = [];
        const selector = '#content > div > div.container-fluid.profile-container > div > div.col-lg-8.col-md-8 > div.row.stats-section > div:nth-child(2) > div > ul > li';
        const items = $(selector);

        items.first().each(function () {
            const activityHtml = $(this).find('.activity').html();
            if (!activityHtml) return;

            const episodeInfo = activityHtml.split('<div').shift().replace('<strong>', '').replace('</strong>', '');
            const lastUpdateTime = activityHtml.split('">').pop().split('</').shift();
            const dramaUrl = "https://mydramalist.com" + $(this).find('a').attr('href');
            const title = $(this).find('a').attr('title');
            const poster = $(this).find('img').attr('src');

            list.push({
                title,
                episode: episodeInfo.replace('Currently watching', 'Episode:'),
                lastUpdateTime,
                poster,
                dramaUrl
            });
        });

        return list;
    } catch (error) {
        console.error("Playwright Error:", error);
        if (browser) await browser.close();
        return [];
    }
}

const server = http.createServer(async (req, res) => {
    const reqUrl = url.parse(req.url, true);
    const path = reqUrl.pathname;

    if (path === '/data') {
        const username = reqUrl.query.username;

        if (!username) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Username query parameter is required (/data?username=Cyadine)' }));
            return;
        }

        try {
            const data = await getLastUpdate(username);
            console.log("Scraped " + Date());

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (error) {
            console.error("Server Error:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error', details: error.message }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(8654, () => {
    console.log(`Server running at http://127.0.0.1:8654/`);
});
