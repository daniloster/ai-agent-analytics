import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const pages = [
  { file: 'html/01-executive-overview.html', out: 'images/01-executive-overview.png' },
  { file: 'html/02-team-breakdown.html',     out: 'images/02-team-breakdown.png' },
  { file: 'html/03-reliability.html',        out: 'images/03-reliability.png' },
  { file: 'html/04-billing.html',            out: 'images/04-billing.png' },
  { file: 'html/05-components.html',         out: 'images/05-components.png' },
  { file: 'html/06-understanding.html',      out: 'images/06-understanding.png' },
];

mkdirSync(join(__dirname, 'images'), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chromePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

for (const { file, out } of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(`file://${join(__dirname, file)}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.screenshot({
    path: join(__dirname, out),
    fullPage: true,
  });
  await page.close();
  console.log(`Saved: ${out}`);
}

await browser.close();
