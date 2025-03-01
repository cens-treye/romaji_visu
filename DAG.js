/*
漢字変換のための関数を提供する(基本的に Google 日本語入力のローマ字テーブルをもとに作成している)

- getDAG(target: string): Array<Array<[number, string]>>
  - 文字列の各文字に対して、その文字から始まるローマ字のリストと次の文字のインデックスを持つDAGを返す
  - DAG[i] = [[j, romaji], ...] は、i文字目時点でromajiを入力すると、j文字目に移動することを意味する
  - 未登録の文字はそのまま返す
- predictRomaji(kana: string, romaji: string): [string, string]
  - 文字列とローマ字を入れると、先頭からDAGをたどって正しいローマ字の切り出しと以降入力すべきローマ字を返す
  - ex. "ろーまじ", "roms" -> ["rom", "aji"]
*/

// かな文字のうち、n→ん、っか→kka 等一部を除いた対応表(Google 日本語入力のローマ字テーブルをもとに作成)
// 各かなについて優先度の高い順にローマ字を並べる
const kanaDict = {
  てゅ: ["thu", "t'yu"],
  でゅ: ["dhu", "d'yu"],
  ふゅ: ["fyu", "hwyu"],
  っ: ["xtu", "ltu", "xtsu", "ltsu"],
  ゔゃ: ["vya"],
  ゔぃ: ["vyi", "vi"],
  ゔゅ: ["vyu"],
  ゔぇ: ["vye", "ve"],
  ゔょ: ["vyo"],
  きゃ: ["kya"],
  きぃ: ["kyi"],
  きゅ: ["kyu"],
  きぇ: ["kye"],
  きょ: ["kyo"],
  ぎゃ: ["gya"],
  ぎぃ: ["gyi"],
  ぎゅ: ["gyu"],
  ぎぇ: ["gye"],
  ぎょ: ["gyo"],
  しゃ: ["sya", "sha"],
  しぃ: ["syi"],
  しゅ: ["syu", "shu"],
  しぇ: ["sye", "she"],
  しょ: ["syo", "sho"],
  し: ["shi", "si", "ci"],
  じゃ: ["zya", "jya", "ja"],
  じぃ: ["zyi", "jyi"],
  じゅ: ["zyu", "jyu", "ju"],
  じぇ: ["zye", "jye", "je"],
  じょ: ["zyo", "jyo", "jo"],
  ちゃ: ["tya", "cha", "cya"],
  ちぃ: ["tyi", "cyi"],
  ちゅ: ["tyu", "chu", "cyu"],
  ちぇ: ["tye", "che", "cye"],
  ちょ: ["tyo", "cho", "cyo"],
  ち: ["chi", "ti"],
  ぢゃ: ["dya"],
  ぢぃ: ["dyi"],
  ぢゅ: ["dyu"],
  ぢぇ: ["dye"],
  ぢょ: ["dyo"],
  つぁ: ["tsa"],
  つぃ: ["tsi"],
  つぇ: ["tse"],
  つぉ: ["tso"],
  てゃ: ["tha"],
  てぃ: ["thi", "t'i"],
  てぇ: ["the"],
  てょ: ["tho"],
  でゃ: ["dha"],
  でぃ: ["dhi", "d'i"],
  でぇ: ["dhe"],
  でょ: ["dho"],
  とぁ: ["twa"],
  とぃ: ["twi"],
  とぅ: ["twu", "t'u"],
  とぇ: ["twe"],
  とぉ: ["two"],
  どぁ: ["dwa"],
  どぃ: ["dwi"],
  どぅ: ["dwu", "d'u"],
  どぇ: ["dwe"],
  どぉ: ["dwo"],
  にゃ: ["nya"],
  にぃ: ["nyi"],
  にゅ: ["nyu"],
  にぇ: ["nye"],
  にょ: ["nyo"],
  ひゃ: ["hya"],
  ひぃ: ["hyi"],
  ひゅ: ["hyu"],
  ひぇ: ["hye"],
  ひょ: ["hyo"],
  びゃ: ["bya"],
  びぃ: ["byi"],
  びゅ: ["byu"],
  びぇ: ["bye"],
  びょ: ["byo"],
  ぴゃ: ["pya"],
  ぴぃ: ["pyi"],
  ぴゅ: ["pyu"],
  ぴぇ: ["pye"],
  ぴょ: ["pyo"],
  ふゃ: ["fya"],
  ふょ: ["fyo"],
  ふぁ: ["fa", "hwa"],
  ふぃ: ["fi", "hwi"],
  ふぇ: ["fe", "hwe"],
  ふぉ: ["fo", "hwo"],
  みゃ: ["mya"],
  みぃ: ["myi"],
  みゅ: ["myu"],
  みぇ: ["mye"],
  みょ: ["myo"],
  りゃ: ["rya"],
  りぃ: ["ryi"],
  りゅ: ["ryu"],
  りぇ: ["rye"],
  りょ: ["ryo"],
  ぃ: ["xi", "li", "lyi", "xyi"],
  ぇ: ["xe", "le", "lye", "xye"],
  ヵ: ["xka", "lka"],
  ヶ: ["xke", "lke"],
  くぁ: ["qa", "kwa"],
  くぃ: ["qi", "kwi"],
  くぅ: ["kwu"],
  くぇ: ["qe", "kwe"],
  くぉ: ["qo", "kwo"],
  ぐぁ: ["gwa"],
  ぐぃ: ["gwi"],
  ぐぅ: ["gwu"],
  ぐぇ: ["gwe"],
  ぐぉ: ["gwo"],
  すぁ: ["swa"],
  すぃ: ["swi"],
  すぅ: ["swu"],
  すぇ: ["swe"],
  すぉ: ["swo"],
  ずぁ: ["zwa"],
  ずぃ: ["zwi"],
  ずぅ: ["zwu"],
  ずぇ: ["zwe"],
  ずぉ: ["zwo"],
  つ: ["ts", "tsu"],
  ゃ: ["xya", "lya"],
  ゐ: ["wyi"],
  ゅ: ["xyu", "lyu"],
  ゑ: ["wye"],
  ょ: ["xyo", "lyo"],
  ゎ: ["xwa", "lwa"],
  うぁ: ["wha"],
  うぃ: ["wi", "whi"],
  う: ["u", "wu", "whu"],
  うぇ: ["we", "whe"],
  うぉ: ["who"],
  "・": ["z/", "/"],
  "…": ["z."],
  "‥": ["z,"],
  "←": ["zh"],
  "↓": ["zj"],
  "↑": ["zk"],
  "→": ["zl"],
  "〜": ["~", "z-"],
  "『": ["z["],
  "』": ["z]"],
  ゔぁ: ["va"],
  ゔ: ["vu"],
  ゔぉ: ["vo"],
  ふ: ["hu", "fu"],
  ん: ["nn", "xn", "n'"],
  ぁ: ["xa", "la"],
  ぅ: ["xu", "lu"],
  ぉ: ["xo", "lo"],
  いぇ: ["ye"],
  か: ["ka", "ca"],
  き: ["ki"],
  く: ["ku", "cu", "qu"],
  け: ["ke"],
  こ: ["ko", "co"],
  が: ["ga"],
  ぎ: ["gi"],
  ぐ: ["gu"],
  げ: ["ge"],
  ご: ["go"],
  さ: ["sa"],
  す: ["su"],
  せ: ["se", "ce"],
  そ: ["so"],
  ざ: ["za"],
  じ: ["zi", "ji"],
  ず: ["zu"],
  ぜ: ["ze"],
  ぞ: ["zo"],
  た: ["ta"],
  て: ["te"],
  と: ["to"],
  だ: ["da"],
  ぢ: ["di"],
  づ: ["du"],
  で: ["de"],
  ど: ["do"],
  な: ["na"],
  に: ["ni"],
  ぬ: ["nu"],
  ね: ["ne"],
  の: ["no"],
  は: ["ha"],
  ひ: ["hi"],
  へ: ["he"],
  ほ: ["ho"],
  ば: ["ba"],
  び: ["bi"],
  ぶ: ["bu"],
  べ: ["be"],
  ぼ: ["bo"],
  ぱ: ["pa"],
  ぴ: ["pi"],
  ぷ: ["pu"],
  ぺ: ["pe"],
  ぽ: ["po"],
  ま: ["ma"],
  み: ["mi"],
  む: ["mu"],
  め: ["me"],
  も: ["mo"],
  や: ["ya"],
  ゆ: ["yu"],
  よ: ["yo"],
  ら: ["ra"],
  り: ["ri"],
  る: ["ru"],
  れ: ["re"],
  ろ: ["ro"],
  わ: ["wa"],
  を: ["wo"],
  ー: ["-"],
  "。": ["."],
  "、": [","],
  "「": ["["],
  "」": ["]"],
  あ: ["a"],
  い: ["i"],
  え: ["e"],
  お: ["o"],
};

