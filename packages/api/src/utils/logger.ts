export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type LoggerFunction = (level: LogLevel, message: string, data?: unknown) => void;

export interface ILogger {
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
    debug(message: string, data?: unknown): void; // Make debug required for consistency
}

export class Logger implements ILogger {
    constructor(private customLogger?: LoggerFunction) {}

    private safeLog(level: LogLevel, message: string, data?: unknown): void {
        try {
            if (this.customLogger) {
                this.customLogger(level, message, data);
            } else {
                const logMessage = `[${level.toUpperCase()}] ${message}`;
                const logData = data !== undefined ? data : '';

                switch (level) {
                    case 'info':
                        console.info(logMessage, logData);
                        break;
                    case 'warn':
                        console.warn(logMessage, logData);
                        break;
                    case 'error':
                        console.error(logMessage, logData);
                        break;
                    case 'debug':
                        console.debug(logMessage, logData);
                        break;
                }
            }
        } catch (error) {
            // Fallback to console.error if logging fails
            console.error(`Logger error in ${level}:`, error);
        }
    }

    info(message: string, data?: unknown): void {
        this.safeLog('info', message, data);
    }

    warn(message: string, data?: unknown): void {
        this.safeLog('warn', message, data);
    }

    error(message: string, data?: unknown): void {
        this.safeLog('error', message, data);
    }

    debug(message: string, data?: unknown): void {
        this.safeLog('debug', message, data);
    }
}