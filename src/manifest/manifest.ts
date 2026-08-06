import { Optional } from 'cafe-utility'
import { Bee, BeeRequestOptions, DownloadOptions, UploadOptions, UploadResult } from '..'
import { FeedPayloadResult } from '../api/feed'
import { Bytes } from '../utils/bytes'
import { BatchId, Reference } from '../utils/typed-bytes'
import { MantarayNode as CoreMantarayNode } from 'swarm-core'

/**
 * Uploads `node` and every node beneath it, updating each `selfAddress` in
 * place. Only the network/ACT-history side is bee-js specific - the trie
 * structure and marshaling live entirely in swarm-core's MantarayNode.
 */
async function saveRecursively(
  node: CoreMantarayNode,
  bee: Bee,
  postageBatchId: string | BatchId,
  options?: UploadOptions,
  requestOptions?: BeeRequestOptions,
): Promise<UploadResult> {
  for (const fork of node.forks.values()) {
    const uploadResult = await saveRecursively(fork.node, bee, postageBatchId, options, requestOptions)

    if (options?.act) {
      let historyAddress: Reference | undefined
      uploadResult.historyAddress.ifPresent(ref => (historyAddress = ref))

      if (historyAddress) {
        if (!fork.node.metadata) {
          fork.node.metadata = {}
        }
        fork.node.metadata['swarm-act-history-address'] = historyAddress.toHex()
      }
    }
  }
  const result = await bee.data.upload(postageBatchId, await node.marshal(), options, requestOptions)
  node.selfAddress = result.reference.toUint8Array()

  return result
}

/**
 * Downloads and unmarshals every node beneath `node`, following ACT history
 * metadata left by {@link saveRecursively} where present.
 */
async function loadRecursively(
  node: CoreMantarayNode,
  bee: Bee,
  options?: DownloadOptions,
  requestOptions?: BeeRequestOptions,
): Promise<void> {
  for (const fork of node.forks.values()) {
    if (!fork.node.selfAddress) {
      throw Error('MantarayNode#loadRecursively fork.node.selfAddress is not set')
    }

    let downloadOptions = options

    if (fork.node.metadata && fork.node.metadata['swarm-act-history-address']) {
      downloadOptions = {
        ...options,
        actHistoryAddress: fork.node.metadata['swarm-act-history-address'],
      }
    }

    const data = (await bee.data.download(fork.node.selfAddress, downloadOptions, requestOptions)).toUint8Array()
    const loaded = CoreMantarayNode.unmarshalFromData(data, fork.node.selfAddress)
    fork.node.targetAddress = loaded.targetAddress
    fork.node.forks = loaded.forks
    fork.node.path = fork.prefix
    fork.node.parent = node
    await loadRecursively(fork.node, bee, options, requestOptions)
  }
}

/**
 * bee-js's Bee-client-coupled view of a Mantaray node: the trie structure,
 * marshaling, and byte-level operations all delegate to swarm-core's
 * `MantarayNode`; this class only adds what needs a live `Bee` instance
 * (uploading/downloading, ACT history, feed resolution).
 */
export class MantarayNode {
  readonly core: CoreMantarayNode

  constructor(core: CoreMantarayNode = new CoreMantarayNode()) {
    this.core = core
  }

  get obfuscationKey(): Uint8Array {
    return this.core.obfuscationKey
  }

  get selfAddress(): Uint8Array | null {
    return this.core.selfAddress
  }

  get targetAddress(): Uint8Array {
    return this.core.targetAddress
  }

  get metadata(): Record<string, string> | undefined | null {
    return this.core.metadata
  }

  get path(): Uint8Array {
    return this.core.path
  }

  get forks(): Map<number, { prefix: Uint8Array; node: CoreMantarayNode }> {
    return this.core.forks
  }

  get parent(): CoreMantarayNode | null {
    return this.core.parent
  }

  get type(): number | null {
    return this.core.type
  }

  get fullPath(): Uint8Array {
    return this.core.fullPath
  }

  get fullPathString(): string {
    return this.core.fullPathString
  }

  /**
   * Returns the metadata at the `/` path to access idiomatic properties.
   */
  getRootMetadata(): Optional<Record<string, string>> {
    const node = this.core.find('/')

    if (node && node.metadata) {
      return Optional.of(node.metadata)
    }

    return Optional.empty()
  }

