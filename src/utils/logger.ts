type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(level: LogLevel, message: string, context?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };
  }

  private log(level: LogLevel, message: string, context?: any) {
    const entry = this.createLogEntry(level, message, context);
    this.logs.push(entry);

    switch (level) {
      case 'info':
        console.info(`[${entry.timestamp}] [INFO] ${message}`, context || '');
        break;
      case 'warn':
        console.warn(`[${entry.timestamp}] [WARN] ${message}`, context || '');
        break;
      case 'error':
        console.error(`[${entry.timestamp}] [ERROR] ${message}`, context || '');
        break;
      case 'debug':
        console.debug(`[${entry.timestamp}] [DEBUG] ${message}`, context || '');
        break;
    }
  }

  info(message: string, context?: any) {
    this.log('info', message, context);
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  error(message: string, context?: any) {
    this.log('error', message, context);
  }

  debug(message: string, context?: any) {
    this.log('debug', message, context);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export const logger = Logger.getInstance();