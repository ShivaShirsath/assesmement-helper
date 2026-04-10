import { useMemo, useState } from 'react';
import { Alert, Box, Container, Stack, Typography } from '@mui/material';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { ProblemPanel } from './components/ProblemPanel';
import { TestCaseTable } from './components/TestCaseTable';
import { problemDescription, problemTitle, starterCode, testCases } from './data/problem';
import { executeCode, PistonApiError } from './services/pistonApi';
import type { SubmissionStatus, TestCaseResult } from './types/assessment';

const LANGUAGE = 'javascript';
const VERSION = '18.15.0';

function normalizeOutput(value: string) {
  return value.replace(/\r\n/g, '\n').trim();
}

export default function App() {
  const [code, setCode] = useState(starterCode);
  const [language, setLanguage] = useState(LANGUAGE);
  const [isRunningVisible, setIsRunningVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleResults, setVisibleResults] = useState<TestCaseResult[]>([]);
  const [invisibleSummary, setInvisibleSummary] = useState<{ passed: number; total: number } | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [message, setMessage] = useState('');

  const visibleCases = useMemo(() => testCases.filter((testCase) => testCase.isVisible), []);
  const evaluateCases = async (targetVisibility: 'visible' | 'all') => {
    const selectedCases = testCases.filter((testCase) => targetVisibility === 'all' || testCase.isVisible);
    const collectedResults: TestCaseResult[] = [];

    for (let index = 0; index < selectedCases.length; index += 1) {
      const testCase = selectedCases[index];
      const globalIndex = testCases.indexOf(testCase);

      const response = await executeCode({
        language,
        version: VERSION,
        code,
        stdin: testCase.input,
      });

      const compileError = response.compile?.stderr?.trim();
      const runtimeError = response.run?.stderr?.trim();

      if (compileError || runtimeError) {
        throw new Error(compileError || runtimeError || 'Execution error');
      }

      const actualOutput = normalizeOutput(response.run?.stdout ?? response.run?.output ?? '');
      const expectedOutput = normalizeOutput(testCase.expectedOutput);

      collectedResults.push({
        index: globalIndex,
        isVisible: testCase.isVisible,
        passed: actualOutput === expectedOutput,
        actualOutput,
      });
    }

    return collectedResults;
  };

  const runVisibleTests = async () => {
    setIsRunningVisible(true);
    setSubmissionStatus('idle');
    setMessage('');

    try {
      const results = await evaluateCases('visible');
      setVisibleResults(results);
      const passedCount = results.filter((result) => result.passed).length;
      setMessage(`Visible tests passed: ${passedCount}/${results.length}`);
    } catch (error) {
      if (error instanceof PistonApiError && (error.kind === 'platform' || error.kind === 'network')) {
        setSubmissionStatus('platform-error');
        setMessage(error.message);
        return;
      }
      setSubmissionStatus('syntax-error');
      setMessage(error instanceof Error ? error.message : 'Syntax/runtime error');
    } finally {
      setIsRunningVisible(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionStatus('idle');
    setMessage('');

    try {
      const allResults = await evaluateCases('all');
      const visible = allResults.filter((item) => item.isVisible);
      const invisible = allResults.filter((item) => !item.isVisible);

      setVisibleResults(visible);
      setInvisibleSummary({
        passed: invisible.filter((item) => item.passed).length,
        total: invisible.length,
      });

      const passedAll = allResults.every((item) => item.passed);
      setSubmissionStatus(passedAll ? 'success' : 'failed');
      setMessage(
        passedAll
          ? 'Great work. All visible and hidden test cases passed.'
          : 'Submission completed, but some test cases failed.',
      );
    } catch (error) {
      if (error instanceof PistonApiError && (error.kind === 'platform' || error.kind === 'network')) {
        setSubmissionStatus('platform-error');
        setMessage(error.message);
        return;
      }
      setSubmissionStatus('syntax-error');
      setMessage(error instanceof Error ? error.message : 'Syntax/runtime error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f9fbff 0%, #f4f6fa 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Assessment Workspace
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Solve the problem, run visible tests, and submit against hidden tests.
            </Typography>
          </Box>

          {submissionStatus === 'success' && <Alert severity="success">{message}</Alert>}
          {submissionStatus === 'failed' && <Alert severity="warning">{message}</Alert>}
          {submissionStatus === 'syntax-error' && <Alert severity="error">Syntax/runtime error: {message}</Alert>}
          {submissionStatus === 'platform-error' && <Alert severity="error">{message}</Alert>}
          {submissionStatus === 'idle' && message && <Alert severity="info">{message}</Alert>}

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <Box>
              <ProblemPanel title={problemTitle} description={problemDescription} />
            </Box>
            <Box>
              <CodeEditorPanel
                code={code}
                onCodeChange={setCode}
                language={language}
                onLanguageChange={setLanguage}
                onRunVisible={runVisibleTests}
                onSubmit={handleSubmit}
                isRunningVisible={isRunningVisible}
                isSubmitting={isSubmitting}
              />
            </Box>
          </Box>

          <TestCaseTable visibleCases={visibleCases} visibleResults={visibleResults} />

          {invisibleSummary && (
            <Alert severity={invisibleSummary.passed === invisibleSummary.total ? 'success' : 'warning'}>
              Hidden test cases: {invisibleSummary.passed}/{invisibleSummary.total} passed
            </Alert>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
