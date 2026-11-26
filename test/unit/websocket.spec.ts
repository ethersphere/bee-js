import NodeWebSocket from 'ws'
import WebSocket from '../../src/utils/websocket'

test('uses the ws package in Node so custom headers can be sent', () => {
  expect(WebSocket).toBe(NodeWebSocket)
})
