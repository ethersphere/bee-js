const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// jsdom does not expose the Node 18+ built-in Response. Provide a minimal
// polyfill — only arrayBuffer() is used by the code under test.
// jsdom's Blob also lacks arrayBuffer(), so fall back to FileReader which
// jsdom does implement.
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body) {
      this._body = body
    }
    async arrayBuffer() {
      if (typeof this._body.arrayBuffer === 'function') {
        return this._body.arrayBuffer()
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsArrayBuffer(this._body)
      })
    }
  }
}
