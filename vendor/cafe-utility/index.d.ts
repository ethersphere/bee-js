export declare const Strings: {
  randomHex(length: number): string
  randomAlphanumeric(length: number): string
  joinUrl(parts: unknown[]): string
  extractAllBlocks(string: string, options: { opening: string; closing: string }): string[]
}

export declare const Dates: {
  seconds(count: number): number
  minutes(count: number): number
  days(count: number): number
}

export declare const Random: {
  intBetween(min: number, max: number): number
}

export declare const Objects: {
  deepEquals(a: unknown, b: unknown): boolean
}

export declare const Types: {
  asString(value: unknown, options?: { name?: string }): string
  asHexString(value: unknown, options?: { name?: string; byteLength?: number }): string
  asObject(value: unknown, options?: { name?: string }): Record<string, unknown>
}

export declare const System: {
  sleepMillis(millis: number): Promise<void>
  waitFor(
    predicate: () => Promise<boolean>,
    options: { attempts: number; waitMillis: number; requiredConsecutivePasses?: number },
  ): Promise<void>
  withRetries<T>(
    callable: () => Promise<T>,
    allowedFailures: number,
    delayMillisFirst: number,
    delayMillisLast: number,
  ): Promise<T>
}
