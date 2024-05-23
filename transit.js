import puppeteer from "puppeteer";

export async function getTransite() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });
  const page = await browser.newPage();
  const url = "https://transit.yahoo.co.jp/traininfo/area/4/"; // Yahoo! Japan 路線情報(関東)のURL

  await page.goto(url, { waitUntil: "networkidle2" });

  // 遅延情報を取得
  const delayedLines = await page.evaluate(() => {
    const lines = [];
    document.querySelectorAll(".trouble").forEach((element) => {
      element.querySelectorAll("table tr").forEach((tr) => {
        const columns = [];
        tr.querySelectorAll("td").forEach((td) => {
          columns.push(td.textContent.trim());
        });
        if (columns.length >= 3) {
          lines.push({
            "line-name": columns[0],
            status: columns[1],
            description: columns[2],
          });
        }
      });
    });

    return lines;
  });

  await browser.close();
  return { "delayed-line": delayedLines };
}
