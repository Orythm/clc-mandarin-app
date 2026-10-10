# CLC Vocab Quiz: working notes for Claude

A static PWA (no build step) deployed on Vercel from `master` of github.com/Orythm/clc-mandarin-app. Every push to `master` redeploys within about a minute.

## Before changing anything

Run `git pull origin master` first. Several sessions (on the user's PC and in the cloud) push to this repo, so the local copy may be behind. If the pull conflicts or there are uncommitted changes you didn't make, stop and ask the user.

## Where the vocabulary lives

All lessons are in **`lessons.json`**. Adding or fixing vocab only ever touches this file. Do not edit the word data in `index.html` (it has none any more) or `clc-vocab-quiz.html` (an old backup; leave it alone).

```json
[
  {
    "n": 4,
    "zh": "第四課",
    "words": [
      ["週末","zhōu mò","weekend"],
      ["打","dǎ","to play (ball games)"]
    ]
  }
]
```

- `n`: lesson number (integer). Lessons are kept sorted by `n`, no duplicates.
- `zh`: lesson title as 第N課, with N in Chinese numerals (第四課, 第十課, 第十一課).
- `words`: list of `[characters, pinyin, english]`, in the order they appear in the textbook.

## Word format rules

- **Characters:** Traditional Chinese (週, 說, 學), never Simplified. Match the textbook exactly, including 妳 vs 你.
- **Pinyin:** tone marks, not numbers (`xiǎo jiě`, not `xiao3 jie3`). Lowercase. One space between syllables. Neutral tone has no mark (`ma`, `de`). Write tone sandhi as the textbook prints it (e.g. 一起 `yì qǐ`, 不是 `bú shì`).
- **English:** short gloss, a few words. For multiple senses separate with commas (`to feel, to think`). Use brackets for grammar hints (`question particle`, `particle (suggestion)`, `to play (ball games)`).
- The quiz shows one word per row, so phrases from the textbook stay as one entry (e.g. 好不好, 怎麼樣).

## Adding a lesson from a photo

When the user sends a photo of a vocabulary list:

1. Read every word from the photo: characters, pinyin and English. If the page shows no pinyin or English, fill them in using the rules above and say which ones you supplied.
2. Work out the lesson number from the page or the user's message. If it's unclear, ask.
3. Check against `lessons.json`: whether that lesson already exists (then you're adding to it or replacing it, so ask which), and flag words that already appear in other lessons (keep them; the user just likes to know).
4. **Show the user the full list as a table and wait for their OK before committing.** Point out anything you were unsure about (blurry characters, ambiguous tones).
5. Edit `lessons.json`, keeping its formatting: one word per line, lessons sorted by `n`. Check it's valid JSON afterwards (`node -e "JSON.parse(require('fs').readFileSync('lessons.json','utf8'))"`, or `python -m json.tool lessons.json`).
6. Commit with a message like `Add lesson 4 (第四課, 38 words)` and push to `master`.
7. Tell the user it'll be live in about a minute; the installed app picks up new lessons the next time it opens online.

Fixing a typo works the same way: edit the word in `lessons.json`, confirm with the user, commit, push.

## Measure words

The 量詞 exercise (`/measure`) reads **`measure-words.json`**: a list of `{"mw": "本", "py": "běn", "en": "books", "nouns": [["書","shū","book"]]}`. Same word format rules as above. milo chooses which measure words go in (first set approved 2026-10-10: 個 張 杯 瓶 本 支 塊); prefer nouns from the lessons and show milo the table before pushing. A noun may be listed under two measure words (可樂 under 杯 and 瓶): it's asked once and either answer counts. The home card stays hidden while the file is empty.

## Grammar

The 語法 page (`/grammar`) reads **`grammar.json`**: `tables` (small tables a question can show, by name) and `points`, one per grammar point: `id`, `zh`, `en`, a `card` (`patterns`, `examples` as `[characters, pinyin, english]`, `tip`; in patterns and example characters, colour the sentence parts as `{s:我們}{tw:今天晚上}{v:要去看電影}` with s subject, v verb, tw time word, o thing/topic, k the grammar word) that can be opened during any question, and `items`:

- `{"type": "pick", "ctx": "A：…", "table": "week", "q": "B：他＿是日本人。", "opts": ["也", "都", "常"], "en": "…"}`: the first option is the right one (they're shuffled on screen); `＿` marks the gap, filled with the right option or with `fill` when the option is a label (e.g. `"fill": "（的）"` for "Yes, 的 is optional"); `ctx`, `table` and `fill` are optional.
- `{"type": "order", "ask": "Rewrite it, starting with the topic 臺灣菜.", "src": "我不常吃臺灣菜。", "tiles": ["臺灣菜", "，", "我", "不", "常", "吃", "。"], "alts": [[…]], "en": "…"}`: tiles in the right order; punctuation is its own tile, so every alt is a re-ordering of the same tiles. `src` is a sentence to rewrite or a question to answer, never an English translation: milo re-orders without hints.
- `ask` (any item) is a plain instruction line saying what to do; without it, order items say "Put the words in the right order." and gap items "Fill the gap." milo wants every question to make clear what it asks. Since there's no hint, `alts` must list every other correct order (swapped A/B around 還是 or 和, time word before the subject).
- `en` is never shown in exercises (milo's call, 2026-10-10); it's kept for a planned English → Chinese writing exercise. The cards do show English. There is no timer anywhere in the app.

Sentences use only words from the lessons and the extra vocab, same format rules as above. The source handouts are milo's class photos (`/mnt/project-files/images.zip`); the per-lesson plan is `/mnt/project-files/clc-mandarin-app/grammar-plan.md`. Points aren't split by lesson (milo's call): the page is one flat list in file order, and Practice mixes 10 questions from all of them. The home card stays hidden while `points` is empty.

## Question words

The 疑問詞 page (`/questions`) reads **`questions.json`**, same format as `grammar.json` and the same page and question engine (嗎, 什麼/做什麼, 哪, 誰, 幾/多少, 呢, 好不好/怎麼樣, 為什麼). "Complete the question" items show the answer in `ask` and the question with a gap.

## Pinyin on exercises

Grammar and question-word exercises have a 拼音 button: holding it shows pinyin under every Chinese line, option, tile and table cell. Pinyin is worked out in the app from `lessons.json` plus **`pinyin.json`** (`{"word": "pinyin"}` for words not in any lesson: handout vocab, names, numbers), longest match first, with 不/一 tone changes applied automatically. When you add a sentence with a character that's in neither file, add it to `pinyin.json` (it shows as `?` otherwise).

## Several right answers

Exercises have no English hints, so every question must accept all correct answers: re-ordering items list every other correct order in `alts` (A and B swapped, time word before the subject, 為什麼 before the subject…), and pick items must have exactly one correct option in context. Check this whenever you add questions.

## Other files

- `index.html`: the quiz app. It fetches `/lessons.json` at startup. Chinese text uses TW-Kai (全字庫正楷體, Taiwan's MOE standard Kai, the free equivalent of 標楷體 DFKai-SB), self-hosted in `fonts/` as ~100 small slices covering 16k common characters, with Noto Serif TC from Google Fonts as fallback. Latin text uses Source Serif 4. LXGW WenKai TC was dropped because some characters (e.g. 教) don't match Taiwan forms, so any new character is covered automatically; don't embed font subsets.
- `audio/`: MOE dictionary recordings (CC BY-ND 3.0 TW) for lesson words, see `audio/README.md`. `audio/index.json` maps characters to a file and the seconds to play (the recordings continue past the word). The licence forbids editing the recordings: convert format only, never trim, splice or re-level; keep `moe-usage-notice.pdf` and the credit in the page footer (shown on every page). A new lesson's words have no recording until they are added here; they use the browser's speech voice. The raw MOE downloads live outside git in `.moe-download/`.
- `sw.js`: service worker. Pages, `lessons.json` and `audio/index.json` are network-first; recordings are cached on first play in a separate cache that survives version bumps; other files are cache-first. Bump `VERSION` only when changing `index.html`, `sw.js`, the manifest or the icons; vocab changes don't need it.
- `vercel.json`: sends any path that isn't a real file to `index.html`. The app routes with the History API: `/` is the home menu of exercise types, `/vocab` is the vocab lesson list, `/vocab/lesson-<n>-py-zh` and `/vocab/lesson-<n>-zh-py` open a quiz, `/grammar` (and `/questions`) is a page with mixed Practice, one entry per exercise type (`/grammar/type/fill|answer|ask|order`, all topics mixed; the type is worked out from each item in `grKind`) and Browse the cards (`/grammar/cards`, each card can start a round on its point at `/grammar/cards/<id>`) (old `/lesson-...` links redirect there), so the phone's back gesture works. Run locally with `npx serve -s .` so lesson URLs resolve.
- `manifest.webmanifest`, `icons/`: PWA install metadata.
- `fonts/tw-kai.css`, `fonts/tw-kai/`: generated by `scripts/build_tw_kai.py` (instructions inside). Don't edit by hand. A new lesson's characters are almost certainly already covered; if one isn't, it falls back to Noto Serif TC, which is fine. Keep `fonts/tw-kai/LICENSE.txt`, which the font's license requires.
