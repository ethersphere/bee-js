import { expect } from 'chai'
import { expect as jestExpect } from 'expect'
import * as settlements from '../../../../src/modules/debug/settlements'
import { beeDebugKyOptions, commonMatchers } from '../../../utils'

commonMatchers()

describe('settlements', () => {
  it('all settlements', async function () {
    const response = await settlements.getAllSettlements(beeDebugKyOptions())

    expect(response.totalReceived).to.be.numberString()
    expect(response.totalSent).to.be.numberString()
    expect(Array.isArray(response.settlements)).to.be.ok()

    if (response.settlements.length > 0) {
      jestExpect(response.settlements).toEqual(
        jestExpect.arrayContaining([
          jestExpect.objectContaining({
            peer: jestExpect.any(String),
            received: jestExpect.any(String),
            sent: jestExpect.any(String),
          }),
        ]),
      )

      const peerSettlement = response.settlements[0]

      const peerSettlementResponse = await settlements.getSettlements(beeDebugKyOptions(), peerSettlement.peer)

      expect(peerSettlementResponse.peer).to.eql(peerSettlement.peer)
      expect(peerSettlementResponse.received).to.be.numberString()
      expect(peerSettlementResponse.sent).to.be.numberString()
    }
  })
})
