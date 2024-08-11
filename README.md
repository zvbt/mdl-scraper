# mdl-scraper

Simple MyDramalist.com api to fetch the latest list update.

## Usage

### Self hosted (recommended)

1. Clone the repo
```bash
git clone https://github.com/zvbt/mdl-scraper.git && cd mdl-scraper
```
2. Install dependencies
```bash
bun install
```
3. Run the project
```bash
bun start
```
7. Now go to
```
http://127.0.0.1:8655/data?username=[your mdl username]
```
Change the port if you need to [index.js](/index.js#L6)

### Public api

Might get shut down at any time: `https://mdl.zvbt.space/data?username=[your mdl username]`

##
Made with ❤ by zvbt
