import * as fs from 'fs';
import * as path from 'path';
import { ENV } from '../config';

export function updateEnvVariable(key: keyof typeof ENV, value: string | number) {
  const envPath = path.resolve(__dirname, '../../.env');
  
  // Update in memory so bot uses it immediately
  (ENV as any)[key] = value;

  if (!fs.existsSync(envPath)) return;

  const envFile = fs.readFileSync(envPath, 'utf8');
  const lines = envFile.split('\n');
  
  let keyFound = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}=`)) {
      lines[i] = `${key}=${value}`;
      keyFound = true;
      break;
    }
  }

  if (!keyFound) {
    lines.push(`${key}=${value}`);
  }

  fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
}
