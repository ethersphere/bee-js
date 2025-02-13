import { Binary, Elliptic } from 'cafe-utility'
import { Bytes } from './bytes'
import { convertCidToReference, convertReferenceToCid } from './cid'

// TODO: add JSdocs for each class

const ENCODER = new TextEncoder()

export class PrivateKey extends Bytes {
  static readonly LENGTH = 32
  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }

  publicKey(): PublicKey {
    const [x, y] = Elliptic.privateKeyToPublicKey(Binary.uint256ToNumber(this.bytes, 'BE'))

    return new PublicKey(Binary.concatBytes(Binary.numberToUint256(x, 'BE'), Binary.numberToUint256(y, 'BE')))
  }

  sign(data: Uint8Array | string): Signature {
    const digest = Binary.concatBytes(
      ENCODER.encode(`\x19Ethereum Signed Message:\n32`),
      Binary.keccak256(data instanceof Uint8Array ? data : ENCODER.encode(data)),
    )
    const [r, s, v] = Elliptic.signMessage(digest, Binary.uint256ToNumber(this.bytes, 'BE'))

    return new Signature(
      Binary.concatBytes(Binary.numberToUint256(r, 'BE'), Binary.numberToUint256(s, 'BE'), new Uint8Array([Number(v)])),
    )
  }
}

export class PublicKey extends Bytes {
  static readonly LENGTH = 64
  constructor(bytes: Uint8Array | string | Bytes) {
    const b = new Bytes(bytes)

    if (b.length === 33) {
      const [x, y] = Elliptic.publicKeyFromCompressed(b.toUint8Array())
      super(Binary.concatBytes(Binary.numberToUint256(x, 'BE'), Binary.numberToUint256(y, 'BE')), 64)
    } else {
      super(bytes, 64)
    }
  }

  address(): EthAddress {
    const x = Binary.uint256ToNumber(this.bytes.slice(0, 32), 'BE')
    const y = Binary.uint256ToNumber(this.bytes.slice(32, 64), 'BE')

    return new EthAddress(Elliptic.publicKeyToAddress([x, y]))
  }

  toCompressedUint8Array(): Uint8Array {
    const x = Binary.uint256ToNumber(this.bytes.slice(0, 32), 'BE')
    const y = Binary.uint256ToNumber(this.bytes.slice(32, 64), 'BE')

    return Elliptic.compressPublicKey([x, y])
  }

  toCompressedHex(): string {
    return Binary.uint8ArrayToHex(this.toCompressedUint8Array())
  }
}

export class EthAddress extends Bytes {
  static readonly LENGTH = 20
  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 20)
  }

  public toChecksum(): string {
    return Elliptic.checksumEncode(this.bytes)
  }
}

export class Identifier extends Bytes {
  static readonly LENGTH = 32
  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }
}

export class Reference extends Bytes {
  static readonly LENGTH = 32
  constructor(bytes: Uint8Array | string | Bytes) {
    if (typeof bytes === 'string' && bytes.startsWith('bah5')) {
      const decoded = convertCidToReference(bytes)
      super(decoded.reference.bytes, 32)
    } else {
      super(bytes, [32, 64])
    }
  }

  toCid(type: 'feed' | 'manifest'): string {
    return convertReferenceToCid(this.bytes, type)
  }

  static isValid(value: string): boolean {
    try {
      new Reference(value)
      return true
    } catch {
      return false
    }
  }
}

export class TransactionId extends Bytes {
  static readonly LENGTH = 32
  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }
}

export class Span extends Bytes {
  static readonly LENGTH = 8
  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 8)
  }

  static fromBigInt(number: bigint): FeedIndex {
    return new Span(Binary.numberToUint64(number, 'LE'))
  }

  toBigInt(): bigint {
    return Binary.uint64ToNumber(this.bytes, 'LE')
  }

  static fromSlice(bytes: Uint8Array, start: number): Span {
    return new Span(bytes.slice(start, start + Span.LENGTH))
  }
}

export class PeerAddress extends Bytes {
  static readonly LENGTH = 32
  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }
}

export class BatchId extends Bytes {
  static readonly LENGTH = 32
  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }
}

export class Signature extends Bytes {
  static readonly LENGTH = 65
  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 65)
  }

  static fromSlice(bytes: Uint8Array, start: number): Signature {
    return new Signature(bytes.slice(start, start + Signature.LENGTH))
  }

  recoverPublicKey(digest: Uint8Array | string): PublicKey {
    const r = Binary.uint256ToNumber(this.bytes.slice(0, 32), 'BE')
    const s = Binary.uint256ToNumber(this.bytes.slice(32, 64), 'BE')
    const v = BigInt(this.bytes[64]) as 27n | 28n
    const [x, y] = Elliptic.recoverPublicKey(
      Binary.concatBytes(
        ENCODER.encode(`\x19Ethereum Signed Message:\n32`),
        Binary.keccak256(digest instanceof Uint8Array ? digest : ENCODER.encode(digest)),
      ),
      r,
      s,
      v,
    )

    return new PublicKey(Binary.concatBytes(Binary.numberToUint256(x, 'BE'), Binary.numberToUint256(y, 'BE')))
  }
}

export class Topic extends Bytes {
  static readonly LENGTH = 32
  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }

  static fromString(value: string): Topic {
    return new Topic(Binary.keccak256(ENCODER.encode(value)))
  }
}

export class FeedIndex extends Bytes {
  static readonly LENGTH = 8
  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 8)
  }

  static fromBigInt(number: bigint): FeedIndex {
    return new FeedIndex(Binary.numberToUint64(number, 'BE'))
  }

  toBigInt(): bigint {
    return Binary.uint64ToNumber(this.bytes, 'BE')
  }
}
