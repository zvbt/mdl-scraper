const cheerio = require('cheerio');
const fsPromises = require('fs/promises');
const path = require('path');
const { Elysia } = require('elysia');
const fs = require('fs').promises;
const config = require('./config.js');

const server = new Elysia();
const jsonPath = path.join(process.cwd(), '/data.json');

async function getLastUpdate() {
    const url = `https://mydramalist.com/profile/${config.username}`;
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

        await fsPromises.writeFile(jsonPath, JSON.stringify(list));

    } catch (error) {
        console.log(error);
    }
}

server.get('/data', async () => {
    try {
        await getLastUpdate();
        console.log("✔ Scraped " + Date());
        const data = await fs.readFile(jsonPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { error: 'Internal Server Error' };
    }
});

server.listen(config.port);
console.log(`Server running at http://127.0.0.1:${config.port}/`);
