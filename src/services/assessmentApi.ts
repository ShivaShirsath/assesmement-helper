import type { CreateQuestionPayload, Question, QuestionDetails, TestCaseResult } from '../types/assessment';

const API_BASE = import.meta.env.VITE_API_BASE?.trim() || '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload as T;
}

export async function getQuestions() {
  return request<{ questions: Question[] }>('/questions');
}

export async function getQuestion(questionId: number) {
  return request<{ question: QuestionDetails }>(`/questions/${questionId}`);
}

export async function createQuestion(payload: CreateQuestionPayload) {
  return request<{ questionId: number }>('/questions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function runVisible(questionId: number, code: string) {
  return request<{ results: TestCaseResult[]; summary: { passed: number; total: number } }>(
    `/questions/${questionId}/run-visible`,
    {
      method: 'POST',
      body: JSON.stringify({ code }),
    },
  );
}

export async function submitSolution(questionId: number, code: string) {
  return request<{
    submissionId: number;
    status: 'success' | 'failed' | 'syntax-error';
    visibleResults?: TestCaseResult[];
    hiddenSummary?: { passed: number; total: number };
    visibleSummary?: { passed: number; total: number };
    message?: string;
  }>(`/questions/${questionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}
