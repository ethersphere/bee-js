/* eslint-disable no-alert,no-console */
const BEE_URL = 'http://localhost:1633'

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

  const sendBtn = document.getElementById('send')
  const resultLink = document.getElementById('result')

  document.getElementById('form').addEventListener('submit', async e => {
    e.preventDefault() // Lets not submit the form

    try {
      sendBtn.disabled = true
      sendBtn.value = 'Uploading...'

      console.log('Creating signer')
      const signer = await BeeJs.Utils.Eth.createEthereumWalletSigner(window.ethereum)
      console.log(`Signer for address 0x${BeeJs.Utils.Hex.bytesToHex(signer.address)} created.`)

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
      const resultUrl = `${BEE_URL}/bzz/${await bee.createFeedManifest('sequence', topic, signer.address)}/index.html`
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
