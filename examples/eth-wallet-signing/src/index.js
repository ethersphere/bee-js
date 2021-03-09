/* eslint-disable no-alert,no-console */
const BEE_URL = 'http://localhost:1633'

/**
 * Function that returns Signer instance.
 * The Signer.sign() function has to be compatible with the Ethereum `personal_sign` call that
 * prefixes the signing data with `\x19Ethereum Signed Message:\n${data.length}`.
 * If your signing method does not do that, you have to do it manually!
 *
 * @param address - Hex address prefixed with 0x of the account that will sign the data
 * @returns Signer instance
 */
function createSigner(address) {
  return {
    address: BeeJs.Utils.Hex.hexToBytes(address),
    sign: async data => {
      // Convert bytes into prefixed hex string
      data = BeeJs.Utils.Hex.bytesToHex(data, true)
      console.log('Signing data: ', data)

      // Request the Eth wallet for signature
      const result = await window.ethereum.request({
        jsonrpc: '2.0',
        method: 'personal_sign',
        params: [address, data],
      })

      // We need to convert the signature to bytes
      return BeeJs.Utils.Hex.hexToBytes(result)
    },
  }
}

/**
 * The `/bzz` endpoint accepts only Manifest/Collection so we have to build one.
 *
 * @param message
 * @param bee
 * @returns {Promise<Reference>}
 */
function createDummyCollection(message, bee) {
  const blob = new Blob([`<h1>${message}</h1>`], { type: 'text/html' })
  const file = new File([blob], 'index.html', { type: 'text/html' })

  return bee.uploadFiles([file])
}

function main() {
  if (typeof window.ethereum === 'undefined') {
    alert('Metamask is not installed or enabled!')

    // We don't want nothing with browsers that does not have Eth Wallet!
    return
  }
  const bee = new BeeJs.Bee(BEE_URL)

  let signer, address
  const sendBtn = document.getElementById('send')
  const connectBtn = document.getElementById('connect')
  const resultLink = document.getElementById('result')

  connectBtn.addEventListener('click', async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      address = accounts[0]
      signer = createSigner(address)

      connectBtn.disabled = true
      sendBtn.disabled = false
    } catch (e) {
      alert(`There was error while connecting to Wallet!\n${e}`)
      throw e
    }
  })

  document.getElementById('form').addEventListener('submit', async e => {
    e.preventDefault() // Lets not submit the form

    if (!signer || !address) {
      alert('Signer not instantiated! Have you connect wallet?')
      throw new Error('No Signer or Address')
    }

    try {
      sendBtn.disabled = true
      sendBtn.value = 'Uploading...'

      console.log('Uploading using address: ' + address)

      // Upload the data as normal content addressed chunk
      console.log('Uploading data as regular chunk')
      const data = document.getElementById('data').value
      const dataHash = await createDummyCollection(data, bee)

      // Now write the chunk's hash to the feed
      const rawTopic = document.getElementById('topic').value
      const topic = bee.makeFeedTopic(rawTopic)
      console.log(`Hashed topic for ${rawTopic}: ${topic}`)
      const writer = bee.makeFeedWriter('sequence', topic, signer)
      console.log('Writing to Feed')
      const result = await writer.upload(dataHash)
      console.log('Feed write result hash: ', result.reference)

      console.log('Verifying the Feed with re-download')
      const feedVerification = await writer.download()
      console.log('Verification result: ', feedVerification.reference === dataHash)

      // Lets create chunk hash for manifest that can be used with the BZZ endpoint
      const resultUrl = `${BEE_URL}/bzz/${await bee.createFeedManifest(
        'sequence',
        topic,
        BeeJs.Utils.Hex.hexToBytes(address),
      )}/index.html`
      console.log('Feed Manifest URL: ' + resultUrl)

      resultLink.href = resultUrl
      resultLink.innerHTML = `Manifest URL: ${resultUrl}`
    } finally {
      sendBtn.disabled = false
      sendBtn.value = 'Sign and upload!'
    }
  })
}

main()
