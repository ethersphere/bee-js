import { Binary, MerkleTree, Optional, Uint8ArrayReader } from 'cafe-utility'
import { Bee, BeeRequestOptions, DownloadOptions, NULL_ADDRESS, UploadOptions, UploadResult } from '..'
import { FeedPayloadResult } from '../modules/feed'
import { Bytes } from '../utils/bytes'
import { BatchId, Reference } from '../utils/typed-bytes'

const ENCODER = new TextEncoder()
const DECODER = new TextDecoder()

const TYPE_VALUE = 2
const TYPE_EDGE = 4
const TYPE_WITH_PATH_SEPARATOR = 8
const TYPE_WITH_METADATA = 16
const PATH_SEPARATOR = new Uint8Array([47])
const VERSION_02_HASH_HEX = '5768b3b6a7db56d21d1abff40d41cebfc83448fed8d7e9b06ec0d3b073f28f7b'
const VERSION_02_HASH = Binary.hexToUint8Array(VERSION_02_HASH_HEX)

export class Fork {
  prefix: Uint8Array
  node: MantarayNode

  constructor(prefix: Uint8Array, node: MantarayNode) {
    this.prefix = prefix
    this.node = node
  }

  static split(a: Fork, b: Fork): Fork {
    const commonPart = Binary.commonPrefix(a.prefix, b.prefix)

    if (commonPart.length === a.prefix.length) {
      const remainingB = b.prefix.slice(commonPart.length)
      b.node.path = b.prefix.slice(commonPart.length)
      b.prefix = b.prefix.slice(commonPart.length)
      b.node.parent = a.node
      a.node.forks.set(remainingB[0], b)
      return a
    }

    if (commonPart.length === b.prefix.length) {
      const remainingA = a.prefix.slice(commonPart.length)
      a.node.path = a.prefix.slice(commonPart.length)
      a.prefix = a.prefix.slice(commonPart.length)
      a.node.parent = b.node
      b.node.forks.set(remainingA[0], a)
      return b
    }

    const node = new MantarayNode({ path: commonPart })

    const newAFork = new Fork(a.prefix.slice(commonPart.length), a.node)
    const newBFork = new Fork(b.prefix.slice(commonPart.length), b.node)

    a.node.path = a.prefix.slice(commonPart.length)
    b.node.path = b.prefix.slice(commonPart.length)
    a.prefix = a.prefix.slice(commonPart.length)
    b.prefix = b.prefix.slice(commonPart.length)

    node.forks.set(newAFork.prefix[0], newAFork)
    node.forks.set(newBFork.prefix[0], newBFork)

    newAFork.node.parent = node
    newBFork.node.parent = node

    return new Fork(commonPart, node)
  }

  marshal(): Uint8Array {
    if (!this.node.selfAddress) {
      throw Error('Fork#marshal node.selfAddress is not set')
    }
    const data: Uint8Array[] = []
    data.push(new Uint8Array([this.node.determineType()]))
    data.push(Binary.numberToUint8(this.prefix.length))
    data.push(this.prefix)

    if (this.prefix.length < 30) {
      data.push(new Uint8Array(30 - this.prefix.length))
    }
    data.push(this.node.selfAddress)

    if (this.node.metadata) {
      const metadataBytes = Binary.padEndToMultiple(
        new Uint8Array([0x00, 0x00, ...ENCODER.encode(JSON.stringify(this.node.metadata))]),
        32,
        0x0a,
      )
      const metadataLengthBytes = Binary.numberToUint16(metadataBytes.length - 2, 'BE')
      metadataBytes.set(metadataLengthBytes, 0)
      data.push(metadataBytes)
    }

    return Binary.concatBytes(...data)
  }

  static unmarshal(reader: Uint8ArrayReader): Fork {
    const type = Binary.uint8ToNumber(reader.read(1))
    const prefixLength = Binary.uint8ToNumber(reader.read(1))
    const prefix = reader.read(prefixLength)
    reader.read(30 - prefixLength)
    const selfAddress = reader.read(32)
    let metadata: Record<string, string> | undefined = undefined

    if (isType(type, TYPE_WITH_METADATA)) {
      const metadataLength = Binary.uint16ToNumber(reader.read(2), 'BE')
      metadata = JSON.parse(DECODER.decode(reader.read(metadataLength)))
    }

    return new Fork(prefix, new MantarayNode({ selfAddress, metadata, path: prefix }))
  }
}

interface MantarayNodeOptions {
  selfAddress?: Uint8Array
  targetAddress?: Uint8Array
  obfuscationKey?: Uint8Array
  metadata?: Record<string, string> | null
  path?: Uint8Array | null
  parent?: MantarayNode | null
}

export class MantarayNode {
  public obfuscationKey: Uint8Array = new Uint8Array(32)
  public selfAddress: Uint8Array | null = null
  public targetAddress: Uint8Array = new Uint8Array(32)
  public metadata: Record<string, string> | undefined | null = null
  public path: Uint8Array = new Uint8Array(0)
  public forks: Map<number, Fork> = new Map()
  public parent: MantarayNode | null = null

