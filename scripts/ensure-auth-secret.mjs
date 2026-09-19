import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const envPath = path.join(projectRoot, '.env');
const secretPattern = /^\s*(?:export\s+)?BETTER_AUTH_SECRET\s*=\s*(.*)\s*$/m;

function parseValue(rawValue) {
  const value = rawValue.trim();
  if (
    value.length >= 2
    && ((value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value.replace(/\s+#.*$/, '').trim();
}

let envContents = '';
try {
  envContents = await readFile(envPath, 'utf8');
} catch (error) {
  if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') {
    throw error;
  }
}

const existingSecret = envContents.match(secretPattern);
if (existingSecret) {
  if (parseValue(existingSecret[1]).length < 32) {
    console.error('BETTER_AUTH_SECRET exists but must contain at least 32 characters.');
    process.exitCode = 1;
  } else {
    console.log('BETTER_AUTH_SECRET is already configured.');
  }
} else {
  const lineEnding = envContents.includes('\r\n') ? '\r\n' : '\n';
  const separator = envContents.length === 0 || envContents.endsWith('\n') ? '' : lineEnding;
  const generatedSecret = randomBytes(32).toString('base64url');
  const nextContents = `${envContents}${separator}BETTER_AUTH_SECRET="${generatedSecret}"${lineEnding}`;

  await writeFile(envPath, nextContents, 'utf8');
  console.log('BETTER_AUTH_SECRET was added to .env.');
}