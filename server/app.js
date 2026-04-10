import express from 'express';
import db from './db.js';
import { executeCode, normalizeOutput } from './piston.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(express.json({ limit: '2mb' }));

function serializeQuestion(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    language: row.language,
    version: row.version,
    starterCode: row.starter_code,
    createdAt: row.created_at,
  };
}

function serializeTestCase(row) {
  return {
    id: row.id,
    input: row.input,
    expectedOutput: row.expected_output,
    isVisible: Boolean(row.is_visible),
  };
}

function getQuestionWithCases(questionId) {
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
  if (!question) {
    return null;
  }

  const testCases = db
    .prepare('SELECT * FROM test_cases WHERE question_id = ? ORDER BY id ASC')
    .all(questionId)
    .map(serializeTestCase);

  return {
    ...serializeQuestion(question),
    testCases,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/questions', (_req, res) => {
  const questions = db.prepare('SELECT * FROM questions ORDER BY id DESC').all().map(serializeQuestion);
  res.json({ questions });
});

app.get('/api/questions/:id', (req, res) => {
  const questionId = Number(req.params.id);
  if (Number.isNaN(questionId)) {
    res.status(400).json({ message: 'Invalid question id' });
    return;
  }

  const question = getQuestionWithCases(questionId);
  if (!question) {
    res.status(404).json({ message: 'Question not found' });
    return;
  }

  res.json({
    question: {
      ...question,
      testCases: question.testCases.filter((item) => item.isVisible),
    },
  });
});

app.post('/api/questions', (req, res) => {
  const {
    title,
    description,
    language = 'javascript',
    version = '18.15.0',
    starterCode,
    visibleTestCases = [],
    hiddenTestCases = [],
  } = req.body ?? {};

  if (!title || !description || !starterCode) {
    res.status(400).json({ message: 'title, description and starterCode are required' });
    return;
  }

  if (!Array.isArray(visibleTestCases) || !Array.isArray(hiddenTestCases)) {
    res.status(400).json({ message: 'visibleTestCases and hiddenTestCases must be arrays' });
    return;
  }

  const allCases = [...visibleTestCases, ...hiddenTestCases];
  if (allCases.length === 0) {
    res.status(400).json({ message: 'At least one test case is required' });
    return;
  }

  const hasInvalidCase = allCases.some((item) => !item || item.input === undefined || item.expectedOutput === undefined);
  if (hasInvalidCase) {
    res.status(400).json({ message: 'Every test case must include input and expectedOutput' });
    return;
  }

  const insertQuestion = db.prepare(`
    INSERT INTO questions (title, description, language, version, starter_code)
    VALUES (@title, @description, @language, @version, @starterCode)
  `);
  const insertCase = db.prepare(`
    INSERT INTO test_cases (question_id, input, expected_output, is_visible)
    VALUES (@questionId, @input, @expectedOutput, @isVisible)
  `);

  const questionId = db.transaction(() => {
    const questionResult = insertQuestion.run({
      title,
      description,
      language,
      version,
      starterCode,
    });

    const newQuestionId = Number(questionResult.lastInsertRowid);

    for (const item of visibleTestCases) {
      insertCase.run({
        questionId: newQuestionId,
        input: String(item.input),
        expectedOutput: String(item.expectedOutput),
        isVisible: 1,
      });
    }

    for (const item of hiddenTestCases) {
      insertCase.run({
        questionId: newQuestionId,
        input: String(item.input),
        expectedOutput: String(item.expectedOutput),
        isVisible: 0,
      });
    }

    return newQuestionId;
  })();

  res.status(201).json({ questionId });
});

async function evaluateCases({ question, code, includeHidden }) {
  const targetCases = question.testCases.filter((item) => includeHidden || item.isVisible);
  const results = [];

  for (const testCase of targetCases) {
    const actualOutput = await executeCode({
      language: question.language,
      version: question.version,
      code,
      stdin: testCase.input,
    });

    const expectedOutput = normalizeOutput(testCase.expectedOutput);

    results.push({
      testCaseId: testCase.id,
      isVisible: testCase.isVisible,
      passed: actualOutput === expectedOutput,
      actualOutput,
    });
  }

  return results;
}

