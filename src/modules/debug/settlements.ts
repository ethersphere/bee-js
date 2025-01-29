import { Types } from 'cafe-utility'
import type { AllSettlements, BeeRequestOptions, Settlements } from '../../types'
import { http } from '../../utils/http'
import { asNumberString } from '../../utils/type'
import { PeerAddress } from '../../utils/typed-bytes'

const settlementsEndpoint = 'settlements'

/**
 * Get amount of sent and received from settlements with a peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getSettlements(requestOptions: BeeRequestOptions, peer: PeerAddress): Promise<Settlements> {
  const response = await http<unknown>(requestOptions, {
    url: `${settlementsEndpoint}/${peer}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    peer: Types.asString(body.peer, { name: 'peer' }),
    sent: asNumberString(body.sent, { name: 'sent' }),
    received: asNumberString(body.received, { name: 'received' }),
  }
}

/**
 * Get settlements with all known peers and total amount sent or received
 *
 * @param requestOptions Options for making requests
 */
export async function getAllSettlements(requestOptions: BeeRequestOptions): Promise<AllSettlements> {
  const response = await http<unknown>(requestOptions, {
    url: settlementsEndpoint,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  const totalSent = asNumberString(body.totalSent, { name: 'totalSent' })
  const totalReceived = asNumberString(body.totalReceived, { name: 'totalReceived' })
  const settlements = Types.asArray(body.settlements, { name: 'settlements' }).map(x =>
    Types.asObject(x, { name: 'settlement' }),
  )

  return {
    totalSent,
    totalReceived,
    settlements: settlements.map(x => ({
      peer: Types.asString(x.peer, { name: 'peer' }),
      sent: asNumberString(x.sent, { name: 'sent' }),
      received: asNumberString(x.received, { name: 'received' }),
    })),
  }
}
