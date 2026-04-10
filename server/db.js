import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const dataDir = path.resolve(process.cwd(), 'server/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'compile99.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  version TEXT NOT NULL DEFAULT '18.15.0',
  starter_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_visible INTEGER NOT NULL CHECK (is_visible IN (0,1)),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  submitted_code TEXT NOT NULL,
  status TEXT NOT NULL,
  visible_passed INTEGER NOT NULL,
  visible_total INTEGER NOT NULL,
  hidden_passed INTEGER NOT NULL,
  hidden_total INTEGER NOT NULL,
  syntax_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submission_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  test_case_id INTEGER NOT NULL,
  passed INTEGER NOT NULL CHECK (passed IN (0,1)),
  actual_output TEXT NOT NULL,
  is_visible INTEGER NOT NULL CHECK (is_visible IN (0,1)),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
);
`);

const questionCount = db.prepare('SELECT COUNT(*) AS count FROM questions').get().count;

if (questionCount === 0) {
  const insertQuestion = db.prepare(`
    INSERT INTO questions (title, description, language, version, starter_code)
    VALUES (@title, @description, @language, @version, @starterCode)
  `);

  const insertCase = db.prepare(`
    INSERT INTO test_cases (question_id, input, expected_output, is_visible)
    VALUES (@questionId, @input, @expectedOutput, @isVisible)
  `);

  const txn = db.transaction(() => {
    const result = insertQuestion.run({
      title: 'Sum of Two Integers',
      description: `## Problem\nWrite a program that reads two integers and prints their sum.\n\n## Input Format\n- A single line containing two space-separated integers.\n\n## Output Format\n- Print one integer: the sum of the two values.`,
      language: 'javascript',
      version: '18.15.0',
      starterCode: `const fs = require('fs');\n\nconst input = fs.readFileSync(0, 'utf8').trim();\nif (!input) {\n  process.exit(0);\n}\n\nconst [a, b] = input.split(/\\s+/).map(Number);\nconsole.log(a + b);\n`,
    });

    const questionId = Number(result.lastInsertRowid);

    const cases = [
      { input: '1 2', expectedOutput: '3', isVisible: 1 },
      { input: '100 200', expectedOutput: '300', isVisible: 1 },
      { input: '-5 10', expectedOutput: '5', isVisible: 1 },
      { input: '999 1', expectedOutput: '1000', isVisible: 0 },
      { input: '-42 -58', expectedOutput: '-100', isVisible: 0 },
    ];

    for (const item of cases) {
      insertCase.run({
        questionId,
        input: item.input,
        expectedOutput: item.expectedOutput,
        isVisible: item.isVisible,
      });
    }
  });

  txn();
}

export default db;
