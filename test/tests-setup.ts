/* eslint-disable no-console */
import ky from 'ky-universal'
import { createPostageBatch, getPostageBatch } from '../src/modules/debug/stamps'
import { BatchId, Ky } from '../src'

export default async function testsSetup(): Promise<void> {
  try {
    const beeDebugKy = ky.create({
      prefixUrl: process.env.BEE_DEBUG_API_URL || 'http://127.0.0.1:1635',
      timeout: false,
    })
    const beeDebugPeerKy = ky.create({
      prefixUrl: process.env.BEE_PEER_DEBUG_API_URL || 'http://127.0.0.1:11635',
      timeout: false,
    })

    if (process.env.BEE_POSTAGE) {
      try {
        if (!(await getPostageBatch(beeDebugKy, process.env.BEE_POSTAGE as BatchId)).usable) {
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
        if (!(await getPostageBatch(beeDebugPeerKy, process.env.BEE_PEER_POSTAGE as BatchId)).usable) {
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

      const stampsOrder: { ky: Ky; env: string }[] = []

      if (!process.env.BEE_POSTAGE) {
        stampsOrder.push({ ky: beeDebugKy, env: 'BEE_POSTAGE' })
      }

      if (!process.env.BEE_PEER_POSTAGE) {
        stampsOrder.push({ ky: beeDebugPeerKy, env: 'BEE_PEER_POSTAGE' })
      }

      const stamps = await Promise.all(stampsOrder.map(async order => createPostageBatch(order.ky, '1', 20)))

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
            if (!(await getPostageBatch(stampsOrder[i].ky, stamps[i] as BatchId)).usable) {
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
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1_000))
      } while (!allUsable)
      console.log('Usable, yey!')
    }
  } catch (e) {
    // It is possible that for unit tests the Bee nodes does not run
    // so we are only logging errors and not leaving them to propagate
    console.error(e)
  }
}
