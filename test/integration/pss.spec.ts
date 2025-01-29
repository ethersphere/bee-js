import { Dates, Strings } from 'cafe-utility'
import { Utils } from '../../src'
import { Topic } from '../../src/utils/typed-bytes'
import { batch, makeBee } from '../utils'

const bee = makeBee()

test('pss', async () => {
  const addresses = await bee.getNodeAddresses()
  const prefix = Utils.makeMaxTarget(addresses.overlay)
  const topic = Topic.fromString(Strings.randomAlphanumeric(50))
  const receivePromise = bee.pssReceive(topic, Dates.seconds(30))
  await bee.pssSend(batch(), topic, prefix, 'BZZ')
  const received = await receivePromise
  expect(received.toUtf8()).toBe('BZZ')
})
