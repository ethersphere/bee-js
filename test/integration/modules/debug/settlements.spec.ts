import * as settlements from '../../../../src/modules/debug/settlements'
import { beeKyOptions, commonMatchers } from '../../../utils'

commonMatchers()

describe('settlements', () => {
  it('all settlements', async function () {
    const response = await settlements.getAllSettlements(beeKyOptions())

    expect(response.totalReceived).toBeNumberString()
    expect(response.totalSent).toBeNumberString()
    expect(Array.isArray(response.settlements)).toBeTruthy()

    if (response.settlements.length > 0) {
      expect(response.settlements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            peer: expect.any(String),
            received: expect.any(String),
            sent: expect.any(String),
          }),
        ]),
      )

      const peerSettlement = response.settlements[0]

      const peerSettlementResponse = await settlements.getSettlements(beeKyOptions(), peerSettlement.peer)

      expect(peerSettlementResponse.peer).toBe(peerSettlement.peer)
      expect(peerSettlementResponse.received).toBeNumberString()
      expect(peerSettlementResponse.sent).toBeNumberString()
    }
  })
})
