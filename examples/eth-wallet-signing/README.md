# Eth Wallet as a Signer

This example demonstrates how to use Ethereum browser wallets like Metamask or Nifty as a signers for Feeds.

### Prerequisites

 - Node and NPM
 - browser with Ethereum compatible wallet like Metamask or Nifty
 - Bee instance running with API port on 1633 and having flag `--cors-allowed-origins="*"`

### Steps:

1. Run `npm install` and `npm start`
1. In opened page click on `Connect Eth Wallet` and authenticate the site in the wallet
1. Put some message, topic and hit the "Sign and upload!" button
1. Authenticate the message with your wallet  **For your own safety use an account without any real funds!!!**
1. Open the created link and see your message
1. Now put some other message and upload it and refresh the page to see the content changed under the same URL

**Be aware! The wallets won't be injected into files served using `file://` in browsers! Load `src/index.html` with the development server which is run with the `npm start`!**

### Code

*Tip! Checkout the browser console to see the steps the example is doing!*

The interesting code parts are found in `src/index.js` file, but the most important part on how to create
a custom Signer that uses Ethereum wallet:

```js
/**
 * Function that returns Signer instance
 * The Signer.sign() function has to be compatible with the Ethereum `personal_sign` call that
 * prefixes the signing data with `\x19Ethereum Signed Message:\n${data.length}`.
 * If your signing method does not do that, you have to do it manually!
 *
 * @param address [string] - Hex address prefixed with 0x of the account that will sign the data
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
```
