# Contributing to DroidPrep

Thanks for your interest in contributing! DroidPrep is a free, open-source resource for Android engineers preparing for technical interviews. Everything is built by the community.

## Ways to Contribute

1. **Add new questions** — with matching MCQ options and difficulty tags
2. **Improve existing MCQ distractors** — wrong answers that are implausible don't help
3. **Fix typos or incorrect answers** — accuracy matters
4. **Add difficulty tags** for new or untagged questions
5. **Fix bugs or improve the UI** — styling, accessibility, performance

## Project Structure

```
droidprep/
├── data/
│   ├── questions.json    ← All Q&A entries (source of truth for Browse)
│   ├── mcq.json          ← Pre-authored multiple choice questions
│   ├── difficulty.json   ← Question ID → difficulty level
│   └── categories.json   ← Category metadata
├── src/
│   ├── pages/            ← Astro pages
│   ├── components/       ← Astro + vanilla JS components
│   ├── layouts/          ← BaseLayout
│   └── styles/           ← global.css (design tokens)
└── scripts/              ← Parsing & validation scripts
```

## Adding a New Question

1. **Fork** the repo and create a feature branch.
2. Add an entry to `data/questions.json`:
   - `id`: e.g. `kotlin-27` (unique, sequential per category)
   - `category`: one of the 8 category IDs
   - `question` / `answer`: the Q&A text
   - `whyItMatters` (optional): why interviewers ask this
   - `codeExample` (optional): Kotlin code block
   - `furtherReading` (optional): list of reference links
3. Add a matching MCQ entry to `data/mcq.json`:
   - Same `id` and `category`
   - `question`: the question text
   - `options`: exactly **4** options
   - `correctIndex`: index (0–3) of the correct option
   - `explanation`: why the answer is correct (and why distractors are wrong)
4. Add a difficulty tag to `data/difficulty.json`:
   - One of `basic`, `intermediate`, `senior`
5. Submit a **pull request** to `main`.

## MCQ Quality Guidelines

- **Wrong options should target real misconceptions** — not obvious nonsense
- Each distractor should be **plausible** to someone who hasn't mastered the topic
- Explanations should clarify **why the correct answer is correct** and **why each distractor is wrong**
- Keep option text **concise** (1–2 sentences max)

## Data Validation

PRs that fail CI validation will not be merged. Run locally before pushing:

```bash
npm run validate   # checks schema, IDs, correctIndex, difficulty levels
npm run lint       # Astro type check
npm run build      # full production build
```

The parser (`npm run parse`) regenerates `questions.json` from the original markdown database and should only be run when the source `.md` changes. Never edit `questions.json` by hand if you can instead update the source.

## Questions

Open an issue if you have questions, or if a question/answer in the database is incorrect.
