import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { CreateQuestionPayload, Question } from '../types/assessment';

type ManageQuestionsPageProps = {
  questions: Question[];
  onCreateQuestion: (payload: CreateQuestionPayload) => Promise<void>;
};

type DraftCase = { input: string; expectedOutput: string };

function emptyCase(): DraftCase {
  return { input: '', expectedOutput: '' };
}

export function ManageQuestionsPage({ questions, onCreateQuestion }: ManageQuestionsPageProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [starterCode, setStarterCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [version, setVersion] = useState('18.15.0');
  const [visibleCases, setVisibleCases] = useState<DraftCase[]>([emptyCase()]);
  const [hiddenCases, setHiddenCases] = useState<DraftCase[]>([emptyCase()]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');

  const sortedQuestions = useMemo(() => [...questions].sort((a, b) => b.id - a.id), [questions]);

  const updateCase = (type: 'visible' | 'hidden', index: number, key: keyof DraftCase, value: string) => {
    const target = type === 'visible' ? visibleCases : hiddenCases;
    const setter = type === 'visible' ? setVisibleCases : setHiddenCases;

    const next = [...target];
    next[index] = { ...next[index], [key]: value };
    setter(next);
  };

  const addCase = (type: 'visible' | 'hidden') => {
    if (type === 'visible') {
      setVisibleCases((prev) => [...prev, emptyCase()]);
      return;
    }
    setHiddenCases((prev) => [...prev, emptyCase()]);
  };

  const removeCase = (type: 'visible' | 'hidden', index: number) => {
    const target = type === 'visible' ? visibleCases : hiddenCases;
    const setter = type === 'visible' ? setVisibleCases : setHiddenCases;
    if (target.length === 1) {
      return;
    }
    setter(target.filter((_, idx) => idx !== index));
  };

  const submitForm = async () => {
    setSaving(true);
    setFeedback('');
    setError('');

    try {
      await onCreateQuestion({
        title,
        description,
        language,
        version,
        starterCode,
        visibleTestCases: visibleCases,
        hiddenTestCases: hiddenCases,
      });

      setFeedback('Question saved successfully.');
      setTitle('');
      setDescription('');
      setStarterCode('');
      setVisibleCases([emptyCase()]);
      setHiddenCases([emptyCase()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Create Question
            </Typography>

            {feedback && <Alert severity="success">{feedback}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
            <TextField
              label="Description (Markdown)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={6}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Version" value={version} onChange={(e) => setVersion(e.target.value)} fullWidth />
              </Grid>
            </Grid>

            <TextField
              label="Starter Code"
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              fullWidth
              multiline
              minRows={8}
            />

            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Visible Test Cases
            </Typography>
            {visibleCases.map((testCase, idx) => (
              <Grid container spacing={1} key={`visible-${idx}`}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    label={`Input ${idx + 1}`}
                    value={testCase.input}
                    onChange={(e) => updateCase('visible', idx, 'input', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    label={`Expected ${idx + 1}`}
                    value={testCase.expectedOutput}
                    onChange={(e) => updateCase('visible', idx, 'expectedOutput', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button color="error" onClick={() => removeCase('visible', idx)} fullWidth>
                    Remove
                  </Button>
                </Grid>
              </Grid>
            ))}
            <Button variant="outlined" onClick={() => addCase('visible')}>
              Add Visible Case
            </Button>

            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Hidden Test Cases
            </Typography>
            {hiddenCases.map((testCase, idx) => (
              <Grid container spacing={1} key={`hidden-${idx}`}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    label={`Input ${idx + 1}`}
                    value={testCase.input}
                    onChange={(e) => updateCase('hidden', idx, 'input', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    label={`Expected ${idx + 1}`}
                    value={testCase.expectedOutput}
                    onChange={(e) => updateCase('hidden', idx, 'expectedOutput', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button color="error" onClick={() => removeCase('hidden', idx)} fullWidth>
                    Remove
                  </Button>
                </Grid>
              </Grid>
            ))}
            <Button variant="outlined" onClick={() => addCase('hidden')}>
              Add Hidden Case
            </Button>

            <Box>
              <Button variant="contained" onClick={submitForm} disabled={saving}>
                {saving ? 'Saving...' : 'Save Question'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Existing Questions
          </Typography>
          <Stack spacing={1.5}>
            {sortedQuestions.map((item) => (
              <Box key={item.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle2">#{item.id}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.language} {item.version}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
