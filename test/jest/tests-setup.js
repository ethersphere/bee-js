import fetch, { Request, Headers } from 'node-fetch'

globalThis.fetch = fetch
globalThis.Request = Request
globalThis.Headers = Headers
