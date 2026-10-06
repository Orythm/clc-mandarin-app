# Recordings

Word recordings from the Ministry of Education's Concise Mandarin Dictionary:

中華民國教育部（Ministry of Education, R.O.C.）。《國語辭典簡編本》（版本編號：2014_20260929）網址：https://dict.concised.moe.edu.tw/

Licensed under CC BY-ND 3.0 TW (https://creativecommons.org/licenses/by-nd/3.0/tw/legalcode). MOE's usage notice (使用說明), which must stay with the files, is `moe-usage-notice.pdf`.

- `<id>.mp3`: one recording each, named by its dictionary entry number (字詞號). They are MOE's WAV files converted to MP3 (mono, 22.05 kHz, 40 kbps) and otherwise unmodified: nothing is cut, joined or re-levelled.
- Five of them (2780 很, 4049 新, 4659 茶, 4668 車, 6287 我) are missing from the current MOE download and come from an earlier MOE release as served by 萌典 (https://www.moedict.tw/).
- `index.json` maps a word (characters, as in `lessons.json`) to `{ "f": file, "s": start, "e": end }` in seconds. The recordings keep going after the word (single characters: example words; longer words: the word again, then the definition), so the app seeks to `s` and stops at `e`. Longer words use the second of the two readings. Single-character files start with a stray copy of the WAV header that plays as a click, hence `s` = 0.008.
- A word the dictionary lacks can be joined from its characters' recordings: `"好喝": { "join": ["好", "喝"], "gap": -0.04 }` plays each part's span in turn, starting the next part 40 ms before the previous one ends (negative gap = overlap). Only for words with no neutral tone, no third-tone pair (你好 is said ní hǎo) and no 一/不 tone change, since each character is recorded in its citation tone. The files themselves are still untouched.
- 妳 uses 你's recording (same pronunciation). 個 uses gè (the dictionary has no neutral-tone ge).

Words not in `index.json` use the browser's speech voice.