// 文字列に含まれるカタカナをひらがなに変換
function katakanaToHiragana(text) {
  return text.replace(/[ァ-ヶ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60));
}

// 文字列に含まれる全角数字、アルファベット、記号を半角に変換
function normalizeText(text) {
  return text.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xfee0));
}

// 繰り返すと「っ」になる文字の集合
const xtuSet = new Set("qvlxkgszjtdhfbpmyrwc");

// 文字列の各文字に対して、その文字から始まるローマ字のリストと次の文字のインデックスを持つDAGを返す
// DAG[i] = [[j, romaji], ...] は、i文字目時点でromajiを入力すると、j文字目に移動することを意味する
function getDAG(target) {
  const length = target.length;
  const DAG = Array.from({ length: length + 1 }, () => []);

  for (let i = 0; i < length; i++) {
    for (const kana in kanaDict) {
      if (target.startsWith(kana, i)) {
        for (const romaji of kanaDict[kana]) {
          DAG[i].push([i + kana.length, romaji]);
        }
      }
    }
  }

  target = katakanaToHiragana(target);
  target = normalizeText(target);
  target = target.toLowerCase();

  // っ の処理
  for (let i = length - 1; i >= 0; i--) {
    if (target[i] === "っ" && i < length - 1) {
      for (const [j, romaji] of DAG[i + 1]) {
        if (xtuSet.has(romaji[0])) {
          DAG[i].push([j, romaji[0] + romaji]);
        }
      }
    }
  }

  // ん の処理
  for (let i = 0; i < length; i++) {
    if (target[i] === "ん") {
      if (i === length - 1 || !"あいうえおなにぬねのゃぃゅぇょ".includes(target[i + 1])) {
        DAG[i].push([i + 1, "n"]);
      }
    }
  }

  // 未登録の文字をそのまま返す
  for (let i = 0; i < length; i++) {
    if (DAG[i].length === 0) {
      DAG[i].push([i + 1, target[i]]);
    }
  }

  return DAG;
}

