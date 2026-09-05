# DroidPrep

Free, open-source interview prep for Android engineers. A searchable Q&A database and multiple-choice quiz engine — built as a fast static site, no backend.

## Features

- **156 curated questions** across 8 Android topics — Kotlin, Jetpack Compose, Coroutines & Flow, Architecture, Android Platform, Testing, System Design, and Data Structures & Algorithms.
- **Instant full-text search** with filters by category and difficulty.
- **Multiple choice quizzes** with pre-authored answers targeting real misconceptions and clear explanations.
- **Dark-mode-first** design with light mode and bookmarks saved locally.

## Getting Started

```sh
npm install
npm run dev        # start dev server at http://localhost:4321
npm run build      # production build to ./dist/
npm run preview    # preview the production build
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build |
| `npm run validate` | Validate data schemas (questions, MCQ, difficulty, categories) |
| `npm test` | Run schema tests in `./tests/` |
| `npm run lint` | Astro type check |
| `npm run parse` | Regenerate `questions.json` from the source markdown database |

## Project Structure

```
droidprep/
├── data/            # JSON data: questions, MCQ, difficulty, categories
├── src/
│   ├── pages/       # Landing, Browse, Quiz, About
│   ├── components/  # Header, QuestionCard, CategoryCard, etc.
│   ├── layouts/     # BaseLayout
│   └── styles/      # global.css design tokens
├── scripts/         # Parsing & validation
├── tests/           # Schema test suites (questions, MCQ, difficulty)
├── public/          # Static assets
└── .github/workflows/  # CI + GitHub Pages deploy
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add questions, improve MCQs, or fix bugs.

## Tech Stack

Astro (static site), vanilla JavaScript (Web Components / Custom Elements), CSS custom properties. No backend, no framework bundle — everything runs in the browser.

## License

Open source. See the repository for license details.
