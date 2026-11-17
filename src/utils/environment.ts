export function whereAmI(): 'browser' | 'node' {
  const process = (globalThis as { process?: { browser?: boolean } }).process

  return process && process.browser !== true ? 'node' : 'browser'
}
