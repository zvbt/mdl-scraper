const cheerio = require('cheerio');
const { Elysia } = require('elysia');
const fetch = require('node-fetch');

const server = new Elysia();
const port = 8655; // Change if needed


async function getLastUpdate(username) {
    const url = `https://mydramalist.com/profile/${username}`;
    console.log(`Scraping URL: ${url}`);
    
    try {
        const response = await fetch(url);
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

server.get('/data', async (request) => {
    const username = request.query.username;

    if (!username) {
        return { error: 'Username query parameter is required (/data?username=Cyadine)' };
    }

    try {
        const data = await getLastUpdate(username);
        console.log("✔ Scraped " + Date());
        return data;
    } catch (error) {
        return { error: 'Internal Server Error' };
    }
});

server.listen(port);
console.log(`Server running at http://127.0.0.1:${port}/`);