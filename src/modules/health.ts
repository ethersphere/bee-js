import Emittery from 'emittery'
import { HealthEmitter, HealthEmitterData, HealthEmitterNonData } from '../types'
import { safeAxios } from '../utils/safeAxios'

/**
 * Ping the base bee URL. If connection was not successful throw error
 *
 * @param url Bee URL
 */
export async function health(url: string): Promise<void> | never {
  await safeAxios<string>({
    method: 'head',
    url: url,
    responseType: 'json',
  })
}

/**
 * Periodically ping the base bee URL
 * emit 'check' event each time the ping happens
 * emit 'error' with the Error as payload, if the endpoint is unreachable
 *
 * @param url        Bee URL
 * @param frequency  How frequently should the health endpoint be pinged
 */
export function healthSubscribe(url: string, frequency = 1000): HealthEmitter {
  const emitter = new Emittery.Typed<HealthEmitterData, HealthEmitterNonData>()
  const ref = setTimeout(async () => {
    try {
      await health(url)
      emitter.emit('check')
    } catch (e) {
      emitter.emit('error', e)
      clearTimeout(ref)
    }
  }, frequency)

  return emitter
}
