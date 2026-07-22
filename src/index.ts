import { Bee } from './bee'

export { ChunkBuilder, ChunkSplitter, Stamper } from 'swarm-core'
export type { Chunk } from './chunk/cac'
export type { SingleOwnerChunk } from './chunk/soc'
export { MantarayNode } from './manifest/manifest'
export { SUPPORTED_BEE_VERSION, SUPPORTED_BEE_VERSION_EXACT } from './version'
export * from './types'
export { Bytes } from './utils/bytes'
export * from './utils/constants'
export { Duration } from './utils/duration'
export * from './utils/error'
export * as Utils from './utils/expose'
export { Size } from './utils/size'
export * from './utils/tokens'
export * from './utils/typed-bytes'
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
