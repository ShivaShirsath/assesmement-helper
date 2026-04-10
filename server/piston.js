const DEFAULT_PISTON_ENDPOINT = 'http://localhost:2000/api/v2/execute';

const pistonEndpoint = process.env.PISTON_ENDPOINT || DEFAULT_PISTON_ENDPOINT;

export function normalizeOutput(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

export async function executeCode({ language, version, code, stdin = '' }) {
  const response = await fetch(pistonEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language,
      version,
      stdin,
      files: [
        {
          name: `main.${language === 'javascript' ? 'js' : 'txt'}`,
          content: code,
        },
      ],
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Execution server failed with status ${response.status}`);
  }

  const compileError = payload?.compile?.stderr?.trim();
  const runtimeError = payload?.run?.stderr?.trim();

  if (compileError || runtimeError) {
    throw new Error(compileError || runtimeError || 'Execution error');
  }

  return normalizeOutput(payload?.run?.stdout ?? payload?.run?.output ?? '');
}
