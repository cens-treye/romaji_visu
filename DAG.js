/*
漢字変換のための関数を提供する(基本的に Google 日本語入力のローマ字テーブルをもとに作成している)

- getDAG(target: string): Array<Array<[number, string]>>
  - 文字列の各文字に対して、その文字から始まるローマ字のリストと次の文字のインデックスを持つDAGを返す
  - DAG[i] = [[j, romaji], ...] は、i文字目時点でromajiを入力すると、j文字目に移動することを意味する
  - 未登録の文字はそのまま返す
- predictRomaji(kana: string, romaji: string): { hitKana: string, hitRomaji: string, remRomaji: string, delRomaji: string }
  - 文字列（かな）とローマ字を入れると、先頭からDAGをたどって、入力済みのかなと入力済みのローマ字、残りのローマ字、削除するローマ字を返す
  - ex. predictRomaji("かな", "kani") => {"か", "kan", "a", "i"}
*/

// かな文字のうち、n→ん、っか→kka 等一部を除いた対応表(Google 日本語入力のローマ字テーブルをもとに作成)
// 各かなについて優先度の高い順にローマ字を並べている
const kanaArray = [
  ["　", [" "]],
  ["〜", ["~", "z-"]],
  ["・", ["z/", "/"]],
  ["、", [","]],
  ["‥", ["z,"]],
  ["…", ["z."]],
  ["。", ["."]],
  ["「", ["["]],
  ["」", ["]"]],
  ["『", ["z["]],
  ["』", ["z]"]],
  ["←", ["zh"]],
  ["→", ["zl"]],
  ["↑", ["zk"]],
  ["↓", ["zj"]],
  ["ー", ["-"]],
  ["ぁ", ["xa", "la"]],
  ["あ", ["a"]],
  ["ぃ", ["xi", "li", "lyi", "xyi"]],
  ["い", ["i"]],
  ["ぅ", ["xu", "lu"]],
  ["う", ["u", "wu", "whu"]],
  ["ゔ", ["vu"]],
  ["ぇ", ["xe", "le", "lye", "xye"]],
  ["え", ["e"]],
  ["ぉ", ["xo", "lo"]],
  ["お", ["o"]],
  ["ヵ", ["xka", "lka"]],
  ["か", ["ka", "ca"]],
  ["が", ["ga"]],
  ["き", ["ki"]],
  ["ぎ", ["gi"]],
  ["く", ["ku", "cu", "qu"]],
  ["ぐ", ["gu"]],
  ["ヶ", ["xke", "lke"]],
  ["け", ["ke"]],
  ["げ", ["ge"]],
  ["こ", ["ko", "co"]],
  ["ご", ["go"]],
  ["さ", ["sa"]],
  ["ざ", ["za"]],
  ["し", ["si", "shi", "ci"]],
  ["じ", ["zi", "ji"]],
  ["す", ["su"]],
  ["ず", ["zu"]],
  ["せ", ["se", "ce"]],
  ["ぜ", ["ze"]],
  ["そ", ["so"]],
  ["ぞ", ["zo"]],
  ["た", ["ta"]],
  ["だ", ["da"]],
  ["ち", ["chi", "ti"]],
  ["ぢ", ["di"]],
  ["っ", ["xtu", "ltu", "xtsu", "ltsu"]],
  ["つ", ["ts", "tsu"]],
  ["づ", ["du"]],
  ["て", ["te"]],
  ["で", ["de"]],
  ["と", ["to"]],
  ["ど", ["do"]],
  ["な", ["na"]],
  ["に", ["ni"]],
  ["ぬ", ["nu"]],
  ["ね", ["ne"]],
  ["の", ["no"]],
  ["は", ["ha"]],
  ["ば", ["ba"]],
  ["ぱ", ["pa"]],
  ["ひ", ["hi"]],
  ["び", ["bi"]],
  ["ぴ", ["pi"]],
  ["ふ", ["hu", "fu"]],
  ["ぶ", ["bu"]],
  ["ぷ", ["pu"]],
  ["へ", ["he"]],
  ["べ", ["be"]],
  ["ぺ", ["pe"]],
  ["ほ", ["ho"]],
  ["ぼ", ["bo"]],
  ["ぽ", ["po"]],
  ["ま", ["ma"]],
  ["み", ["mi"]],
  ["む", ["mu"]],
  ["め", ["me"]],
  ["も", ["mo"]],
  ["ゃ", ["xya", "lya"]],
  ["や", ["ya"]],
  ["ゅ", ["xyu", "lyu"]],
  ["ゆ", ["yu"]],
  ["ょ", ["xyo", "lyo"]],
  ["よ", ["yo"]],
  ["ら", ["ra"]],
  ["り", ["ri"]],
  ["る", ["ru"]],
  ["れ", ["re"]],
  ["ろ", ["ro"]],
  ["ゎ", ["xwa", "lwa"]],
  ["わ", ["wa"]],
  ["ゐ", ["wyi"]],
  ["ゑ", ["wye"]],
  ["を", ["wo"]],
  ["ん", ["nn", "xn", "n'"]],
  ["いぇ", ["ye"]],
  ["うぁ", ["wha"]],
  ["ゔぁ", ["va"]],
  ["うぃ", ["wi", "whi"]],
  ["ゔぃ", ["vyi", "vi"]],
  ["うぇ", ["we", "whe"]],
  ["ゔぇ", ["vye", "ve"]],
  ["うぉ", ["who"]],
  ["ゔぉ", ["vo"]],
  ["ゔゃ", ["vya"]],
  ["ゔゅ", ["vyu"]],
  ["ゔょ", ["vyo"]],
  ["きぃ", ["kyi"]],
  ["ぎぃ", ["gyi"]],
  ["きぇ", ["kye"]],
  ["ぎぇ", ["gye"]],
  ["きゃ", ["kya"]],
  ["ぎゃ", ["gya"]],
  ["きゅ", ["kyu"]],
  ["ぎゅ", ["gyu"]],
  ["きょ", ["kyo"]],
  ["ぎょ", ["gyo"]],
  ["くぁ", ["qa", "kwa"]],
  ["ぐぁ", ["gwa"]],
  ["くぃ", ["qi", "kwi"]],
  ["ぐぃ", ["gwi"]],
  ["くぅ", ["kwu"]],
  ["ぐぅ", ["gwu"]],
  ["くぇ", ["qe", "kwe"]],
  ["ぐぇ", ["gwe"]],
  ["くぉ", ["qo", "kwo"]],
  ["ぐぉ", ["gwo"]],
  ["しぃ", ["syi"]],
  ["じぃ", ["zyi", "jyi"]],
  ["しぇ", ["sye", "she"]],
  ["じぇ", ["zye", "jye", "je"]],
  ["しゃ", ["sya", "sha"]],
  ["じゃ", ["zya", "jya", "ja"]],
  ["しゅ", ["syu", "shu"]],
  ["じゅ", ["zyu", "jyu", "ju"]],
  ["しょ", ["syo", "sho"]],
  ["じょ", ["zyo", "jyo", "jo"]],
  ["すぁ", ["swa"]],
  ["ずぁ", ["zwa"]],
  ["すぃ", ["swi"]],
  ["ずぃ", ["zwi"]],
  ["すぅ", ["swu"]],
  ["ずぅ", ["zwu"]],
  ["すぇ", ["swe"]],
  ["ずぇ", ["zwe"]],
  ["すぉ", ["swo"]],
  ["ずぉ", ["zwo"]],
  ["ちぃ", ["tyi", "cyi"]],
  ["ぢぃ", ["dyi"]],
  ["ちぇ", ["tye", "che", "cye"]],
  ["ぢぇ", ["dye"]],
  ["ちゃ", ["tya", "cha", "cya"]],
  ["ぢゃ", ["dya"]],
  ["ちゅ", ["tyu", "chu", "cyu"]],
  ["ぢゅ", ["dyu"]],
  ["ちょ", ["tyo", "cho", "cyo"]],
  ["ぢょ", ["dyo"]],
  ["つぁ", ["tsa"]],
  ["つぃ", ["tsi"]],
  ["つぇ", ["tse"]],
  ["つぉ", ["tso"]],
  ["てぃ", ["thi", "t'i"]],
  ["でぃ", ["dhi", "d'i"]],
  ["てぇ", ["the"]],
  ["でぇ", ["dhe"]],
  ["てゃ", ["tha"]],
  ["でゃ", ["dha"]],
  ["てゅ", ["thu", "t'yu"]],
  ["でゅ", ["dhu", "d'yu"]],
  ["てょ", ["tho"]],
  ["でょ", ["dho"]],
  ["とぁ", ["twa"]],
  ["どぁ", ["dwa"]],
  ["とぃ", ["twi"]],
  ["どぃ", ["dwi"]],
  ["とぅ", ["twu", "t'u"]],
  ["どぅ", ["dwu", "d'u"]],
  ["とぇ", ["twe"]],
  ["どぇ", ["dwe"]],
  ["とぉ", ["two"]],
  ["どぉ", ["dwo"]],
  ["にぃ", ["nyi"]],
  ["にぇ", ["nye"]],
  ["にゃ", ["nya"]],
  ["にゅ", ["nyu"]],
  ["にょ", ["nyo"]],
  ["ひぃ", ["hyi"]],
  ["びぃ", ["byi"]],
  ["ぴぃ", ["pyi"]],
  ["ひぇ", ["hye"]],
  ["びぇ", ["bye"]],
  ["ぴぇ", ["pye"]],
  ["ひゃ", ["hya"]],
  ["びゃ", ["bya"]],
  ["ぴゃ", ["pya"]],
  ["ひゅ", ["hyu"]],
  ["びゅ", ["byu"]],
  ["ぴゅ", ["pyu"]],
  ["ひょ", ["hyo"]],
  ["びょ", ["byo"]],
  ["ぴょ", ["pyo"]],
  ["ふぁ", ["fa", "hwa"]],
  ["ふぃ", ["fi", "hwi"]],
  ["ふぇ", ["fe", "hwe"]],
  ["ふぉ", ["fo", "hwo"]],
  ["ふゃ", ["fya"]],
  ["ふゅ", ["fyu", "hwyu"]],
  ["ふょ", ["fyo"]],
  ["みぃ", ["myi"]],
  ["みぇ", ["mye"]],
  ["みゃ", ["mya"]],
  ["みゅ", ["myu"]],
  ["みょ", ["myo"]],
  ["りぃ", ["ryi"]],
  ["りぇ", ["rye"]],
  ["りゃ", ["rya"]],
  ["りゅ", ["ryu"]],
  ["りょ", ["ryo"]],
];
// ローマ字を反転しておく
const kanaDict = new Map(kanaArray.map(([kana, romaji]) => [kana, romaji.reverse()]));

