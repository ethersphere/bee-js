import { downloadSingleOwnerChunk, uploadSingleOwnerChunkData } from '../chunk/soc'
import type { BeeRequestOptions, SOCReader, SOCWriter } from '../types'
import { EthAddress, PrivateKey } from '../utils/typed-bytes'
import type { BeeContext } from './context'

/**
 * Single owner chunk (SOC) reader/writer operations.
 *
 * Accessed as `bee.soc`.
 */
export class Soc {
  constructor(private readonly context: BeeContext) {}

  /**
   * Returns an object for reading single owner chunks.
   *
   * @param ownerAddress The ethereum address of the owner
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  makeReader(ownerAddress: EthAddress | Uint8Array | string, requestOptions?: BeeRequestOptions): SOCReader {
    const owner = new EthAddress(ownerAddress)

    return {
      owner,
      download: downloadSingleOwnerChunk.bind(null, this.context.getRequestOptionsForCall(requestOptions), owner),
    }
  }

  /**
   * Returns an object for reading and writing single owner chunks.
   *
   * @param signer The signer's private key. Falls back to the Bee instance signer.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  makeWriter(signer?: PrivateKey | Uint8Array | string, requestOptions?: BeeRequestOptions): SOCWriter {
    const key = signer ? new PrivateKey(signer) : this.context.signer

    if (!key) {
      throw Error('No signer provided')
    }

    return {
      ...this.makeReader(key.publicKey().address(), requestOptions),
      upload: uploadSingleOwnerChunkData.bind(null, this.context.getRequestOptionsForCall(requestOptions), key),
    }
  }
}
