import * as parser from '@babel/parser'
import _traverse from '@babel/traverse'
import * as t from '@babel/types'

const traverse = ((_traverse as unknown as { default: typeof _traverse }).default ?? _traverse) as typeof _traverse

interface Mapping {
  namespace: string
  newName: string
}

const METHOD_MAP: Record<string, Mapping> = {
  // bee.balance
  getAllBalances: { namespace: 'balance', newName: 'getAll' },
  getPeerBalance: { namespace: 'balance', newName: 'getPeer' },
  getPastDueConsumptionBalances: { namespace: 'balance', newName: 'getAllPastDueConsumption' },
  getPastDueConsumptionPeerBalance: { namespace: 'balance', newName: 'getAllPastDueConsumptionForPeer' },

  // bee.chequebook
  getChequebookAddress: { namespace: 'chequebook', newName: 'getAddress' },
  getChequebookBalance: { namespace: 'chequebook', newName: 'getBalance' },
  depositBZZToChequebook: { namespace: 'chequebook', newName: 'deposit' },
  depositTokens: { namespace: 'chequebook', newName: 'deposit' },
  withdrawBZZFromChequebook: { namespace: 'chequebook', newName: 'withdraw' },
  withdrawTokens: { namespace: 'chequebook', newName: 'withdraw' },

  // bee.cheque
  getLastCheques: { namespace: 'cheque', newName: 'getAllLatest' },
  getLastChequesForPeer: { namespace: 'cheque', newName: 'getAllLatestForPeer' },
  getLastCashoutAction: { namespace: 'cheque', newName: 'getLastCashoutAction' },
  cashoutLastCheque: { namespace: 'cheque', newName: 'cashoutLast' },

  // bee.connectivity
  checkConnection: { namespace: 'connectivity', newName: 'checkConnection' },
  isConnected: { namespace: 'connectivity', newName: 'isConnected' },
  isGateway: { namespace: 'connectivity', newName: 'isGateway' },
  getNodeAddresses: { namespace: 'connectivity', newName: 'getNodeAddresses' },
  getBlocklist: { namespace: 'connectivity', newName: 'getBlocklist' },
  getPeers: { namespace: 'connectivity', newName: 'getPeers' },
  removePeer: { namespace: 'connectivity', newName: 'removePeer' },
  pingPeer: { namespace: 'connectivity', newName: 'ping' },
  getTopology: { namespace: 'connectivity', newName: 'getTopology' },

  // bee.data (/bytes)
  uploadData: { namespace: 'data', newName: 'upload' },
  downloadData: { namespace: 'data', newName: 'download' },
  downloadReadableData: { namespace: 'data', newName: 'downloadReadable' },
  probeData: { namespace: 'data', newName: 'probe' },
  isReferenceRetrievable: { namespace: 'data', newName: 'isRetrievable' },

  // bee.chunk (/chunks)
  uploadChunk: { namespace: 'chunk', newName: 'upload' },
  downloadChunk: { namespace: 'chunk', newName: 'download' },

  // bee.file (single /bzz)
  uploadFile: { namespace: 'file', newName: 'upload' },
  downloadFile: { namespace: 'file', newName: 'download' },
  downloadReadableFile: { namespace: 'file', newName: 'downloadReadable' },

  // bee.collection (multi-file /bzz)
  uploadCollection: { namespace: 'collection', newName: 'upload' },
  uploadFiles: { namespace: 'collection', newName: 'uploadFromFileList' },
  uploadFilesFromDirectory: { namespace: 'collection', newName: 'uploadFromDirectory' },
  streamFiles: { namespace: 'collection', newName: 'stream' },
  streamDirectory: { namespace: 'collection', newName: 'streamFromDirectory' },
  hashDirectory: { namespace: 'collection', newName: 'hashDirectory' },

  // bee.feed
  makeFeedWriter: { namespace: 'feed', newName: 'makeWriter' },
  makeFeedReader: { namespace: 'feed', newName: 'makeReader' },
  createFeedManifest: { namespace: 'feed', newName: 'createManifest' },
  fetchLatestFeedUpdate: { namespace: 'feed', newName: 'fetchLatestUpdate' },
  isFeedRetrievable: { namespace: 'feed', newName: 'isRetrievable' },

  // bee.grantee
  createGrantees: { namespace: 'grantee', newName: 'create' },
  getGrantees: { namespace: 'grantee', newName: 'get' },
  patchGrantees: { namespace: 'grantee', newName: 'patch' },

  // bee.messaging
  pssSend: { namespace: 'messaging', newName: 'pssSend' },
  pssReceive: { namespace: 'messaging', newName: 'pssReceive' },
  pssSubscribe: { namespace: 'messaging', newName: 'pssSubscribe' },
  gsocSend: { namespace: 'messaging', newName: 'gsocSend' },
  gsocSubscribe: { namespace: 'messaging', newName: 'gsocSubscribe' },
  gsocMine: { namespace: 'messaging', newName: 'gsocMine' },

  // bee.pin
  pin: { namespace: 'pin', newName: 'add' },
  unpin: { namespace: 'pin', newName: 'remove' },
  getAllPins: { namespace: 'pin', newName: 'getAll' },
  getPin: { namespace: 'pin', newName: 'get' },
  reuploadPinnedData: { namespace: 'pin', newName: 'reuploadData' },

  // bee.settlement
  getSettlements: { namespace: 'settlement', newName: 'get' },
  getAllSettlements: { namespace: 'settlement', newName: 'getAll' },

  // bee.soc
  makeSOCWriter: { namespace: 'soc', newName: 'makeWriter' },
  makeSOCReader: { namespace: 'soc', newName: 'makeReader' },

  // bee.stake
  getStake: { namespace: 'stake', newName: 'get' },
  getWithdrawableStake: { namespace: 'stake', newName: 'getWithdrawable' },
  depositStake: { namespace: 'stake', newName: 'deposit' },
  withdrawSurplusStake: { namespace: 'stake', newName: 'withdrawSurplus' },
  migrateStake: { namespace: 'stake', newName: 'migrate' },
  getRedistributionState: { namespace: 'stake', newName: 'getRedistributionState' },

  // bee.stamp
  createPostageBatch: { namespace: 'stamp', newName: 'create' },
  topUpBatch: { namespace: 'stamp', newName: 'topUp' },
  diluteBatch: { namespace: 'stamp', newName: 'dilute' },
  getPostageBatch: { namespace: 'stamp', newName: 'get' },
  getGlobalPostageBatch: { namespace: 'stamp', newName: 'getGlobal' },
  getPostageBatchBuckets: { namespace: 'stamp', newName: 'getBuckets' },
  getAllPostageBatch: { namespace: 'stamp', newName: 'getAll' },
  getAllGlobalPostageBatch: { namespace: 'stamp', newName: 'getAllGlobal' },
  getPostageBatches: { namespace: 'stamp', newName: 'getAll' },
  getGlobalPostageBatches: { namespace: 'stamp', newName: 'getAllGlobal' },
  updatePostageBatchLabel: { namespace: 'stamp', newName: 'updateLabel' },
  calculateTopUpForBzz: { namespace: 'stamp', newName: 'calculateTopUpForBZZ' },

  // bee.storage
  buyStorage: { namespace: 'storage', newName: 'buy' },
  getStorageCost: { namespace: 'storage', newName: 'getCost' },
  extendStorage: { namespace: 'storage', newName: 'extend' },
  extendStorageSize: { namespace: 'storage', newName: 'extendSize' },
  extendStorageDuration: { namespace: 'storage', newName: 'extendDuration' },
  getExtensionCost: { namespace: 'storage', newName: 'getExtensionCost' },
  getSizeExtensionCost: { namespace: 'storage', newName: 'getSizeExtensionCost' },
  getDurationExtensionCost: { namespace: 'storage', newName: 'getDurationExtensionCost' },
  renameStorage: { namespace: 'storage', newName: 'rename' },

  // bee.status
  getStatus: { namespace: 'status', newName: 'get' },
  getHealth: { namespace: 'status', newName: 'getHealth' },
  getReadiness: { namespace: 'status', newName: 'getReadiness' },
  getNodeInfo: { namespace: 'status', newName: 'getNodeInfo' },
  isSupportedExactVersion: { namespace: 'status', newName: 'isSupportedExactVersion' },
  isSupportedApiVersion: { namespace: 'status', newName: 'isSupportedApiVersion' },
  getVersions: { namespace: 'status', newName: 'getVersions' },
  getReserveState: { namespace: 'status', newName: 'getReserveState' },
  getChainState: { namespace: 'status', newName: 'getChainState' },

  // bee.tag
  createTag: { namespace: 'tag', newName: 'create' },
  getAllTags: { namespace: 'tag', newName: 'getAll' },
  retrieveTag: { namespace: 'tag', newName: 'get' },
  deleteTag: { namespace: 'tag', newName: 'delete' },
  updateTag: { namespace: 'tag', newName: 'update' },

  // bee.transaction
  getAllPendingTransactions: { namespace: 'transaction', newName: 'getAll' },
  getPendingTransaction: { namespace: 'transaction', newName: 'get' },
  rebroadcastPendingTransaction: { namespace: 'transaction', newName: 'rebroadcast' },
  cancelPendingTransaction: { namespace: 'transaction', newName: 'cancel' },

  // bee.wallet
  getWalletBalance: { namespace: 'wallet', newName: 'getBalance' },
  withdrawBZZToExternalWallet: { namespace: 'wallet', newName: 'withdrawBZZ' },
  withdrawDAIToExternalWallet: { namespace: 'wallet', newName: 'withdrawDAI' },
}

