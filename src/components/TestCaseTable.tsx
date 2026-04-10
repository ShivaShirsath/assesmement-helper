import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { TestCase, TestCaseResult } from '../types/assessment';

type TestCaseTableProps = {
  visibleCases: TestCase[];
  visibleResults: TestCaseResult[];
};

function statusChip(result?: TestCaseResult) {
  if (!result) {
    return <Chip size="small" label="Pending" variant="outlined" />;
  }

  if (result.passed) {
    return <Chip size="small" color="success" label="Passed" />;
  }

  return <Chip size="small" color="error" label="Failed" />;
}

export function TestCaseTable({ visibleCases, visibleResults }: TestCaseTableProps) {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <Typography variant="h6" sx={{ px: 2, pt: 2, fontWeight: 600 }}>
        Visible Test Cases
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Input</TableCell>
            <TableCell>Expected Output</TableCell>
            <TableCell align="right">Result</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleCases.map((testCase, idx) => {
            const result = visibleResults.find((item) => item.index === idx && item.isVisible);

            return (
              <TableRow key={`visible-${idx}`}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{testCase.input}</TableCell>
                <TableCell>{testCase.expectedOutput}</TableCell>
                <TableCell align="right">{statusChip(result)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
