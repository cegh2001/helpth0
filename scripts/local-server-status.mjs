import { pathToFileURL } from 'node:url';

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';

export async function probeHelpth0Server(
  baseUrl = DEFAULT_BASE_URL,
  timeoutMs = 1_500
) {
  try {
    const response = await fetch(`${baseUrl}/api/setup`, {
      cache: 'no-store',
      headers: { 'sec-fetch-site': 'same-origin' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await response.json().catch(() => null);

    return response.ok && typeof body?.configured === 'boolean'
      ? 'helpth0'
      : 'occupied';
  } catch (error) {
    const code = error instanceof Error && 'cause' in error
      && error.cause && typeof error.cause === 'object' && 'code' in error.cause
      ? error.cause.code
      : null;

    return code === 'ECONNREFUSED' ? 'available' : 'occupied';
  }
}

async function waitForHelpth0(baseUrl = DEFAULT_BASE_URL, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await probeHelpth0Server(baseUrl);
    if (status === 'helpth0') return true;
    if (status === 'occupied') return false;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const command = process.argv[2];
  if (command === 'status') {
    const status = await probeHelpth0Server();
    process.exitCode = status === 'available' ? 0 : status === 'helpth0' ? 10 : 11;
  } else if (command === 'wait') {
    process.exitCode = await waitForHelpth0() ? 0 : 1;
  } else {
    console.error('Usage: node scripts/local-server-status.mjs <status|wait>');
    process.exitCode = 2;
  }
}