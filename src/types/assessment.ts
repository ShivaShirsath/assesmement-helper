export type TestCase = {
  input: string;
  expectedOutput: string;
  isVisible: boolean;
};

export type TestCaseResult = {
  index: number;
  isVisible: boolean;
  passed: boolean;
  actualOutput: string;
  error?: string;
};

export type SubmissionStatus = 'idle' | 'success' | 'failed' | 'syntax-error' | 'platform-error';
