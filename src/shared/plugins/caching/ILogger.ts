export interface ILogger {
  error: LeveledLogMethod
  warn: LeveledLogMethod
  info: LeveledLogMethod
  debug: LeveledLogMethod
}

export interface LeveledLogMethod {
  (message: string, ...meta: any[]): ILogger
  (message: any): ILogger
}
