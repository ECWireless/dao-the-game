import { spawn } from 'node:child_process';

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const processes = [];
let isShuttingDown = false;

function pipeOutput(stream, write, label) {
  if (!stream) {
    return;
  }

  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      write(`[${label}] ${line}\n`);
    }
  });

  stream.on('end', () => {
    if (buffer) {
      write(`[${label}] ${buffer}\n`);
    }
  });
}

function stopAll(signal = 'SIGTERM') {
  for (const child of processes) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

function launch(label, args) {
  const child = spawn(pnpmCommand, args, {
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe']
  });

  processes.push(child);

  pipeOutput(child.stdout, process.stdout.write.bind(process.stdout), label);
  pipeOutput(child.stderr, process.stderr.write.bind(process.stderr), label);

  child.on('exit', (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    stopAll();

    if (signal) {
      process.exitCode = 1;
      process.stderr.write(`[${label}] exited due to signal ${signal}\n`);
      return;
    }

    process.exitCode = code ?? 0;
  });

  child.on('error', (error) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    stopAll();
    process.exitCode = 1;
    process.stderr.write(`[${label}] failed to start: ${error.message}\n`);
  });
}

process.on('SIGINT', () => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  stopAll('SIGINT');
});

process.on('SIGTERM', () => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  stopAll('SIGTERM');
});

launch('api', ['dev:api']);
launch('web', ['dev']);
