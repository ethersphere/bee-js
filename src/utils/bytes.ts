import { Binary, Types } from 'cafe-utility'

const DECODER = new TextDecoder()
const ENCODER = new TextEncoder()

export class Bytes {
  protected readonly bytes: Uint8Array
  public readonly length: number

  constructor(bytes: Uint8Array | ArrayBuffer | string | Bytes, byteLength?: number | number[]) {
    if (bytes instanceof Bytes) {
      this.bytes = bytes.bytes
    } else if (typeof bytes === 'string') {
      this.bytes = Binary.hexToUint8Array(Types.asHexString(bytes, { name: 'Bytes#constructor(bytes)' }))
    } else if (bytes instanceof ArrayBuffer) {
      this.bytes = new Uint8Array(bytes)
    } else {
      this.bytes = bytes
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
}