  /**
   * Returns the `swarm-index-document` and `swarm-error-document` metadata values.
   */
  getDocsMetadata(): {
    indexDocument: string | null
    errorDocument: string | null
  } {
    const node = this.core.find('/')

    if (!node || !node.metadata) {
      return { indexDocument: null, errorDocument: null }
    }

    return {
      indexDocument: node.metadata['website-index-document'] ?? null,
      errorDocument: node.metadata['website-error-document'] ?? null,
    }
  }

  /**
   * Attempts to resolve the manifest as a feed, returning the latest update.
   */
  async resolveFeed(bee: Bee, requestOptions?: BeeRequestOptions): Promise<Optional<FeedPayloadResult>> {
    const node = this.core.find('/')

    if (!node || !node.metadata) {
      return Optional.empty()
    }

    const owner = node.metadata['swarm-feed-owner']
    const topic = node.metadata['swarm-feed-topic']

    if (!owner || !topic) {
      return Optional.empty()
    }

    return Optional.of(await bee.feed.fetchLatestUpdate(topic, owner, requestOptions))
  }

  /**
   * Gets the binary representation of the node.
   */
  async marshal(): Promise<Uint8Array> {
    return this.core.marshal()
  }

  /**
   * Downloads and unmarshals a MantarayNode from the given reference.
   *
   * Do not forget calling `loadRecursively` on the returned node to load the entire tree.
   */
  static async unmarshal(
    bee: Bee,
    reference: Reference | Uint8Array | string,
    options?: DownloadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<MantarayNode> {
    reference = new Reference(reference)
    const data = (await bee.data.download(reference, options, requestOptions)).toUint8Array()

    return this.unmarshalFromData(data, reference.toUint8Array())
  }

  /**
   * Unmarshals a MantarayNode from the given data.
   *
   * Do not forget calling `loadRecursively` on the returned node to load the entire tree.
   */
  static unmarshalFromData(data: Uint8Array, selfAddress: Uint8Array): MantarayNode {
    return new MantarayNode(CoreMantarayNode.unmarshalFromData(data, selfAddress))
  }

  /**
   * Adds a fork to the node.
   */
  addFork(
    path: string | Uint8Array,
    reference: string | Uint8Array | Bytes | Reference,
    metadata?: Record<string, string> | null,
  ): void {
    this.core.addFork(path, reference instanceof Bytes ? reference.toUint8Array() : reference, metadata)
  }

  /**
   * Removes a fork from the node.
   */
  removeFork(path: string | Uint8Array): void {
    this.core.removeFork(path)
  }

  /**
   * Calculates the self address of the node.
   */
  async calculateSelfAddress(): Promise<Reference> {
    return this.core.calculateSelfAddress()
  }

  /**
   * Saves the node and its children recursively.
   */
  async saveRecursively(
    bee: Bee,
    postageBatchId: string | BatchId,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<UploadResult> {
    return saveRecursively(this.core, bee, postageBatchId, options, requestOptions)
  }

  /**
   * Loads the node and its children recursively.
   */
  async loadRecursively(bee: Bee, options?: DownloadOptions, requestOptions?: BeeRequestOptions): Promise<void> {
    return loadRecursively(this.core, bee, options, requestOptions)
  }

  /**
   * Finds a node in the tree by its path.
   */
  find(path: string | Uint8Array): CoreMantarayNode | null {
    return this.core.find(path)
  }

  /**
   * Finds the closest node in the tree to the given path.
   */
  findClosest(path: string | Uint8Array, current?: Uint8Array): [CoreMantarayNode, Uint8Array] {
    return this.core.findClosest(path, current)
  }

  /**
   * Returns an array of all nodes in the tree which have a target address set.
   *
   * Must be called after `loadRecursively`.
   */
  collect(nodes: CoreMantarayNode[] = []): CoreMantarayNode[] {
    return this.core.collect(nodes)
  }

  /**
   * Returns a path:reference map of all nodes in the tree which have a target address set.
   *
   * Must be called after `loadRecursively`.
   */
  collectAndMap(): Record<string, string> {
    return this.core.collectAndMap()
  }

  determineType(): number {
    return this.core.determineType()
  }
}
