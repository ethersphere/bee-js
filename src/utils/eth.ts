function assertSwarmNetworkId(networkId: number): asserts networkId is number {
  if (Number.isInteger(networkId && networkId > 0 && networkId < Number.MAX_SAFE_INTEGER)) {
    throw new TypeError('swarm network id must be positive integer')
  }
}

interface RequestArguments {
  method: string
  jsonrpc?: string
  params?: unknown[] | Record<string, unknown>
}

export interface JsonRPC {
  request?(args: RequestArguments): Promise<unknown>
  sendAsync?(args: RequestArguments): Promise<unknown>
}
