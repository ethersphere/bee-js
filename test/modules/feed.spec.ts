import { createInitialFeed, findFeedUpdate } from '../../src/modules/feed'
import { bytesToHex, HexString, hexToBytes, stripHexPrefix } from '../../src/utils/hex'
import { beeUrl, testIdentity } from '../utils'
import { ChunkReference, makeSequentialFeedIdentifier, uploadFeedUpdate } from '../../src/feed'
import { Bytes } from '../../src/utils/bytes'
import { makeDefaultSigner, PrivateKey } from '../../src/chunk/signer'
import { makeContentAddressedChunk } from '../../src/chunk/cac'
import * as chunkAPI from '../../src/modules/chunk'
import { keccak256Hash } from '../../src/chunk/hash'

function makeChunk(index: number) {
  return makeContentAddressedChunk(new Uint8Array([index]))
}

async function uploadChunk(url: string, index: number): Promise<ChunkReference> {
  const chunk = makeChunk(index)
  const referenceResponse = await chunkAPI.upload(url, chunk.data)

  return hexToBytes(referenceResponse.reference as HexString) as ChunkReference
}

describe('modules/feed', () => {
  const url = beeUrl()
  const owner = stripHexPrefix(testIdentity.address)
  const signer = makeDefaultSigner(hexToBytes(testIdentity.privateKey) as PrivateKey)
  const topic = '0000000000000000000000000000000000000000000000000000000000000000' as HexString

  test('feed manifest creation', async () => {
    const reference = '92442c3e08a308aeba8e2d231733ec57011a203354cad24129e7e0c37bac0cbe'
    const response = await createInitialFeed(url, owner, topic)

    expect(response).toEqual({ reference })
  })

  test.skip('empty feed update', async () => {
    const emptyTopic = '1000000000000000000000000000000000000000000000000000000000000000'
    const feedUpdate = findFeedUpdate(url, owner, emptyTopic)

    await expect(feedUpdate).rejects.toThrow('Not Found')
  }, 15000)

  test('feed update', async () => {
    const topicBytes = hexToBytes(topic) as Bytes<32>
    const identifier = makeSequentialFeedIdentifier(topicBytes, 0)

    const uploadedChunks: ChunkReference[] = []
    uploadedChunks[0] = await uploadChunk(url, 0)

    const feedRef = await uploadFeedUpdate(url, identifier, signer, uploadedChunks[0])
    console.debug({feedRef})

    const feedUpdate = await findFeedUpdate(url, owner, topic)

    console.debug({feedRef, feedUpdate})
  }, 15000)
})
