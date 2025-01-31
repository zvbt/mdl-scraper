const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const http = require('http');
const url = require('url');
const cheerio = require('cheerio');

puppeteer.use(StealthPlugin());

const port = 8654; // Change if needed

async function getLastUpdate(username) {
    const profileUrl = `https://mydramalist.com/profile/${username}`;
    console.log(`Scraping URL: ${profileUrl}`);

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
        await page.goto(profileUrl, { waitUntil: "networkidle2" });

        const html = await page.content();
        const $ = cheerio.load(html);
        const list = [];

        const selector = '#content > div > div.container-fluid.profile-container > div > div.col-lg-8.col-md-8 > div.row.stats-section > div:nth-child(2) > div > ul > li';

        $(selector).first().each(function () {
            const activityHtml = $(this).find('.activity').html();
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

        await browser.close();
        return list;

    } catch (error) {
        console.error("Puppeteer failed:", error);
        await browser.close();
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
            console.log("✅ Scraped " + Date()); 
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(port, () => {
    console.log(`Server running at http://127.0.0.1:${port}/`);
});
