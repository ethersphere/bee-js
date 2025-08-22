import { Dates, System } from 'cafe-utility'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { Bee, NULL_IDENTIFIER, NULL_TOPIC } from '../../src'

interface HandledEvents {
  message: any[]
  error: any[]
  close: any[]
}

test('pss onClose handler', async () => {
  const events: HandledEvents = {
    message: [],
    error: [],
    close: [],
  }
  const bee = new Bee('http://localhost:8081')

  const httpServer = createServer()
  const socketServer = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (request, socket, head) => {
    socketServer.handleUpgrade(request, socket, head, ws => {
      socketServer.emit('connection', ws, request)
    })
  })

  httpServer.listen(8081)

  bee.pssSubscribe(NULL_TOPIC, {
    onMessage: event => {
      events.message.push(event)
    },
    onError: error => {
      events.error.push(error)
    },
    onClose: () => {
      events.close.push('closed')
    },
  })

  await System.waitFor(async () => socketServer.clients.size === 1, {
    attempts: 10,
    waitMillis: Dates.seconds(1),
  })

  socketServer.clients.forEach(client => client.close())
  socketServer.close()
  httpServer.close()

  await System.waitFor(async () => events.close.length > 0, {
    attempts: 60,
    waitMillis: Dates.seconds(1),
  })

  expect(events.message.length).toBe(0)
  expect(events.error.length).toBe(0)
})

test('gsoc onClose handler', async () => {
  const events: HandledEvents = {
    message: [],
    error: [],
    close: [],
  }
  const bee = new Bee('http://localhost:8082')

  const httpServer = createServer()
  const socketServer = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (request, socket, head) => {
    socketServer.handleUpgrade(request, socket, head, ws => {
      socketServer.emit('connection', ws, request)
    })
  })

  httpServer.listen(8082)

  bee.gsocSubscribe('0x0123401234012340123401234012340123401234', NULL_IDENTIFIER, {
    onMessage: event => {
      events.message.push(event)
    },
    onError: error => {
      events.error.push(error)
    },
    onClose: () => {
      events.close.push('closed')
    },
  })

  await System.waitFor(async () => socketServer.clients.size === 1, {
    attempts: 10,
    waitMillis: Dates.seconds(1),
  })

  socketServer.clients.forEach(client => client.close())
  socketServer.close()
  httpServer.close()

  await System.waitFor(async () => events.close.length > 0, {
    attempts: 60,
    waitMillis: Dates.seconds(1),
  })

  expect(events.message.length).toBe(0)
  expect(events.error.length).toBe(0)
})
