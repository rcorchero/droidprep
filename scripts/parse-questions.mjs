#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MD_PATH = path.join(process.env.HOME, 'Downloads', 'Android_Interview_QA_Database.md');
const OUTPUT_PATH = path.join(ROOT, 'data', 'questions.json');

const CATEGORY_MAP = {
  '1. Kotlin Fundamentals': 'kotlin',
  '2. Jetpack Compose': 'compose',
  '3. Coroutines & Flow': 'coroutines',
  '4. Architecture': 'architecture',
  '5. Android Platform': 'platform',
  '6. Testing & Debugging': 'testing',
  '7. System Design': 'systemdesign',
  '8. Data Structures & Algorithms': 'algorithms',
};

const CATEGORY_LABELS = {
  kotlin: 'Kotlin Fundamentals',
  compose: 'Jetpack Compose',
  coroutines: 'Coroutines & Flow',
  architecture: 'Architecture',
  platform: 'Android Platform',
  testing: 'Testing & Debugging',
  systemdesign: 'System Design',
  algorithms: 'Data Structures & Algorithms',
};

const CATEGORY_KEYWORDS = {
  compose: ['compose', 'composable', 'recomposition', 'remember', 'mutablestateof', 'state hoisting', 'material3', 'modifier', 'composeview'],
  coroutines: ['coroutine', 'flow', 'stateflow', 'sharedflow', 'suspend', 'launch', 'async', 'dispatcher', 'supervisorscope', 'coroutinescope'],
  architecture: ['architecture', 'mvvm', 'mvi', 'clean', 'dependency injection', 'hilt', 'dagger', 'repository pattern', 'modular', 'multi-module'],
  platform: ['activity', 'fragment', 'lifecycle', 'workmanager', 'service', 'broadcast', 'content provider', 'permission', 'notification', 'intent', 'play store', 'release', 'staged rollout', 'analytics', 'ab testing', 'feature flag', 'offline', 'network', 'accessibility', 'i18n', 'internationalization', 'r8', 'proguard', 'build time', 'version catalog', 'gradle', 'custom view', 'surfaceview', 'textureview'],
  testing: ['test', 'junit', 'mockk', 'espresso', 'compose test', 'debug', 'profiling', 'benchmark'],
  systemdesign: ['system design', 'architecture at scale', 'trade-off', 'ci/cd', 'pipeline'],
  kotlin: ['kotlin', 'multiplatform', 'kmp', 'expect', 'actual', 'compose compiler', 'strong skipping'],
  algorithms: ['algorithm', 'data structure', 'complexity', 'big o', 'hash', 'tree', 'graph', 'sort'],
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  let bestCategory = 'platform';
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  return bestCategory;
}

