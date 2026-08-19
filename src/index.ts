import { Bee } from './bee'

export {
  BatchId,
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
export type { SingleOwnerChunk } from './chunk/soc'
export { MantarayNode } from './manifest/manifest'
export { SUPPORTED_BEE_VERSION, SUPPORTED_BEE_VERSION_EXACT } from './version'
export * from './types'
export * from './utils/constants'
export { Duration } from './utils/duration'
export * from './utils/error'
export * as Utils from './utils/expose'
export { Size } from './utils/size'
export * from './utils/tokens'
export type { UploadProgress } from './utils/upload-progress'
export { Bee }

// for require-like imports
declare global {
  interface Window {
    // binded as 'BeeJs' via Webpack
    BeeJs: {
      Bee: typeof import('./bee').Bee
      Stamper: typeof import('@ethersphere/core-sdk').Stamper
      Utils: typeof import('./utils/expose')
      Duration: typeof import('./utils/duration').Duration
      Size: typeof import('./utils/size').Size
      BeeError: typeof import('./utils/error').BeeError
      BeeArgumentError: typeof import('./utils/error').BeeArgumentError
      BeeResponseError: typeof import('./utils/error').BeeResponseError
      MantarayNode: typeof import('./manifest/manifest').MantarayNode
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
