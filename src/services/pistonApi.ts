const DEFAULT_PISTON_ENDPOINT = 'https://emkc.org/api/v2/execute';
const PISTON_ENDPOINT = import.meta.env.VITE_PISTON_ENDPOINT?.trim() || DEFAULT_PISTON_ENDPOINT;

export type ExecuteCodeParams = {
  language: string;
  version: string;
  code: string;
  stdin?: string;
};

export type ExecuteCodeResponse = {
  run?: {
    stdout?: string;
    stderr?: string;
    output?: string;
    code?: number;
    signal?: string;
  };
  compile?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    signal?: string;
  };
  message?: string;
};

export class PistonApiError extends Error {
  kind: 'platform' | 'network' | 'execution';

  constructor(kind: 'platform' | 'network' | 'execution', message: string) {
    super(message);
    this.kind = kind;
  }
}

function isWhitelistMessage(message: string) {
  return message.toLowerCase().includes('whitelist');
}

export async function executeCode({
  language,
  version,
  code,
  stdin = '',
}: ExecuteCodeParams): Promise<ExecuteCodeResponse> {
  let response: Response;
  try {
    response = await fetch(PISTON_ENDPOINT, {
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
  } catch {
    throw new PistonApiError(
      'network',
      'Unable to reach the execution server. Check endpoint/network configuration.',
    );
  }

  let payload: ExecuteCodeResponse | null = null;
  try {
    payload = (await response.json()) as ExecuteCodeResponse;
  } catch {
    payload = null;
  }

  const message = payload?.message?.trim() || '';
  if (isWhitelistMessage(message)) {
    throw new PistonApiError(
      'platform',
      'Public Piston is whitelist-only. Set VITE_PISTON_ENDPOINT to your own Piston instance.',
    );
  }

  if (!response.ok) {
    throw new PistonApiError(
      'execution',
      message || `Execution failed with status ${response.status}`,
    );
  }

  if (!payload) {
    throw new PistonApiError('execution', 'Execution server returned an invalid response.');
  }

  return payload;
}
