import type { TestCase } from '../types/assessment';

export const problemTitle = 'Sum of Two Integers';

export const problemDescription = `
## Problem
Write a program that reads two integers and prints their sum.

## Input Format
- A single line containing two space-separated integers.

## Output Format
- Print one integer: the sum of the two values.

## Example
Input:
\`10 25\`

Output:
\`35\`

## Notes
- Use standard input and output.
- Trim extra spaces/new lines before processing.
`;

export const starterCode = `const fs = require('fs');

const input = fs.readFileSync(0, 'utf8').trim();
if (!input) {
  process.exit(0);
}

const [a, b] = input.split(/\\s+/).map(Number);
console.log(a + b);
`;

export const testCases: TestCase[] = [
  { input: '1 2', expectedOutput: '3', isVisible: true },
  { input: '100 200', expectedOutput: '300', isVisible: true },
  { input: '-5 10', expectedOutput: '5', isVisible: true },
  { input: '999 1', expectedOutput: '1000', isVisible: false },
  { input: '-42 -58', expectedOutput: '-100', isVisible: false },
];