// 文字列に含まれるカタカナをひらがなに変換
function katakanaToHiragana(text) {
  return text.replace(/[ァ-ヶ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60));
}

// 文字列に含まれる全角数字、アルファベットを半角に変換
function normalizeText(text) {
  return text.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xfee0));
}

// 文字列に含まれる特定の記号を半角に変換
function normalizeSymbol(text) {
  return text.replace(/[！＃＄％＆（）＊＋，－．／：；＜＝＞？＠［］＾＿｛｜｝～]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xfee0));
}

// 繰り返すと「っ」になる文字の集合
const xtuSet = new Set("qvlxkgszjtdhfbpmyrwc");

// 文字列の各文字に対して、その文字から始まるローマ字のリストと次の文字のインデックスを持つDAGを返す
// DAG[i] = [[j, romaji], ...] は、i文字目時点でromajiを入力すると、j文字目に移動することを意味する
function getDAG(target) {
  const length = target.length;
  const DAG = Array.from({ length: length + 1 }, () => []);

  target = katakanaToHiragana(target);
  target = normalizeText(target);
  target = target.toLowerCase();

  // 1文字のかなをローマ字に変換
  for (let i = 0; i < length; i++) {
    const kana1 = target[i];
    if (kanaDict.has(kana1)) {
      for (const romaji of kanaDict.get(kana1)) {
        DAG[i].push([i + 1, romaji]);
      }
    }
  }

  // 2文字のかなをローマ字に変換
  for (let i = 0; i < length - 1; i++) {
    const kana2 = target.slice(i, i + 2);
    if (kanaDict.has(kana2)) {
      for (const romaji of kanaDict.get(kana2)) {
        DAG[i].push([i + 2, romaji]);
      }
    }
  }

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
  target = katakanaToHiragana(target);
  target = normalizeText(target);
  target = target.toLowerCase();

  romaji = romaji.toLowerCase();
  const DAG = getDAG(target);
  const length = DAG.length;

  // 各DAG[i]を反転する
  for (let i = 0; i < length; i++) {
    DAG[i] = DAG[i].reverse();
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

export { predictRomaji };