function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const questions = [];
  let currentCategory = null;
  let inAdditional = false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Detect numbered category headers
    const catMatch = line.match(/^## (\d+)\. (.+)/);
    if (catMatch) {
      const key = `${catMatch[1]}. ${catMatch[2]}`;
      currentCategory = CATEGORY_MAP[key] || null;
      inAdditional = false;
      i++;
      continue;
    }

    // Detect Additional section
    if (/^## Additional Senior\/Staff/.test(line)) {
      inAdditional = true;
      currentCategory = null;
      i++;
      continue;
    }

    // Skip section 9
    if (/^## 9\. Behavioral/.test(line)) {
      currentCategory = null;
      i++;
      continue;
    }

    // Detect question
    if (line.startsWith('### Q:')) {
      const questionText = line.replace(/^### Q:\s*/, '').trim();
      const category = inAdditional ? null : currentCategory;

      // Parse the question block
      const q = {
        rawCategory: category,
        inAdditional,
        question: questionText,
        answer: '',
        whyItMatters: '',
        codeExample: '',
        furtherReading: [],
      };

      i++;

      // Parse answer
      while (i < lines.length) {
        const l = lines[i];
        if (l.startsWith('### Q:') || l.startsWith('## ') || l.startsWith('**Further Reading:**')) break;

        if (l.startsWith('**A:**')) {
          const answerParts = [l.replace(/^\*\*A:\*\*\s*/, '')];
          i++;
          while (i < lines.length) {
            const al = lines[i];
            if (al.startsWith('**Why it matters:**') || al.startsWith('**Use case:**') || al.startsWith('**Key insight:**') || al.startsWith('**Key takeaway:**') || al.startsWith('```') || al.startsWith('**Further Reading:**') || al.startsWith('### Q:') || al.startsWith('## ')) break;
            if (al.trim() === '' && i + 1 < lines.length && (lines[i + 1].startsWith('**') || lines[i + 1].startsWith('```') || lines[i + 1].startsWith('---'))) break;
            if (al.trim() === '') { i++; break; }
            answerParts.push(al);
            i++;
          }
          q.answer = answerParts.join('\n').trim();
          continue;
        }

        // Parse "Why it matters" variants
        const whyMatch = l.match(/^\*\*(?:Why it matters|Use case|Key insight|Key takeaway):\*\*\s*/);
        if (whyMatch) {
          const whyParts = [l.replace(/^\*\*(?:Why it matters|Use case|Key insight|Key takeaway):\*\*\s*/, '')];
          i++;
          while (i < lines.length) {
            const wl = lines[i];
            if (wl.startsWith('```') || wl.startsWith('---') || wl.startsWith('**Further Reading:**') || wl.startsWith('### Q:') || wl.startsWith('## ')) break;
            if (wl.trim() === '') break;
            whyParts.push(wl);
            i++;
          }
          q.whyItMatters = whyParts.join(' ').trim();
          continue;
        }

        // Parse code blocks
        if (l.startsWith('```')) {
          const codeLines = [];
          i++;
          while (i < lines.length && !lines[i].startsWith('```')) {
            codeLines.push(lines[i]);
            i++;
          }
          if (!q.codeExample) {
            q.codeExample = codeLines.join('\n');
          }
          i++; // skip closing ```
          continue;
        }

        // Parse Further Reading
        if (l.startsWith('**Further Reading:**')) {
          i++;
          while (i < lines.length && lines[i].startsWith('- [')) {
            const linkMatch = lines[i].match(/- \[(.+?)\]\((.+?)\)/);
            if (linkMatch) {
              q.furtherReading.push({ text: linkMatch[1], url: linkMatch[2] });
            }
            i++;
          }
          continue;
        }

        i++;
      }

      questions.push(q);
      continue;
    }

    i++;
  }

  return questions;
}

function buildOutput(rawQuestions) {
  const byCategory = {};

  for (const q of rawQuestions) {
    let category = q.rawCategory;
    if (q.inAdditional || !category) {
      category = detectCategory(q.question + ' ' + q.answer + ' ' + q.whyItMatters);
    }
    if (!category) continue;
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(q);
  }

  const result = [];
  const counts = {};

  for (const [cat, qs] of Object.entries(byCategory).sort()) {
    counts[cat] = qs.length;
    qs.forEach((q, idx) => {
      result.push({
        id: `${cat}-${String(idx + 1).padStart(2, '0')}`,
        category: cat,
        categoryLabel: CATEGORY_LABELS[cat],
        question: q.question,
        answer: q.answer,
        whyItMatters: q.whyItMatters,
        codeExample: q.codeExample,
        furtherReading: q.furtherReading,
      });
    });
  }

  return { questions: result, counts };
}

// Main
console.log('Reading markdown file...');
const raw = parseFile(MD_PATH);
console.log(`Parsed ${raw.length} raw questions`);

const { questions, counts } = buildOutput(raw);

console.log('\nQuestions per category:');
for (const [cat, n] of Object.entries(counts)) {
  console.log(`  ${cat}: ${n}`);
}
console.log(`  TOTAL: ${questions.length}`);

const output = {
  version: '1.0',
  generatedAt: new Date().toISOString(),
  totalQuestions: questions.length,
  questions,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
console.log(`\nWrote ${OUTPUT_PATH}`);
