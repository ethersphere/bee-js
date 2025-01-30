import { Binary, MerkleTree, Uint8ArrayReader } from 'cafe-utility'
import { Bee, BeeRequestOptions, NULL_ADDRESS, UploadOptions } from '..'
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
    const node = new MantarayNode({ path: commonPart })

    const newAFork = new Fork(a.prefix.slice(commonPart.length), a.node)
    const newBFork = new Fork(b.prefix.slice(commonPart.length), b.node)

    a.node.path = a.prefix.slice(commonPart.length)
    b.node.path = b.prefix.slice(commonPart.length)
    a.prefix = a.prefix.slice(commonPart.length)
    b.prefix = b.prefix.slice(commonPart.length)

    node.forks.set(newAFork.prefix[0], newAFork)
    node.forks.set(newBFork.prefix[0], newBFork)

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
    const targetAddress = reader.read(32)
    let metadata: Record<string, string> | undefined = undefined

    if (isType(type, TYPE_WITH_METADATA)) {
      const metadataLength = Binary.uint16ToNumber(reader.read(2), 'BE')
      metadata = JSON.parse(DECODER.decode(reader.read(metadataLength)))
    }

    return new Fork(prefix, new MantarayNode({ targetAddress, metadata, path: prefix }))
  }
}

interface MantarayNodeOptions {
  selfAddress?: Uint8Array
  targetAddress?: Uint8Array
  obfuscationKey?: Uint8Array
  metadata?: Record<string, string> | null
  path?: Uint8Array | null
}

export class MantarayNode {
  public obfuscationKey: Uint8Array = new Uint8Array(32)
  public selfAddress: Uint8Array | null = null
  public targetAddress: Uint8Array = new Uint8Array(32)
  public metadata: Record<string, string> | undefined | null = null
  public path: Uint8Array = new Uint8Array(0)
  public forks: Map<number, Fork> = new Map()

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
  }

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

  static async unmarshal(bee: Bee, reference: Reference | Uint8Array | string): Promise<MantarayNode> {
    const data = (await bee.downloadData(reference)).toUint8Array()
    const obfuscationKey = data.subarray(0, 32)
    const decrypted = Binary.xorCypher(data.subarray(32), obfuscationKey)
    const reader = new Uint8ArrayReader(decrypted)
    const versionHash = reader.read(31)

    if (!Binary.equals(versionHash, VERSION_02_HASH.slice(0, 31))) {
      throw new Error('MantarayNode#unmarshal invalid version hash')
    }
    const targetAddressLength = Binary.uint8ToNumber(reader.read(1))
    const targetAddress = targetAddressLength === 0 ? NULL_ADDRESS : reader.read(targetAddressLength)
    const node = new MantarayNode({ targetAddress, obfuscationKey })
    const forkBitmap = reader.read(32)
    for (let i = 0; i < 256; i++) {
      if (Binary.getBit(forkBitmap, i, 'LE')) {
        node.forks.set(i, Fork.unmarshal(reader))
      }
    }

    return node
  }

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
        tip.selfAddress = null
        tip = newFork.node
      } else {
        tip.forks.set(remainingPath[0], newFork)
        tip.selfAddress = null
        tip = newFork.node
      }
    }
  }

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

  async calculateSelfAddress(): Promise<Reference> {
    if (this.selfAddress) {
      return new Reference(this.selfAddress)
    }

    return new Reference((await MerkleTree.root(await this.marshal())).hash())
  }

  async saveRecursively(
    bee: Bee,
    postageBatchId: string | BatchId,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ): Promise<Reference> {
    for (const fork of this.forks.values()) {
      await fork.node.saveRecursively(bee, postageBatchId, options, requestOptions)
    }
    const result = await bee.uploadData(postageBatchId, await this.marshal(), options, requestOptions)
    this.selfAddress = result.reference.toUint8Array()

    return new Reference(this.selfAddress)
  }

  async loadRecursively(bee: Bee): Promise<void> {
    for (const fork of this.forks.values()) {
      const node = await MantarayNode.unmarshal(bee, fork.node.targetAddress)
      fork.node.targetAddress = node.targetAddress
      fork.node.forks = node.forks
      fork.node.path = fork.prefix
      await fork.node.loadRecursively(bee)
    }
  }

  find(path: string | Uint8Array): MantarayNode | null {
    const [closest, match] = this.findClosest(path)

    return match.length === path.length ? closest : null
  }

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

  collect(nodes: MantarayNode[] = []): MantarayNode[] {
    for (const fork of this.forks.values()) {
      if (!Binary.equals(fork.node.targetAddress, NULL_ADDRESS)) {
        nodes.push(fork.node)
      }
      fork.node.collect(nodes)
    }

    return nodes
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
