import { Binary, Chunk } from 'cafe-utility'
import { EnvelopeWithBatchId } from '../types'
import { BatchId, PrivateKey } from '../utils/typed-bytes'

export class Stamper {
  signer: PrivateKey
  batchId: BatchId
  buckets: Uint32Array
  depth: number
  maxSlot: number

  private constructor(
    signer: PrivateKey | Uint8Array | string,
    batchId: BatchId | Uint8Array | string,
    buckets: Uint32Array,
    depth: number,
  ) {
    this.signer = new PrivateKey(signer)
    this.batchId = new BatchId(batchId)
    this.buckets = buckets
    this.depth = depth
    this.maxSlot = 2 ** (this.depth - 16)
  }

  static fromBlank(signer: PrivateKey | Uint8Array | string, batchId: BatchId | Uint8Array | string, depth: number) {
    return new Stamper(signer, batchId, new Uint32Array(65536), depth)
  }

  static fromState(
    signer: PrivateKey | Uint8Array | string,
    batchId: BatchId | Uint8Array | string,
    buckets: Uint32Array,
    depth: number,
  ) {
    return new Stamper(signer, batchId, buckets, depth)
  }

  stamp(chunk: Chunk): EnvelopeWithBatchId {
    const address = chunk.hash()
    const bucket = Binary.uint16ToNumber(address, 'BE')
    const height = this.buckets[bucket]

    if (height >= this.maxSlot) {
      throw Error('Bucket is full')
    }
    this.buckets[bucket]++
    const index = Binary.concatBytes(Binary.numberToUint32(bucket, 'BE'), Binary.numberToUint32(height, 'BE'))
    const timestamp = Binary.numberToUint64(BigInt(Date.now()), 'BE')
    const signature = this.signer.sign(Binary.concatBytes(address, this.batchId.toUint8Array(), index, timestamp))

    return {
      batchId: this.batchId,
      index,
      issuer: this.signer.publicKey().address().toUint8Array(),
      signature: signature.toUint8Array(),
      timestamp,
    }
  }

  getState(): Uint32Array {
    return this.buckets
  }
}