// 2つの文字列の先頭から一致する長さを返す
function matchLength(str1, str2) {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  return i;
}

// 文字列（かな）とローマ字を入れると、先頭からDAGをたどって、入力済みのかなと入力済みのローマ字、残りのローマ字、削除されたローマ字を返す
function predictRomaji(target, romaji) {
  romaji = romaji.toLowerCase();
  var DAG = getDAG(target);
  const length = DAG.length;
  // 最小の入力で次の文字に進めるようにする(まず、idx が大きい順、次にローマ字の長さが短い順にソート)
  for (let i = 0; i < length; i++) {
    DAG[i].sort((a, b) => b[0] - a[0] || a[1].length - b[1].length);
  }

  let tarIdx = 0;
  let romIdx = 0;
  let remRomaji = [];
  let delRomaji = [];
  let path = [];
  let hitKana = "";
  let hitRomaji = "";

  while (tarIdx < DAG.length - 1 && romIdx < romaji.length) {
    let found = false;
    for (const [nextIdx, nextRomaji] of DAG[tarIdx]) {
      // かなのうち入力しきったものがあれば採用
      if (romIdx + nextRomaji.length <= romaji.length && romaji.slice(romIdx, romIdx + nextRomaji.length) === nextRomaji) {
        path.push(nextRomaji);
        tarIdx = nextIdx;
        romIdx += nextRomaji.length;
        found = true;
        break;
      }
    }
    if (!found) break;
  }

  hitKana = target.slice(0, tarIdx);

  // 途中まで入力された場合、最大一致するかなのうち先にあるものを採用
  if (tarIdx < DAG.length - 1) {
    let maxMatch = 0;
    let maxIdx = -1;
    for (var i = 0; i < DAG[tarIdx].length; i++) {
      const [nextIdx, nextRomaji] = DAG[tarIdx][i];
      const matchLen = matchLength(nextRomaji, romaji.slice(romIdx));
      if (matchLen > maxMatch) {
        maxMatch = matchLen;
        maxIdx = i;
      }
    }
    if (maxIdx !== -1) {
      const [nextIdx, nextRomaji] = DAG[tarIdx][maxIdx];
      path.push(nextRomaji.slice(0, maxMatch));
      remRomaji.push(nextRomaji.slice(maxMatch));
      romIdx += maxMatch;
      tarIdx = nextIdx;
    }
  }
  hitRomaji = path.join("");

  // 未入力のローマ字を追加
  while (tarIdx < DAG.length - 1) {
    if (DAG[tarIdx].length === 0) break;
    const [nextIdx, nextRomaji] = DAG[tarIdx][0];
    tarIdx = nextIdx;
    path.push(nextRomaji);
    remRomaji.push(nextRomaji);
  }

  // 不必要なローマ字を削除
  delRomaji.push(romaji.slice(romIdx));

  return {
    hitKana,
    hitRomaji,
    remRomaji: remRomaji.join(""),
    delRomaji: delRomaji.join(""),
  };
}
