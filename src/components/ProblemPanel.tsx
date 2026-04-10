import { Box, Paper, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ProblemPanelProps = {
  title: string;
  description: string;
};

export function ProblemPanel({ title, description }: ProblemPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        backgroundColor: 'background.paper',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        {title}
      </Typography>
      <Box
        sx={{
          color: 'text.secondary',
          '& p': { lineHeight: 1.65 },
          '& code': {
            backgroundColor: '#f4f4f5',
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            fontFamily: 'monospace',
          },
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
      </Box>
    </Paper>
  );
}
