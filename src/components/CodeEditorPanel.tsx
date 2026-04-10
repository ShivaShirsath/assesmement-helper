import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';

type CodeEditorPanelProps = {
  code: string;
  onCodeChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  onRunVisible: () => void;
  onSubmit: () => void;
  isRunningVisible: boolean;
  isSubmitting: boolean;
};

export function CodeEditorPanel({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  onRunVisible,
  onSubmit,
  isRunningVisible,
  isSubmitting,
}: CodeEditorPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Code Editor
        </Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="language-label">Language</InputLabel>
          <Select
            labelId="language-label"
            value={language}
            label="Language"
            onChange={(event) => onLanguageChange(event.target.value)}
          >
            <MenuItem value="javascript">JavaScript</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TextField
        fullWidth
        multiline
        minRows={16}
        maxRows={24}
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        placeholder="Write your solution here..."
        variant="outlined"
        InputProps={{
          sx: {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 14,
            lineHeight: 1.6,
            backgroundColor: '#fafafa',
          },
        }}
      />

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={isRunningVisible ? <CircularProgress size={18} /> : <PlayArrowIcon />}
          onClick={onRunVisible}
          disabled={isRunningVisible || isSubmitting}
        >
          Run Visible Tests
        </Button>
        <Button
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : <SendIcon />}
          onClick={onSubmit}
          disabled={isSubmitting || isRunningVisible}
        >
          Submit
        </Button>
      </Box>
    </Paper>
  );
}
