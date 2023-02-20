/* eslint-disable no-console */
import { createPostageBatch, getPostageBatch } from '../src/modules/debug/stamps'
import { BatchId } from '../src'

// @ts-ignore: Needed TS otherwise complains about importing ESM package in CJS even though they are just typings
import type { Options as KyOptions } from 'ky'
import chai, { Assertion } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiParentheses from 'chai-parentheses'
import sinonChai from 'sinon-chai'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Chai {
    interface Assertion {
      /**
       * Checks if given input is numeric string
       */
      numberString: Assertion
    }
  }
}

export async function mochaGlobalSetup(): Promise<void> {
  chai.use(chaiAsPromised)
  chai.use(chaiParentheses)
  chai.use(sinonChai)

  Assertion.addMethod('numberString', function () {
    new Assertion(this._obj).to.be.a('string')
    new Assertion(this._obj).to.match(/^-?(0|[1-9][0-9]*)$/g)
  })

  try {
    const beeDebugKyOptions: KyOptions = {
      prefixUrl: process.env.BEE_DEBUG_API_URL || 'http://127.0.0.1:1635/',
      timeout: false,
    }
    const beeDebugPeerKyOptions: KyOptions = {
      prefixUrl: process.env.BEE_PEER_DEBUG_API_URL || 'http://127.0.0.1:11635/',
      timeout: false,
    }

    if (process.env.BEE_POSTAGE) {
      try {
        if (!(await getPostageBatch(beeDebugKyOptions, process.env.BEE_POSTAGE as BatchId)).usable) {
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
        if (!(await getPostageBatch(beeDebugPeerKyOptions, process.env.BEE_PEER_POSTAGE as BatchId)).usable) {
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

      const stampsOrder: { kyOptions: KyOptions; env: string }[] = []

      if (!process.env.BEE_POSTAGE) {
        stampsOrder.push({ kyOptions: beeDebugKyOptions, env: 'BEE_POSTAGE' })
      }

      if (!process.env.BEE_PEER_POSTAGE) {
        stampsOrder.push({ kyOptions: beeDebugPeerKyOptions, env: 'BEE_PEER_POSTAGE' })
      }

      const stamps = await Promise.all(stampsOrder.map(async order => createPostageBatch(order.kyOptions, '100', 20)))

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
            if (!(await getPostageBatch(stampsOrder[i].kyOptions, stamps[i] as BatchId)).usable) {
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
