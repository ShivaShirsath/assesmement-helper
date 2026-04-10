export type SubmissionStatus = 'idle' | 'success' | 'failed' | 'syntax-error' | 'platform-error';

export type Question = {
  id: number;
  title: string;
  description: string;
  language: string;
  version: string;
  starterCode: string;
  createdAt: string;
};

export type TestCase = {
  id?: number;
  input: string;
  expectedOutput: string;
  isVisible: boolean;
};

export type TestCaseResult = {
  testCaseId: number;
  isVisible: boolean;
  passed: boolean;
  actualOutput: string;
};

export type QuestionDetails = Question & {
  testCases: TestCase[];
};

export type CreateQuestionPayload = {
  title: string;
  description: string;
  language: string;
  version: string;
  starterCode: string;
  visibleTestCases: Array<{ input: string; expectedOutput: string }>;
  hiddenTestCases: Array<{ input: string; expectedOutput: string }>;
};
