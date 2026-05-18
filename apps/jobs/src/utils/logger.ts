/**
 * Tiny structured logger for the worker. Keeps log output greppable across
 * processors without pulling in a full logger dependency.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFields {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, fields: LogFields = {}): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...fields
  };

  const stream = level === 'error' || level === 'warn' ? console.error : console.log;
  stream(JSON.stringify(payload));
}

export const log = {
  debug: (msg: string, fields?: LogFields) => emit('debug', msg, fields),
  info: (msg: string, fields?: LogFields) => emit('info', msg, fields),
  warn: (msg: string, fields?: LogFields) => emit('warn', msg, fields),
  error: (msg: string, fields?: LogFields) => emit('error', msg, fields)
};
