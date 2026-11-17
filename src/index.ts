import { Bee } from './bee.js'

export {
  BatchId,
  BpsPosition,
  Bytes,
  ChunkBuilder,
  ChunkSplitter,
  EthAddress,
  FeedIndex,
  Identifier,
  PeerAddress,
  PrivateKey,
  PublicKey,
  Reference,
  Signature,
  Span,
  Stamper,
  Topic,
  TransactionId,
} from '@ethersphere/core-sdk'
export type { Chunk } from '@ethersphere/core-sdk'
export type { SingleOwnerChunk } from './chunk/soc.js'
export { MantarayNode } from './manifest/manifest.js'
export { RollingFeedReader, RollingFeedWriter } from './modules/rolling-feed.js'
export * from './types/index.js'
export * from './utils/constants.js'
export { Duration } from './utils/duration.js'
export * from './utils/error.js'
export * as Utils from './utils/expose.js'
export { Size } from './utils/size.js'
export * from './utils/tokens.js'
export type { UploadProgress } from './utils/upload-progress.js'
export { SUPPORTED_BEE_VERSION, SUPPORTED_BEE_VERSION_EXACT } from './version.js'
export { Bee }

// for require-like imports
declare global {
  interface Window {
    BeeJs: {
      Bee: typeof import('./bee.js').Bee
      Stamper: typeof import('@ethersphere/core-sdk').Stamper
      Utils: typeof import('./utils/expose.js')
      Duration: typeof import('./utils/duration.js').Duration
      Size: typeof import('./utils/size.js').Size
      BeeError: typeof import('./utils/error.js').BeeError
      BeeArgumentError: typeof import('./utils/error.js').BeeArgumentError
      BeeResponseError: typeof import('./utils/error.js').BeeResponseError
      MantarayNode: typeof import('./manifest/manifest.js').MantarayNode
      ChunkSplitter: typeof import('@ethersphere/core-sdk').ChunkSplitter
      PrivateKey: typeof import('@ethersphere/core-sdk').PrivateKey
      PublicKey: typeof import('@ethersphere/core-sdk').PublicKey
      EthAddress: typeof import('@ethersphere/core-sdk').EthAddress
      Identifier: typeof import('@ethersphere/core-sdk').Identifier
      Reference: typeof import('@ethersphere/core-sdk').Reference
      TransactionId: typeof import('@ethersphere/core-sdk').TransactionId
      Span: typeof import('@ethersphere/core-sdk').Span
      PeerAddress: typeof import('@ethersphere/core-sdk').PeerAddress
      BatchId: typeof import('@ethersphere/core-sdk').BatchId
      Signature: typeof import('@ethersphere/core-sdk').Signature
      Topic: typeof import('@ethersphere/core-sdk').Topic
      FeedIndex: typeof import('@ethersphere/core-sdk').FeedIndex
    }
  }
}