  constructor(options?: MantarayNodeOptions) {
    if (options?.targetAddress) {
      this.targetAddress = options.targetAddress
    }

    if (options?.selfAddress) {
      this.selfAddress = options.selfAddress
    }

    if (options?.metadata) {
      this.metadata = options.metadata
    }

    if (options?.obfuscationKey) {
      this.obfuscationKey = options.obfuscationKey
    }

    if (options?.path) {
      this.path = options.path
    }

    if (options?.parent) {
      this.parent = options.parent
    }
  }

  get fullPath(): Uint8Array {
    return Binary.concatBytes(this.parent?.fullPath ?? new Uint8Array(0), this.path)
  }

  get fullPathString(): string {
    return DECODER.decode(this.fullPath)
  }

  /**
   * Returns the metadata at the `/` path to access idiomatic properties.
   */
  getRootMetadata(): Optional<Record<string, string>> {
    const node = this.find('/')

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
    const node = this.find('/')

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
    const node = this.find('/')

    if (!node || !node.metadata) {
      return Optional.empty()
    }

    const owner = node.metadata['swarm-feed-owner']
    const topic = node.metadata['swarm-feed-topic']

    if (!owner || !topic) {
      return Optional.empty()
    }

    return Optional.of(await bee.fetchLatestFeedUpdate(topic, owner, requestOptions))
  }

  /**
   * Gets the binary representation of the node.
   */
  async marshal(): Promise<Uint8Array> {
    for (const fork of this.forks.values()) {
      if (!fork.node.selfAddress) {
        fork.node.selfAddress = (await fork.node.calculateSelfAddress()).toUint8Array()
      }
    }
    const header = new Uint8Array(32)
    header.set(VERSION_02_HASH, 0)
    header.set(
      Binary.equals(this.targetAddress, NULL_ADDRESS) && Binary.equals(this.path, new Uint8Array([47]))
        ? Binary.numberToUint8(0)
        : Binary.numberToUint8(this.targetAddress.length),
      31,
    )
    const forkBitmap = new Uint8Array(32)
    for (const fork of this.forks.keys()) {
      Binary.setBit(forkBitmap, fork, 1, 'LE')
    }
    const forks: Uint8Array[] = []
    for (let i = 0; i < 256; i++) {
      if (Binary.getBit(forkBitmap, i, 'LE')) {
        forks.push(this.forks.get(i)!.marshal())
      }
    }
    const data = Binary.xorCypher(
      Binary.concatBytes(
        header,
        Binary.equals(this.targetAddress, NULL_ADDRESS) && Binary.equals(this.path, new Uint8Array([47]))
          ? new Uint8Array(0)
          : this.targetAddress,
        forkBitmap,
        ...forks,
      ),
      this.obfuscationKey,
    )

    return Binary.concatBytes(this.obfuscationKey, data)
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
    const data = (await bee.downloadData(reference, options, requestOptions)).toUint8Array()

    return this.unmarshalFromData(data, reference.toUint8Array())
  }

  /**
   * Unmarshals a MantarayNode from the given data.
   *
   * Do not forget calling `loadRecursively` on the returned node to load the entire tree.
   */
  static unmarshalFromData(data: Uint8Array, selfAddress: Uint8Array): MantarayNode {
    const obfuscationKey = data.subarray(0, 32)
    const decrypted = Binary.xorCypher(data.subarray(32), obfuscationKey)
    const reader = new Uint8ArrayReader(decrypted)
    const versionHash = reader.read(31)

    if (!Binary.equals(versionHash, VERSION_02_HASH.slice(0, 31))) {
      throw new Error('MantarayNode#unmarshal invalid version hash')
    }
    const targetAddressLength = Binary.uint8ToNumber(reader.read(1))
    const targetAddress = targetAddressLength === 0 ? NULL_ADDRESS : reader.read(targetAddressLength)
    const node = new MantarayNode({ selfAddress, targetAddress, obfuscationKey })
    const forkBitmap = reader.read(32)
    for (let i = 0; i < 256; i++) {
      if (Binary.getBit(forkBitmap, i, 'LE')) {
        const newFork = Fork.unmarshal(reader)
        node.forks.set(i, newFork)
        newFork.node.parent = node
      }
    }

    return node
  }

  /**
   * Adds a fork to the node.
   */
  addFork(
    path: string | Uint8Array,
    reference: string | Uint8Array | Bytes | Reference,
    metadata?: Record<string, string> | null,
  ) {
    this.selfAddress = null
    path = path instanceof Uint8Array ? path : ENCODER.encode(path)
    // TODO: this should not be ignored
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let tip: MantarayNode = this
    while (path.length) {
      const prefix = path.slice(0, 30)
      path = path.slice(30)
      const isLast = path.length === 0

      const [bestMatch, matchedPath] = tip.findClosest(prefix)
      const remainingPath = prefix.slice(matchedPath.length)

      if (matchedPath.length) {
        tip = bestMatch
      }

      if (!remainingPath.length) {
        continue
      }

      const newFork = new Fork(
        remainingPath,
        new MantarayNode({
          targetAddress: isLast ? new Reference(reference).toUint8Array() : undefined,
          metadata: isLast ? metadata : undefined,
          path: remainingPath,
        }),
      )

      const existing = bestMatch.forks.get(remainingPath[0])

      if (existing) {
        const fork = Fork.split(newFork, existing)
        tip.forks.set(remainingPath[0], fork)
        fork.node.parent = tip
        tip.selfAddress = null
        tip = newFork.node
      } else {
        tip.forks.set(remainingPath[0], newFork)
        newFork.node.parent = tip
        tip.selfAddress = null
        tip = newFork.node
      }
    }
  }

