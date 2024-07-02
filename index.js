const cheerio = require('cheerio');
const http = require('http');
const fetch = require('cross-fetch');
const url = require('url');

const port = 8655; // Change if needed

async function getLastUpdate(username) {
    const profileUrl = `https://mydramalist.com/profile/${username}`;
    console.log(`Scraping URL: ${profileUrl}`);
    
    try {
        const response = await fetch(profileUrl);
        const html = await response.text();
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

        return list;

    } catch (error) {
        console.log(error);
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
            console.log("✔ Scraped " + Date());
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