function getPlugins(filename: string): parser.ParserPlugin[] {
  if (filename.endsWith('.tsx')) return ['typescript', 'jsx']
  if (filename.endsWith('.ts')) return ['typescript']
  if (filename.endsWith('.jsx')) return ['jsx']
  return []
}

export function transform(source: string, filename: string): string {
  const ast = parser.parse(source, {
    sourceType: 'module',
    plugins: getPlugins(filename),
    strictMode: false,
  })

  const beeInstances = new Set<string>()

  traverse(ast, {
    NewExpression(path) {
      if (!t.isIdentifier(path.node.callee, { name: 'Bee' })) return

      const parent = path.parent

      if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
        beeInstances.add(parent.id.name)
      } else if (t.isAssignmentExpression(parent) && t.isIdentifier(parent.left)) {
        beeInstances.add(parent.left.name)
      }
    },
  })

  if (beeInstances.size === 0) return source

  const replacements: Array<{ start: number; end: number; text: string }> = []

  traverse(ast, {
    CallExpression(path) {
      const { callee } = path.node
      if (!t.isMemberExpression(callee)) return
      if (!t.isIdentifier(callee.object)) return
      if (!beeInstances.has(callee.object.name)) return
      if (!t.isIdentifier(callee.property)) return

      const mapping = METHOD_MAP[callee.property.name]
      if (!mapping) return

      replacements.push({
        start: callee.start!,
        end: callee.end!,
        text: `${callee.object.name}.${mapping.namespace}.${mapping.newName}`,
      })
    },
  })

  if (replacements.length === 0) return source

  // Apply from end to start to preserve positions
  replacements.sort((a, b) => b.start - a.start)

  let result = source
  for (const { start, end, text } of replacements) {
    result = result.slice(0, start) + text + result.slice(end)
  }

  return result
}