app.post('/api/questions/:id/run-visible', async (req, res) => {
  const questionId = Number(req.params.id);
  const { code } = req.body ?? {};

  if (Number.isNaN(questionId) || !code) {
    res.status(400).json({ message: 'Valid question id and code are required' });
    return;
  }

  const question = getQuestionWithCases(questionId);
  if (!question) {
    res.status(404).json({ message: 'Question not found' });
    return;
  }

  try {
    const results = await evaluateCases({ question, code, includeHidden: false });
    const passed = results.filter((item) => item.passed).length;

    res.json({
      results,
      summary: {
        passed,
        total: results.length,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Execution failed' });
  }
});

app.post('/api/questions/:id/submit', async (req, res) => {
  const questionId = Number(req.params.id);
  const { code } = req.body ?? {};

  if (Number.isNaN(questionId) || !code) {
    res.status(400).json({ message: 'Valid question id and code are required' });
    return;
  }

  const question = getQuestionWithCases(questionId);
  if (!question) {
    res.status(404).json({ message: 'Question not found' });
    return;
  }

  try {
    const results = await evaluateCases({ question, code, includeHidden: true });

    const visibleResults = results.filter((item) => item.isVisible);
    const hiddenResults = results.filter((item) => !item.isVisible);

    const visiblePassed = visibleResults.filter((item) => item.passed).length;
    const hiddenPassed = hiddenResults.filter((item) => item.passed).length;
    const allPassed = results.every((item) => item.passed);

    const submissionInsert = db.prepare(`
      INSERT INTO submissions (
        question_id, submitted_code, status,
        visible_passed, visible_total,
        hidden_passed, hidden_total,
        syntax_error
      ) VALUES (
        @questionId, @submittedCode, @status,
        @visiblePassed, @visibleTotal,
        @hiddenPassed, @hiddenTotal,
        @syntaxError
      )
    `);

    const resultInsert = db.prepare(`
      INSERT INTO submission_results (submission_id, test_case_id, passed, actual_output, is_visible)
      VALUES (@submissionId, @testCaseId, @passed, @actualOutput, @isVisible)
    `);

    const submissionId = db.transaction(() => {
      const submissionResult = submissionInsert.run({
        questionId,
        submittedCode: code,
        status: allPassed ? 'success' : 'failed',
        visiblePassed,
        visibleTotal: visibleResults.length,
        hiddenPassed,
        hiddenTotal: hiddenResults.length,
        syntaxError: null,
      });

      const newSubmissionId = Number(submissionResult.lastInsertRowid);

      for (const item of results) {
        resultInsert.run({
          submissionId: newSubmissionId,
          testCaseId: item.testCaseId,
          passed: item.passed ? 1 : 0,
          actualOutput: item.actualOutput,
          isVisible: item.isVisible ? 1 : 0,
        });
      }

      return newSubmissionId;
    })();

    res.json({
      submissionId,
      status: allPassed ? 'success' : 'failed',
      visibleResults,
      hiddenSummary: {
        passed: hiddenPassed,
        total: hiddenResults.length,
      },
      visibleSummary: {
        passed: visiblePassed,
        total: visibleResults.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Execution failed';

    const questionCases = question.testCases;
    const visibleCases = questionCases.filter((item) => item.isVisible);
    const hiddenCases = questionCases.filter((item) => !item.isVisible);

    const submissionId = db
      .prepare(`
        INSERT INTO submissions (
          question_id, submitted_code, status,
          visible_passed, visible_total,
          hidden_passed, hidden_total,
          syntax_error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        questionId,
        code,
        'syntax-error',
        0,
        visibleCases.length,
        0,
        hiddenCases.length,
        message,
      ).lastInsertRowid;

    res.status(400).json({
      submissionId: Number(submissionId),
      status: 'syntax-error',
      message,
    });
  }
});

app.get('/api/submissions', (req, res) => {
  const questionId = req.query.questionId ? Number(req.query.questionId) : null;

  if (req.query.questionId && Number.isNaN(questionId)) {
    res.status(400).json({ message: 'Invalid questionId' });
    return;
  }

  const rows = questionId
    ? db.prepare('SELECT * FROM submissions WHERE question_id = ? ORDER BY id DESC LIMIT 100').all(questionId)
    : db.prepare('SELECT * FROM submissions ORDER BY id DESC LIMIT 100').all();

  res.json({
    submissions: rows.map((row) => ({
      id: row.id,
      questionId: row.question_id,
      status: row.status,
      visiblePassed: row.visible_passed,
      visibleTotal: row.visible_total,
      hiddenPassed: row.hidden_passed,
      hiddenTotal: row.hidden_total,
      syntaxError: row.syntax_error,
      createdAt: row.created_at,
    })),
  });
});

app.listen(port, () => {
  console.log(`compile99 backend listening on http://localhost:${port}`);
});
