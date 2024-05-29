import fs from "fs";
import path from "path";

export async function getCache(cacheId, generator, year, month, date, hour, minute) {
  const now = new Date();

  // キャッシュ用のディレクトリを作成する
  const dir = path.resolve("cache");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 有効期限内のキャッシュが存在していればそれを JSON として読み込んで返す
  const file = path.join(dir, `${cacheId}.json`);
  let mtime = null;
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    mtime = new Date(stat.mtime);
  }
  const expires = calculateExpires(mtime !== null ? mtime : now, year, month, date, hour, minute);
  if (mtime !== null && now.getTime() < expires.getTime()) {
    console.log(`Using cache: ${file}: until ${expires.toLocaleString("ja-JP")}`);
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  // キャッシュするデータを取得
  let data;
  try {
    data = await generator();
  } catch (e) {
    console.error("[" + new Date().toLocaleString("ja-JP") + "] Fail to retrieve information.");
    throw e
  }

  // 新しくキャッシュを生成して有効期限をタイムスタンプに設定
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  console.log(`Cache updated: ${file}: until ${expires.toLocaleString("ja-JP")}`);

  return data;
}

// キャッシュの有効期限を算出
function calculateExpires(base, year, month, date, hour, minute) {
  const expires = new Date(base);
  expires.setHours(drift(expires.getHours(), hour, 0), drift(expires.getMinutes(), minute, 0), 0, 0);
  expires.setDate(drift(expires.getDate(), date, 1));
  expires.setMonth(drift(expires.getMonth(), month, 0));
  expires.setFullYear(drift(expires.getFullYear(), year, 1970));
  return expires;
}

function drift(value, drift, init) {
  if (drift === undefined || drift === null) {
    return init;
  }
  if (drift === 0) {
    return value;
  }
  return (Math.floor(value / drift) + 1) * drift;
}
