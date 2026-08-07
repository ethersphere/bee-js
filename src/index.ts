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
} from 'swarm-core'
export type { Chunk } from './chunk/cac'
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
      Stamper: typeof import('swarm-core').Stamper
      Utils: typeof import('./utils/expose')
      Duration: typeof import('./utils/duration').Duration
      Size: typeof import('./utils/size').Size
      BeeError: typeof import('./utils/error').BeeError
      BeeArgumentError: typeof import('./utils/error').BeeArgumentError
      BeeResponseError: typeof import('./utils/error').BeeResponseError
      MantarayNode: typeof import('./manifest/manifest').MantarayNode
      ChunkSplitter: typeof import('swarm-core').ChunkSplitter
      PrivateKey: typeof import('swarm-core').PrivateKey
      PublicKey: typeof import('swarm-core').PublicKey
      EthAddress: typeof import('swarm-core').EthAddress
      Identifier: typeof import('swarm-core').Identifier
      Reference: typeof import('swarm-core').Reference
      TransactionId: typeof import('swarm-core').TransactionId
      Span: typeof import('swarm-core').Span
      PeerAddress: typeof import('swarm-core').PeerAddress
      BatchId: typeof import('swarm-core').BatchId
      Signature: typeof import('swarm-core').Signature
      Topic: typeof import('swarm-core').Topic
      FeedIndex: typeof import('swarm-core').FeedIndex
    }
  }
}
