import { Binary, Objects, Types } from 'cafe-utility'
import _debug from 'debug'

const debug = _debug('bee-js:bytes')

const DECODER = new TextDecoder()
const ENCODER = new TextEncoder()

export class Bytes {
  protected readonly bytes: Uint8Array
  public readonly length: number

  constructor(bytes: Uint8Array | ArrayBuffer | string | Bytes, byteLength?: number | number[]) {
    if (!bytes) {
      throw Error(`Bytes#constructor: constructor parameter is falsy: ${bytes}`)
    }

    if (bytes instanceof Bytes) {
      this.bytes = bytes.bytes
    } else if (typeof bytes === 'string') {
      this.bytes = Binary.hexToUint8Array(Types.asHexString(bytes, { name: 'Bytes#constructor(bytes)' }))
    } else if (bytes instanceof ArrayBuffer) {
      this.bytes = new Uint8Array(bytes)
    } else if (bytes instanceof Uint8Array) {
      this.bytes = bytes
    } else {
      const unknownInput = bytes as unknown
      const toHex = Objects.getDeep(unknownInput, 'toHex')
      if (Types.isFunction(toHex)) {
        const hex = toHex.call(unknownInput)
        this.bytes = Binary.hexToUint8Array(Types.asHexString(hex, { name: 'Bytes#constructor(bytes)' }))
      } else {
        debug('bytes', bytes)
        throw new Error(`Bytes#constructor: unsupported type: ${typeof bytes}`)
      }
    }

    this.length = this.bytes.length

    if (byteLength) {
      if (Array.isArray(byteLength)) {
        if (!byteLength.includes(this.length)) {
          throw new Error(
            `Bytes#checkByteLength: bytes length is ${this.length} but expected ${byteLength.join(' or ')}`,
          )
        }
      } else if (this.length !== byteLength) {
        throw new Error(`Bytes#checkByteLength: bytes length is ${this.length} but expected ${byteLength}`)
      }
    }
  }

  static keccak256(bytes: Uint8Array | ArrayBuffer | string | Bytes): Bytes {
    return new Bytes(Binary.keccak256(new Bytes(bytes).toUint8Array()))
  }

  static fromUtf8(utf8: string): Bytes {
    return new Bytes(ENCODER.encode(utf8))
  }

  static fromSlice(bytes: Uint8Array, start: number, length?: number): Bytes {
    if (length === undefined) {
      return new Bytes(bytes.slice(start))
    }

    return new Bytes(bytes.slice(start, start + length))
  }

  offset(index: number): Uint8Array {
    return new Uint8Array(this.bytes.slice(index))
  }

  public toUint8Array(): Uint8Array {
    return new Uint8Array(this.bytes)
  }

  public toHex(): string {
    return Binary.uint8ArrayToHex(this.bytes)
  }

  public toBase64(): string {
    return Binary.uint8ArrayToBase64(this.bytes)
  }

  public toBase32(): string {
    return Binary.uint8ArrayToBase32(this.bytes)
  }

  public toString(): string {
    return this.toHex()
  }

  public toUtf8(): string {
    return DECODER.decode(this.bytes)
  }

  public toJSON(): unknown {
    return JSON.parse(this.toUtf8())
  }

  public equals(other: Bytes | Uint8Array | string): boolean {
    return this.toHex() === new Bytes(other).toHex()
  }

  public represent(): string {
    return this.toHex()
  }
}

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
