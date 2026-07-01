import {
  Bee,
  Bytes,
  BZZ,
  DAI,
  EthAddress,
  FeedIndex,
  Identifier,
  MantarayNode,
  MerkleTree,
  NULL_IDENTIFIER,
  PrivateKey,
  PublicKey,
  Reference,
  Span,
  Topic,
  Utils,
} from './src'

main()

async function main() {
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                   TOKENS
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  {
    const bzz = BZZ.fromDecimalString('1.51')
    console.log(bzz.toPLURString())
    // 15100000000000000
  }

  {
    const dai = DAI.fromWei(14349652349855834010n)
    console.log(dai.toDecimalString())
    // 14.349652349855834010
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                   ELLIPTIC
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  {
    const signer = new PrivateKey('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
    const message = 'Hello world!'
    const signature = signer.sign(message)
    const recovered = signature.recoverPublicKey(message)
    const address = recovered.address()
    console.log(address.toHex(), '==', signer.publicKey().address().toHex())
    // fcad0b19bb29d4674531d6f115237e16afce377c == fcad0b19bb29d4674531d6f115237e16afce377c
  }

  {
    const privateKey = new PrivateKey('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
    const publicKey = privateKey.publicKey()
    console.log(publicKey.toCompressedHex())
    // 034646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8fff
  }

  {
    const publicKey = new PublicKey('034646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8fff')
    const address = publicKey.address()
    console.log(address.toChecksum())
    // 0xFCAd0B19bB29D4674531d6f115237E16AfCE377c
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                    BYTES
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  {
    console.log(Bytes.keccak256(Bytes.fromUtf8('hello')).toHex())
    // 1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8
  }

  {
    const reference = new Reference('f69f6bf21e4e97abef7fb52239265373479f14309d70f98f81a335936dd21d8b')
    console.log(reference.toCid('feed'))
    // bah5qcgza62pwx4q6j2l2x337wurdsjstondz6fbqtvyptd4bum2zg3osdwfq
  }

  {
    console.log(Span.LENGTH, FeedIndex.LENGTH, Identifier.LENGTH, EthAddress.LENGTH)
    // 8 8 32 20
  }

  {
    console.log(Topic.fromString('human readable').toHex())
    // 648198b984056286aef8399dfa219578a6e04eb16030c278e783320606ce2404
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                    MANTARAY
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  if (0) {
    const mantaray = new MantarayNode()
    mantaray.addFork('foo', '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
    mantaray.addFork('foobar', '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')

    const values = mantaray.collect().map(x => x.fullPathString)

    console.log(values)
    // [ 'foo', 'foobar' ]
  }

  if (0) {
    const bee = new Bee('http://localhost:1633')
    const node = await MantarayNode.unmarshal(bee, '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
    await node.loadRecursively(bee)
    node.removeFork('unwanted-path')
    const newManifestAddress = await node.saveRecursively(
      bee,
      '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    )
    console.log(newManifestAddress.reference.toHex())
    // 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef (dummy)
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                 CAC / SOC
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  if (0) {
    const bee = new Bee('http://localhost:1633')
    const stamp = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

    const data = Bytes.fromUtf8('hello')
    const span = Span.fromBigInt(BigInt(data.length))

    // TODO: this is clumsy
    const result = await bee.uploadChunk(stamp, new Uint8Array([...span.toUint8Array(), ...data.toUint8Array()]))

    console.log(result.reference.toHex())
    // 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef (dummy)
  }

  if (0) {
    const bee = new Bee('http://localhost:1633')
    const stamp = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

    const signer = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const identifier = NULL_IDENTIFIER

    const socWriter = bee.makeSOCWriter(signer)

    const result = await socWriter.upload(stamp, identifier, Bytes.fromUtf8('soc payload').toUint8Array())
    console.log(result.reference.toHex())
    // 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef (dummy)
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                 MERKLE TREE
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  {
    const tree = new MerkleTree(async chunk => {
      console.log('span:', chunk.span)
      console.log('reference:', new Bytes(chunk.hash()).toHex())
    })

    tree.append(Bytes.fromUtf8('hello').toUint8Array())
    tree.append(Bytes.fromUtf8('world').toUint8Array())

    const rootChunk = await tree.finalize()

    console.log('root:', new Bytes(rootChunk.hash()).toHex())
    // span: 10n
    // reference: c3d78c959eb23a464619e893358a1d90e467f37c72742985ccc89159350098b4
    // root: c3d78c959eb23a464619e893358a1d90e467f37c72742985ccc89159350098b4
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                     PSS
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  // receiver
  {
    const bee = new Bee('http://localhost:1633')

    bee.pssSubscribe(Topic.fromString('Alice <> Bob private chat'), {
      onMessage: message => {
        console.log(message.toUtf8())
      },
      onError: error => {
        console.error(error)
      },
      onClose: () => {
        console.log('subscription closed')
      },
    })
  }

  // sender
  {
    const bee = new Bee('http://localhost:1633')
    const stamp = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const topic = Topic.fromString('Alice <> Bob private chat')
    const overlay = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

    const target = Utils.makeMaxTarget(overlay)

    await bee.pssSend(stamp, topic, target, Bytes.fromUtf8('Hello, Bob!').toUint8Array())
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                     GSOC
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  {
    const bee = new Bee('http://localhost:1633')
    const overlay = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const identifier = NULL_IDENTIFIER

    const signer = bee.gsocMine(overlay, identifier)
    console.log(signer.toHex())
    // 000000000000000000000000000000000000000000000000000000000000bd72
  }

  // receiver
  if (0) {
    const bee = new Bee('http://localhost:1633')
    const signer = new PrivateKey('000000000000000000000000000000000000000000000000000000000000bd72')
    const identifier = NULL_IDENTIFIER

    bee.gsocSubscribe(signer.publicKey().address(), identifier, {
      onMessage: message => {
        console.log(message.toUtf8())
      },
      onError: error => {
        console.error(error)
      },
      onClose: () => {
        console.log('subscription closed')
      },
    })
  }

  // sender
  if (0) {
    const bee = new Bee('http://localhost:1633')
    const signer = new PrivateKey('000000000000000000000000000000000000000000000000000000000000bd72')
    const identifier = NULL_IDENTIFIER
    const stamp = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

    await bee.gsocSend(stamp, signer, identifier, 'GSOC!')
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                 API / SEMVER
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  if (0) {
    const bee = new Bee('http://localhost:1633')
    console.log(await bee.isSupportedExactVersion())
    // true
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
                  FEED
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  if (0) {
    const bee = new Bee('http://localhost:1633')
    const stamp = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const topic = Topic.fromString('Alice <> Bob private chat')
    const signer = new PrivateKey('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')

    const feedWriter = bee.makeFeedWriter(topic, signer)
    const { reference } = await bee.uploadData(stamp, 'First update')
    feedWriter.upload(stamp, reference)
  }

  if (0) {
    const bee = new Bee('http://localhost:1633')
    const stamp = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const topic = Topic.fromString('Alice <> Bob private chat')
    const signer = new PrivateKey('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')

    bee.createFeedManifest(stamp, topic, signer.publicKey().address())
  }
}
