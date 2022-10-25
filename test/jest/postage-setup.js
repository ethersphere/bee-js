/* eslint-disable no-console */
import fetch from 'node-fetch'

const STAMPS_ENDPOINT = 'stamps'

async function http(url, config) {
  const response = await fetch(url, config)

  return await response.json()
}

async function getPostageBatch(url, postageBatchId) {
  return await http(`${url}/${STAMPS_ENDPOINT}/${postageBatchId}`, {
    method: 'get',
  })
}

async function createPostageBatch(url, amount, depth) {
  const response = await http(`${url}/${STAMPS_ENDPOINT}/${amount}/${depth}`, {
    method: 'post',
  })

  return response.batchID
}

export default async function postageSetup() {
  const beeDebugUrl = process.env.BEE_DEBUG_API_URL || 'http://127.0.0.1:1635'
  const beeDebugPeerUrl = process.env.BEE_PEER_DEBUG_API_URL || 'http://127.0.0.1:11635'

  try {
    if (process.env.BEE_POSTAGE) {
      try {
        if (!(await getPostageBatch(beeDebugUrl, process.env.BEE_POSTAGE)).usable) {
          delete process.env.BEE_POSTAGE
          console.log('BEE_POSTAGE stamp was found but is not usable')
        } else {
          console.log('Using configured BEE_POSTAGE stamp.')
        }
      } catch (e) {
        delete process.env.BEE_POSTAGE
        console.log('BEE_POSTAGE stamp was not found')
      }
    }

    if (process.env.BEE_PEER_POSTAGE) {
      try {
        if (!(await getPostageBatch(beeDebugPeerUrl, process.env.BEE_PEER_POSTAGE)).usable) {
          delete process.env.BEE_PEER_POSTAGE
          console.log('BEE_PEER_POSTAGE stamp was found but is not usable')
        } else {
          console.log('Using configured BEE_PEER_POSTAGE stamp.')
        }
      } catch (e) {
        delete process.env.BEE_PEER_POSTAGE
        console.log('BEE_PEER_POSTAGE stamp was not found')
      }
    }

    if (!process.env.BEE_POSTAGE || !process.env.BEE_PEER_POSTAGE) {
      console.log('Creating postage stamps...')

      const stampsOrder = []

      if (!process.env.BEE_POSTAGE) {
        stampsOrder.push({ url: beeDebugUrl, env: 'BEE_POSTAGE' })
      }

      if (!process.env.BEE_PEER_POSTAGE) {
        stampsOrder.push({ url: beeDebugPeerUrl, env: 'BEE_PEER_POSTAGE' })
      }

      const stamps = await Promise.all(stampsOrder.map(async order => createPostageBatch(order.url, '1', 20)))

      for (let i = 0; i < stamps.length; i++) {
        process.env[stampsOrder[i].env] = stamps[i]
        console.log(`${stampsOrder[i].env}: ${stamps[i]}`)
      }

      console.log('Waiting for the stamps to be usable')
      let allUsable = true
      do {
        for (let i = 0; i < stamps.length; i++) {
          // eslint-disable-next-line max-depth
          try {
            // eslint-disable-next-line max-depth
            if (!(await getPostageBatch(stampsOrder[i].url, stamps[i])).usable) {
              allUsable = false
              break
            } else {
              allUsable = true
            }
          } catch (e) {
            allUsable = false
            break
          }
        }

        // eslint-disable-next-line no-loop-func
        await new Promise(resolve => setTimeout(() => resolve(), 1_000))
      } while (!allUsable)
      console.log('Usable, yey!')
    }
  } catch (e) {
    // It is possible that for unit tests the Bee nodes does not run
    // so we are only logging errors and not leaving them to propagate
    console.error(e)
  }
}
