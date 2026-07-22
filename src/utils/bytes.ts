export { Bytes } from 'swarm-core'

export function parseSizeToBytes(sizeStr: string): number {
  const units = {
    B: 1,
    kB: 1000,
    MB: 1000 ** 2,
    GB: 1000 ** 3,
    TB: 1000 ** 4,
    PB: 1000 ** 5,
  }

  const match = sizeStr.match(/^([\d.]+)\s*(B|kB|MB|GB|TB|PB)$/)

  if (!match) {
    throw new Error(`Invalid size format: ${sizeStr}`)
  }

  const value = parseFloat(match[1])
  const unit = match[2] as keyof typeof units

  return Math.ceil(value * units[unit])
}
