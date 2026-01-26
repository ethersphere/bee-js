import { Bee } from './bee'
import { BeeDev } from './bee-dev'
import { Stamper } from './stamper/stamper'

export { MerkleTree } from 'cafe-utility'
export { MantarayNode } from './manifest/manifest'
export { SUPPORTED_BEE_VERSION, SUPPORTED_BEE_VERSION_EXACT } from './modules/debug/status'
export * from './types'
export { Bytes } from './utils/bytes'
export { ChunkJoiner, type DownloadProgress } from './utils/chunk-joiner'
export { type DownloadStreamOptions } from './modules/download-stream'
export * from './utils/constants'
export { Duration } from './utils/duration'
export * from './utils/error'
export * as Utils from './utils/expose'
export { Size } from './utils/size'
export * from './utils/tokens'
export * from './utils/typed-bytes'
export { makeContentAddressedChunk, type Chunk } from './chunk/cac'
export { makeEncryptedContentAddressedChunk, type EncryptedChunk } from './chunk/encrypted-cac'
export { calculateChunkAddress } from './chunk/bmt'
export { newChunkEncrypter } from './chunk/encryption'
export { ChunkUploadStream, type ChunkStreamOptions, type ChunkStreamResult } from './modules/chunk-stream-ws'
export { convertEnvelopeToMarshaledStamp } from './utils/stamps'
export { Bee, BeeDev, Stamper }

// for require-like imports
declare global {
  interface Window {
    // binded as 'BeeJs' via Webpack
    BeeJs: {
      Bee: typeof import('./bee').Bee
      BeeDev: typeof import('./bee-dev').BeeDev
      Stamper: typeof import('./stamper/stamper').Stamper
      Utils: typeof import('./utils/expose')
      Duration: typeof import('./utils/duration').Duration
      Size: typeof import('./utils/size').Size
      BeeError: typeof import('./utils/error').BeeError
      BeeArgumentError: typeof import('./utils/error').BeeArgumentError
      BeeResponseError: typeof import('./utils/error').BeeResponseError
      MantarayNode: typeof import('./manifest/manifest').MantarayNode
      MerkleTree: typeof import('cafe-utility').MerkleTree
      ChunkJoiner: typeof import('./utils/chunk-joiner').ChunkJoiner
      PrivateKey: typeof import('./utils/typed-bytes').PrivateKey
      PublicKey: typeof import('./utils/typed-bytes').PublicKey
      EthAddress: typeof import('./utils/typed-bytes').EthAddress
      Identifier: typeof import('./utils/typed-bytes').Identifier
      Reference: typeof import('./utils/typed-bytes').Reference
      TransactionId: typeof import('./utils/typed-bytes').TransactionId
      Span: typeof import('./utils/typed-bytes').Span
      PeerAddress: typeof import('./utils/typed-bytes').PeerAddress
      BatchId: typeof import('./utils/typed-bytes').BatchId
      Signature: typeof import('./utils/typed-bytes').Signature
      Topic: typeof import('./utils/typed-bytes').Topic
      FeedIndex: typeof import('./utils/typed-bytes').FeedIndex
    }
  }
}
