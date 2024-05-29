import axios from "axios";
import { getCache } from "./cache.js";

// News API キー
const apiKey = "691484240de04b8685fbda1970760cac";
const url = `https://newsapi.org/v2/top-headlines?country=jp&category=general&apiKey=${apiKey}`;

export async function getNews() {
  try {

    // ニュースデータの取得
    // 開発者アカウントでは 24h で 100req が許可されている。それを超過すると 429 レスポンスが返る。
    const data = await getCache("newsapi", async () => {
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (e) {
        if (e.response.data.code === "rateLimited") {
          return e.response.data;
        }
        throw e;
      }
    }, 0, 0, 0, 0, 30);
    if (data.status !== "ok") {
      throw new Error(`${data.message}`);
    }

    // ニュースデータを整形
    const articles = data.articles.filter((article) => article.title !== null).map((article) => {
      return {
        title: toHalfWidth(article.title),
        description: toHalfWidth(article.description),
        url: article.url,
        image: article.urlToImage,
      };
    });

    return {
      articles: articles,
    };
  } catch (e) {
    console.log("ERROR: failed to retrieve news articles.");
    console.log(e);
    return {
      articles: [{
        title: `${e}`,
        description: "",
        url: null,
        image: null
      }],
      error: `${e}`
    };
  }
}

function toHalfWidth(str) {
  // 全角カナ文字と半角カナ文字の対応表を作成
  let kanaMap = {
    ガ: "ｶﾞ",
    ギ: "ｷﾞ",
    グ: "ｸﾞ",
    ゲ: "ｹﾞ",
    ゴ: "ｺﾞ",
    ザ: "ｻﾞ",
    ジ: "ｼﾞ",
    ズ: "ｽﾞ",
    ゼ: "ｾﾞ",
    ゾ: "ｿﾞ",
    ダ: "ﾀﾞ",
    ヂ: "ﾁﾞ",
    ヅ: "ﾂﾞ",
    デ: "ﾃﾞ",
    ド: "ﾄﾞ",
    バ: "ﾊﾞ",
    ビ: "ﾋﾞ",
    ブ: "ﾌﾞ",
    ベ: "ﾍﾞ",
    ボ: "ﾎﾞ",
    パ: "ﾊﾟ",
    ピ: "ﾋﾟ",
    プ: "ﾌﾟ",
    ペ: "ﾍﾟ",
    ポ: "ﾎﾟ",
    ヴ: "ｳﾞ",
    ヷ: "ﾜﾞ",
    ヺ: "ｦﾞ",
    ア: "ｱ",
    イ: "ｲ",
    ウ: "ｳ",
    エ: "ｴ",
    オ: "ｵ",
    カ: "ｶ",
    キ: "ｷ",
    ク: "ｸ",
    ケ: "ｹ",
    コ: "ｺ",
    サ: "ｻ",
    シ: "ｼ",
    ス: "ｽ",
    セ: "ｾ",
    ソ: "ｿ",
    タ: "ﾀ",
    チ: "ﾁ",
    ツ: "ﾂ",
    テ: "ﾃ",
    ト: "ﾄ",
    ナ: "ﾅ",
    ニ: "ﾆ",
    ヌ: "ﾇ",
    ネ: "ﾈ",
    ノ: "ﾉ",
    ハ: "ﾊ",
    ヒ: "ﾋ",
    フ: "ﾌ",
    ヘ: "ﾍ",
    ホ: "ﾎ",
    マ: "ﾏ",
    ミ: "ﾐ",
    ム: "ﾑ",
    メ: "ﾒ",
    モ: "ﾓ",
    ヤ: "ﾔ",
    ユ: "ﾕ",
    ヨ: "ﾖ",
    ラ: "ﾗ",
    リ: "ﾘ",
    ル: "ﾙ",
    レ: "ﾚ",
    ロ: "ﾛ",
    ワ: "ﾜ",
    ヲ: "ｦ",
    ン: "ﾝ",
    ァ: "ｧ",
    ィ: "ｨ",
    ゥ: "ｩ",
    ェ: "ｪ",
    ォ: "ｫ",
    ッ: "ｯ",
    ャ: "ｬ",
    ュ: "ｭ",
    ョ: "ｮ",
    "。": "｡",
    "、": "､",
    ー: "ｰ",
    "「": "｢",
    "」": "｣",
    "・": "･",
    "　": " ",
  };
  let fullWidthKanaRegex = new RegExp(
    "[" + Object.keys(kanaMap).join() + "]",
    "g"
  );

  if (str === null) {
    return "";
  }
  return str
    .replace(/[！-～]/g, (char) => {
      // 全角英数字・記号を半角に変換
      return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
    })
    .replace(/　/g, " ") // 全角スペースを半角スペースに変換
    .replace(fullWidthKanaRegex, (c) => kanaMap[c])
    .replace(/゛/g, "ﾞ")
    .replace(/゜/g, "ﾟ")
    .replace(/”/g, '"')
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/“/g, '"')
    .replace(/・/g, "･")
    .replace(/〜/g, "~")
    .replace(/[\u3099]/g, "") // 結合文字の濁点を削除
    .replace(/[\u309A]/g, ""); // 結合文字の半濁点を削除
}
