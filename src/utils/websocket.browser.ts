import type NodeWebSocket from 'ws'

export default globalThis.WebSocket as unknown as typeof NodeWebSocket
