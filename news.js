import axios from "axios";
import { getCache } from "./cache.js";
import OpenAI from "openai";

export async function getNews(apiKey, chatGptApiKey) {
  const url = `https://newsapi.org/v2/top-headlines?country=jp&category=general&apiKey=${apiKey}`;
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
    }, 0, 0, 0, 1, 0);
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

    // ニュースの要約を作成
    const summary = await getCache("chatgpt-news", async () => {
      try {
        return summarize(chatGptApiKey, data.articles);
      } catch (e) {
        console.error(new Date().toLocaleString("ja-JP"), e);
        return undefined;
      }
    }, 0, 0, 0, 1, 0);

    return {
      articles: articles,
      summary: summary === undefined ? undefined : toHalfWidth(summary)
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

// ChatGTP によるニュースの要約
async function summarize(apiKey, articles) {
  const openai = new OpenAI({ apiKey: apiKey });
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "あなたは著名なニュースキャスターです。" +
          "次の複数の記事を総括的に要約し、何があったかの文章を150文字程度で作成してください。" +
          "天気や交通情報、社会的に重要なニュースを優先しなければなりません。スポーツや芸能の優先度は低くしてください。" +
          "前口上やあなたの意見は不要です。"
      },
      {
        role: "user",
        content: articles.filter(a => a.description !== null).map(a => a.description.replace("\n", " ")).join("\n")
      }
    ],
    model: "gpt-4o"
  });
  return completion.choices[0].message.content.trim();
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
