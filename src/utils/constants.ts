import { BatchId, Topic } from './typed-bytes'

export const SWARM_GATEWAY_URL = 'https://api.gateway.ethswarm.org'
export const NULL_STAMP = new BatchId('0000000000000000000000000000000000000000000000000000000000000000')
export const NULL_TOPIC = new Topic('0000000000000000000000000000000000000000000000000000000000000000')
export const NULL_ADDRESS = new Uint8Array(32)
export const NULL_IDENTIFIER = new Uint8Array(32)