  /**
   * Removes a fork from the node.
   */
  removeFork(path: string | Uint8Array) {
    this.selfAddress = null
    path = path instanceof Uint8Array ? path : ENCODER.encode(path)

    if (path.length === 0) {
      throw Error('MantarayNode#removeFork [path] parameter cannot be empty')
    }

    const match = this.find(path)

    if (!match) {
      throw Error('MantarayNode#removeFork fork not found')
    }

    const [parent, matchedPath] = this.findClosest(path.slice(0, path.length - 1))

    parent.forks.delete(path.slice(matchedPath.length)[0])
    for (const fork of match.forks.values()) {
      parent.addFork(Binary.concatBytes(match.path, fork.prefix), fork.node.targetAddress, fork.node.metadata)
    }
  }

  /**
   * Calculates the self address of the node.
   */
  async calculateSelfAddress(): Promise<Reference> {
    if (this.selfAddress) {
      return new Reference(this.selfAddress)
    }

    return new Reference((await MerkleTree.root(await this.marshal())).hash())
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
    for (const fork of this.forks.values()) {
      await fork.node.saveRecursively(bee, postageBatchId, options, requestOptions)
    }
    const result = await bee.uploadData(postageBatchId, await this.marshal(), options, requestOptions)
    this.selfAddress = result.reference.toUint8Array()

    return result
  }

  /**
   * Loads the node and its children recursively.
   */
  async loadRecursively(bee: Bee, options?: DownloadOptions, requestOptions?: BeeRequestOptions): Promise<void> {
    for (const fork of this.forks.values()) {
      if (!fork.node.selfAddress) {
        throw Error('MantarayNode#loadRecursively fork.node.selfAddress is not set')
      }
      const node = await MantarayNode.unmarshal(bee, fork.node.selfAddress, options, requestOptions)
      fork.node.targetAddress = node.targetAddress
      fork.node.forks = node.forks
      fork.node.path = fork.prefix
      fork.node.parent = this
      await fork.node.loadRecursively(bee, options, requestOptions)
    }
  }

  /**
   * Finds a node in the tree by its path.
   */
  find(path: string | Uint8Array): MantarayNode | null {
    const [closest, match] = this.findClosest(path)

    return match.length === path.length ? closest : null
  }

  /**
   * Finds the closest node in the tree to the given path.
   */
  findClosest(path: string | Uint8Array, current: Uint8Array = new Uint8Array()): [MantarayNode, Uint8Array] {
    path = path instanceof Uint8Array ? path : ENCODER.encode(path)

    if (path.length === 0) {
      return [this, current]
    }

    const fork = this.forks.get(path[0])

    if (fork && Binary.commonPrefix(fork.prefix, path).length === fork.prefix.length) {
      return fork.node.findClosest(path.slice(fork.prefix.length), Binary.concatBytes(current, fork.prefix))
    }

    return [this, current]
  }

  /**
   * Returns an array of all nodes in the tree which have a target address set.
   *
   * Must be called after `loadRecursively`.
   */
  collect(nodes: MantarayNode[] = []): MantarayNode[] {
    for (const fork of this.forks.values()) {
      if (!Binary.equals(fork.node.targetAddress, NULL_ADDRESS)) {
        nodes.push(fork.node)
      }
      fork.node.collect(nodes)
    }

    return nodes
  }

  /**
   * Returns a path:reference map of all nodes in the tree which have a target address set.
   *
   * Must be called after `loadRecursively`.
   */
  collectAndMap(): Record<string, string> {
    const nodes = this.collect()
    const result: Record<string, string> = {}

    for (const node of nodes) {
      result[node.fullPathString] = new Reference(node.targetAddress).toHex()
    }

    return result
  }

  determineType() {
    let type = 0

    if (!Binary.equals(this.targetAddress, NULL_ADDRESS) || Binary.equals(this.path, PATH_SEPARATOR)) {
      type |= TYPE_VALUE
    }

    if (this.forks.size > 0) {
      type |= TYPE_EDGE
    }

    if (Binary.indexOf(this.path, PATH_SEPARATOR) !== -1 && !Binary.equals(this.path, PATH_SEPARATOR)) {
      type |= TYPE_WITH_PATH_SEPARATOR
    }

    if (this.metadata) {
      type |= TYPE_WITH_METADATA
    }

    return type
  }
}

function isType(value: number, type: number): boolean {
  return (value & type) === type
}
