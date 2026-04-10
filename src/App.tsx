import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { ProblemPanel } from './components/ProblemPanel';
import { TestCaseTable } from './components/TestCaseTable';
import { ManageQuestionsPage } from './pages/ManageQuestionsPage';
import { createQuestion, getQuestion, getQuestions, runVisible, submitSolution } from './services/assessmentApi';
import type { CreateQuestionPayload, Question, QuestionDetails, SubmissionStatus, TestCaseResult } from './types/assessment';

export default function App() {
  const [tab, setTab] = useState<'assessment' | 'manage'>('assessment');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [question, setQuestion] = useState<QuestionDetails | null>(null);
  const [code, setCode] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  const [isRunningVisible, setIsRunningVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleResults, setVisibleResults] = useState<TestCaseResult[]>([]);
  const [invisibleSummary, setInvisibleSummary] = useState<{ passed: number; total: number } | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [message, setMessage] = useState('');

  const loadQuestions = async () => {
    const response = await getQuestions();
    setQuestions(response.questions);

    if (!selectedQuestionId && response.questions.length > 0) {
      setSelectedQuestionId(response.questions[0].id);
    }
  };

  useEffect(() => {
    loadQuestions().catch((error) => {
      setSubmissionStatus('platform-error');
      setMessage(error instanceof Error ? error.message : 'Failed to load questions');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedQuestionId) {
      return;
    }

    setLoadingQuestion(true);

    getQuestion(selectedQuestionId)
      .then((response) => {
        setQuestion(response.question);
        setCode(response.question.starterCode);
        setVisibleResults([]);
        setInvisibleSummary(null);
        setSubmissionStatus('idle');
        setMessage('');
      })
      .catch((error) => {
        setSubmissionStatus('platform-error');
        setMessage(error instanceof Error ? error.message : 'Failed to load question');
      })
      .finally(() => {
        setLoadingQuestion(false);
      });
  }, [selectedQuestionId]);

  const visibleCases = useMemo(() => question?.testCases ?? [], [question]);

  const runVisibleTests = async () => {
    if (!question) {
      return;
    }

    setIsRunningVisible(true);
    setSubmissionStatus('idle');
    setMessage('');

    try {
      const response = await runVisible(question.id, code);
      setVisibleResults(response.results);
      setMessage(`Visible tests passed: ${response.summary.passed}/${response.summary.total}`);
    } catch (error) {
      setSubmissionStatus('syntax-error');
      setMessage(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setIsRunningVisible(false);
    }
  };

  const handleSubmit = async () => {
    if (!question) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('idle');
    setMessage('');

    try {
      const response = await submitSolution(question.id, code);

      if (response.status === 'syntax-error') {
        setSubmissionStatus('syntax-error');
        setMessage(response.message || 'Syntax/runtime error');
        return;
      }

      setVisibleResults(response.visibleResults ?? []);
      setInvisibleSummary(response.hiddenSummary ?? null);
      setSubmissionStatus(response.status === 'success' ? 'success' : 'failed');
      setMessage(
        response.status === 'success'
          ? 'Great work. All visible and hidden test cases passed.'
          : 'Submission completed, but some test cases failed.',
      );
    } catch (error) {
      setSubmissionStatus('syntax-error');
      setMessage(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCreateQuestion = async (payload: CreateQuestionPayload) => {
    await createQuestion(payload);
    await loadQuestions();
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
              Backend-driven execution and submission with hidden test cases in server only.
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, px: 2 }}>
            <Tabs value={tab} onChange={(_, value) => setTab(value)}>
              <Tab label="Assessment" value="assessment" />
              <Tab label="Manage Questions" value="manage" />
            </Tabs>
          </Paper>

          {submissionStatus === 'success' && <Alert severity="success">{message}</Alert>}
          {submissionStatus === 'failed' && <Alert severity="warning">{message}</Alert>}
          {submissionStatus === 'syntax-error' && <Alert severity="error">{message}</Alert>}
          {submissionStatus === 'platform-error' && <Alert severity="error">{message}</Alert>}
          {submissionStatus === 'idle' && message && <Alert severity="info">{message}</Alert>}

          {tab === 'assessment' && (
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Select Question
                </Typography>
                <Select
                  fullWidth
                  value={selectedQuestionId ?? ''}
                  displayEmpty
                  onChange={(event) => setSelectedQuestionId(Number(event.target.value))}
                >
                  {questions.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      #{item.id} - {item.title}
                    </MenuItem>
                  ))}
                </Select>
              </Paper>

              {loadingQuestion && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                  <CircularProgress />
                </Box>
              )}

              {!loadingQuestion && question && (
                <>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 3,
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    }}
                  >
                    <Box>
                      <ProblemPanel title={question.title} description={question.description} />
                    </Box>
                    <Box>
                      <CodeEditorPanel
                        code={code}
                        onCodeChange={setCode}
                        language={question.language}
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
                </>
              )}
            </Stack>
          )}

          {tab === 'manage' && <ManageQuestionsPage questions={questions} onCreateQuestion={onCreateQuestion} />}
        </Stack>
      </Container>
    </Box>
  );
}
