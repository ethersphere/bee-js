import NodeWebSocket from 'ws'
import WebSocket from '../../src/utils/websocket'

test('uses the global WebSocket in browsers', () => {
  expect(WebSocket).toBe(globalThis.WebSocket)
})

test('does not bundle the ws package in browsers', () => {
  expect(WebSocket).not.toBe(NodeWebSocket)
})
