# Bee-JS

[![](https://img.shields.io/badge/made%20by-Swarm-blue.svg?style=flat-square)](https://swarm.ethereum.org/)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js?ref=badge_shield)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/runs%20in-browser%20%7C%20node%20%7C%20webworker%20%7C%20electron-orange)

> JavaScript SDK for the Swarm decentralised storage.

> Supports Node.js 18+, Vite and Webpack.

> Write your code in CJS, MJS or TypeScript.

> Intended to be used with Bee version 2.5.0.

## Quick start

Start a Swarm project using TypeScript:

```sh
npm init swarm-app@latest my-dapp node-ts
```

or using Vite and TypeScript:

```sh
npm init swarm-app@latest my-dapp vite-tsx
```

Supported types are `node`, `node-esm`, `node-ts` and `vite-tsx`. Replace `my-dapp` with your project name.

## Install

```sh
npm install @ethersphere/bee-js
```

## Import

### CJS

```js
const { Bee } = require('@ethersphere/bee-js')
```

### MJS and TypeScript

```ts
import { Bee } from '@ethersphere/bee-js'
```

### Script tag

Loading this module through a script tag will make the `BeeJs` object available in the global namespace.

```html
<script src="https://unpkg.com/@ethersphere/bee-js/dist/index.browser.min.js"></script>
```

## Overview

### Type interfaces

`NumberString` is a branded type for marking strings that represent numbers. It interops with `string` and `bigint`
types. Where `NumberString` is present, `number` is disallowed in order to avoid pitfalls with unsafe large values.

### Byte primitives

All the classes below extend `Bytes`, therefor the following methods are available on all of them: `toUint8Array`,
`toHex`, `toBase64`, `toBase32`, `toUtf8`, `toJSON`, `static keccak256`, `static fromUtf8`.

The `toString` method uses `toHex`.

`Bytes` and its subclasses may be constructed with `new` from `Uint8Array` or hex `string`.

#### Elliptic

| Name       | Description               | Methods                                                |
| ---------- | ------------------------- | ------------------------------------------------------ |
| PrivateKey | 32 bytes private key      | `publicKey`, `sign`                                    |
| PublicKey  | 64 bytes public key       | `address`, `toCompressedUint8Array`, `toCompressedHex` |
| EthAddress | 20 bytes Ethereum address | `toChecksum`                                           |
| Signature  | 65 bytes signature        | `recoverPublicKey`                                     |

#### Swarm

| Name          | Description                         | Methods                         |
| ------------- | ----------------------------------- | ------------------------------- |
| Reference     | 32/64 bytes reference (chunk, feed) | `toCid`                         |
| Identifier    | 32 bytes identifier (SOC, Feed)     | -                               |
| TransactionId | 32 bytes transaction ID             | -                               |
| FeedIndex     | 8 bytes feed index (BE)             | `static fromBigInt`, `toBigInt` |
| Topic         | 32 bytes topic                      | `static fromString`             |
| PeerAddress   | 32 bytes peer address               | -                               |
| BatchId       | 32 bytes batch ID                   | -                               |
| Span          | 8 bytes span (LE)                   | `static fromBigInt`, `toBigInt` |

### Tokens

| Name | Description                 | Methods                                                                                          |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| DAI  | ERC20 DAI token (18 digits) | `static fromDecimalString`, `static fromWei`, `toWeiString`, `toWeiBigInt`, `toDecimalString`    |
| BZZ  | ERC20 BZZ token (16 digits) | `static fromDecimalString`, `static fromPLUR`, `toPLURString`, `toPLURBigInt`, `toDecimalString` |

### Swarm chunks

| Name             | Description                                                                                     | Creation                    |
| ---------------- | ----------------------------------------------------------------------------------------------- | --------------------------- |
| Chunk            | Span, max. 4096 bytes payload; address dervied from content                                     | `makeContentAddressedChunk` |
| SingleOwnerChunk | Identifier, signature, span, max. 4096 bytes payload; address derived from identifier and owner | `makeSingleOwnerChunk`      |

### Swarm primitives

| Name         | Description                                          | Methods                                                                                                                                         |
| ------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| MantarayNode | Compact trie with reference values and JSON metadata | `addFork`, `removeFork`, `calculateSelfAddress`, `find`, `findClosest`, `collect`, `marshal`, `unmarshal`, `saveRecursively`, `loadRecursively` |
| MerkleTree   | Streaming BMT of chunks                              | `append`, `finalize`, `static root`                                                                                                             |

### Swarm objects

| Name       | Description             | Creation             |
| ---------- | ----------------------- | -------------------- |
| SOCWriter  | SingleOwnerChunk writer | `bee.makeSOCWriter`  |
| SOCReader  | SingleOwnerChunk reader | `bee.makeSOCReader`  |
| FeedWriter | Feed writer             | `bee.makeFeedWriter` |
| FeedReader | Feed reader             | `bee.makeFeedReader` |

### Bee API

- ❌❌✅ - Full node only
- ❌✅✅ - Light node and full node
- ✅✅✅ - Ultra-light node, light node and full node

| JS Call                              | Bee Endpoint                                                                                                                                             | Bee Mode |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `uploadFile`                         | `POST /bzz` [🔗](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)                                                                                | ❌✅✅   |
| `uploadFilesFromDirectory` _Node.js_ | `POST /bzz` [🔗](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)                                                                                | ❌✅✅   |
| `uploadFiles`                        | `POST /bzz` [🔗](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)                                                                                | ❌✅✅   |
| `uploadCollection`                   | `POST /bzz` [🔗](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz/post)                                                                                | ❌✅✅   |
| `uploadData`                         | `POST /bytes` [🔗](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes/post)                                                                          | ❌✅✅   |
| `uploadChunk`                        | `POST /chunks` [🔗](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks/post)                                                                        | ❌✅✅   |
| `streamDirectory` _Node.js_          | `POST /chunks` [🔗](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks/post)                                                                        | ❌✅✅   |
| `streamFiles` _Browser_              | `POST /chunks` [🔗](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks/post)                                                                        | ❌✅✅   |
| `SOCWriter.upload`                   | `POST /soc/:owner/:identifier` [🔗](https://docs.ethswarm.org/api/#tag/Single-owner-chunk/paths/~1soc~1%7Bowner%7D~1%7Bid%7D/post)                       | ❌✅✅   |
| `FeedReader.download`                | `GET /feeds/:owner/:topic` [🔗](https://docs.ethswarm.org/api/#tag/Feed/paths/~1feeds~1%7Bowner%7D~1%7Btopic%7D/get)                                     | ✅✅✅   |
| `FeedWriter.updateFeed`              | `POST /soc/:owner/:identifier` [🔗](https://docs.ethswarm.org/api/#tag/Single-owner-chunk/paths/~1soc~1%7Bowner%7D~1%7Bid%7D/post)                       | ❌✅✅   |
| `downloadFile`                       | `GET /bzz/:reference` [🔗](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz~1%7Breference%7D/get)                                                      | ✅✅✅   |
| `downloadFile`                       | `GET /bzz/:reference/:path` [🔗](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz~1%7Breference%7D~1%7Bpath%7D/get)                                    | ✅✅✅   |
| `downloadReadableFile`               | `GET /bzz/:reference` [🔗](https://docs.ethswarm.org/api/#tag/BZZ/paths/~1bzz~1%7Breference%7D/get)                                                      | ✅✅✅   |
| `downloadData`                       | `GET /bytes/:reference` [🔗](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1%7Breference%7D/get)                                                | ✅✅✅   |
| `downloadReadableData`               | `GET /bytes/:reference` [🔗](https://docs.ethswarm.org/api/#tag/Bytes/paths/~1bytes~1%7Breference%7D/get)                                                | ✅✅✅   |
| `downloadChunk`                      | `GET /chunks/:reference` [🔗](https://docs.ethswarm.org/api/#tag/Chunk/paths/~1chunks~1%7Baddress%7D/get)                                                | ✅✅✅   |
| `createFeedManifest`                 | `POST /feeds/:owner/:topic` [🔗](https://docs.ethswarm.org/api/#tag/Feed/paths/~1feeds~1%7Bowner%7D~1%7Btopic%7D/post)                                   | ❌✅✅   |
| `isConnected`                        | `GET /`                                                                                                                                                  | ✅✅✅   |
| `getHealth`                          | `GET /health` [🔗](https://docs.ethswarm.org/api/#tag/Status/paths/~1health/get)                                                                         | ✅✅✅   |
| `getReadiness`                       | `GET /readiness` [🔗](https://docs.ethswarm.org/api/#tag/Status/paths/~1readiness/get)                                                                   | ✅✅✅   |
| `getNodeInfo`                        | `GET /node` [🔗](https://docs.ethswarm.org/api/#tag/Status/paths/~1node/get)                                                                             | ✅✅✅   |
| `getChainState`                      | `GET /chainstate` [🔗](https://docs.ethswarm.org/api/#tag/Status/paths/~1chainstate/get)                                                                 | ❌✅✅   |
| `getRedistributionState`             | `GET /redistributionstate` [🔗](https://docs.ethswarm.org/api/#tag/RedistributionState/paths/~1redistributionstate/get)                                  | ❌❌✅   |
| `getReserveState`                    | `GET /reservestate` [🔗](https://docs.ethswarm.org/api/#tag/Status/paths/~1reservestate/get)                                                             | ❌❌✅   |
| `getStatus`                          | `GET /status` [🔗](https://docs.ethswarm.org/api/#tag/Node-Status/paths/~1status/get)                                                                    | ✅✅✅   |
| `getWallet`                          | `GET /wallet` [🔗](https://docs.ethswarm.org/api/#tag/Wallet/paths/~1wallet/get)                                                                         | ❌✅✅   |
| `getTopology`                        | `GET /topology` [🔗](https://docs.ethswarm.org/api/#tag/Connectivity/paths/~1topology/get)                                                               | ✅✅✅   |
| `getAddresses`                       | `GET /addresses` [🔗](https://docs.ethswarm.org/api/#tag/Connectivity/paths/~1addresses/get)                                                             | ✅✅✅   |
| `getPeers`                           | `GET /peers` [🔗](https://docs.ethswarm.org/api/#tag/Connectivity/paths/~1peers/get)                                                                     | ✅✅✅   |
| `getAllBalances`                     | `GET /balances` [🔗](https://docs.ethswarm.org/api/#tag/Balance/paths/~1balances/get)                                                                    | ❌✅✅   |
| `getPeerBalance`                     | `GET /balances/:peer` [🔗](https://docs.ethswarm.org/api/#tag/Balance/paths/~1balances~1%7Baddress%7D/get)                                               | ❌✅✅   |
| `getPastDueConsumptionBalances`      | `GET /consumed` [🔗](https://docs.ethswarm.org/api/#tag/Balance/paths/~1consumed/get)                                                                    | ❌✅✅   |
| `getPastDueConsumptionPeerBalance`   | `GET /consumed/:peer` [🔗](https://docs.ethswarm.org/api/#tag/Balance/paths/~1consumed~1%7Baddress%7D/get)                                               | ❌✅✅   |
| `getAllSettlements`                  | `GET /settlements` [🔗](https://docs.ethswarm.org/api/#tag/Settlements/paths/~1settlements/get)                                                          | ❌✅✅   |
| `getSettlements`                     | `GET /settlements/:peer` [🔗](https://docs.ethswarm.org/api/#tag/Settlements/paths/~1settlements~1%7Baddress%7D/get)                                     | ❌✅✅   |
| `getChequebookAddress`               | `GET /chequebook/address` [🔗](https://docs.ethswarm.org/api/#tag/Chequebook/paths/~1chequebook~1address/get)                                            | ❌✅✅   |
| `getChequebookBalance`               | `GET /chequebook/balance` [🔗](https://docs.ethswarm.org/api/#tag/Chequebook/paths/~1chequebook~1balance/get)                                            | ❌✅✅   |
| `getLastCheques`                     | `GET /chequebook/cheque` [🔗](https://docs.ethswarm.org/api/#tag/Chequebook/paths/~1chequebook~1cheque/get)                                              | ❌✅✅   |
| `getLastChequesForPeer`              | `GET /chequebook/cheque/:peer` [🔗](https://docs.ethswarm.org/api/#tag/Chequebook/paths/~1chequebook~1cheque~1%7Bpeer-id%7D/get)                         | ❌✅✅   |
| `getLastCashoutAction`               | `GET /chequebook/cashout/:peer` [🔗](https://docs.ethswarm.org/api/#tag/Chequebook/paths/~1chequebook~1cashout~1%7Bpeer-id%7D/get)                       | ❌✅✅   |
| `cashoutLastCheque`                  | `POST /chequebook/cashout/:peer` [🔗](https://docs.ethswarm.org/api/#tag/Chequebook/paths/~1chequebook~1cashout~1%7Bpeer-id%7D/post)                     | ❌✅✅   |
| `depositTokens`                      | `POST /chequebook/deposit` [🔗](https://docs.ethswarm.org/api/#tag/Chequebook/paths/~1chequebook~1deposit/post)                                          | ❌✅✅   |
| `withdrawTokens`                     | `POST /chequebook/withdraw` [🔗](https://docs.ethswarm.org/api/#tag/Chequebook/paths/~1chequebook~1withdraw/post)                                        | ❌✅✅   |
| `getAllPendingTransactions`          | `GET /transactions` [🔗](https://docs.ethswarm.org/api/#tag/Transaction/paths/~1transactions/get)                                                        | ❌✅✅   |
| `getPendingTransaction`              | `GET /transactions/:id` [🔗](https://docs.ethswarm.org/api/#tag/Transaction/paths/~1transactions~1%7BtxHash%7D/get)                                      | ❌✅✅   |
| `rebroadcastTransaction`             | `POST /transactions/:id` [🔗](https://docs.ethswarm.org/api/#tag/Transaction/paths/~1transactions~1%7BtxHash%7D/post)                                    | ❌✅✅   |
| `cancelTransaction`                  | `DELETE /transactions/:id` [🔗](https://docs.ethswarm.org/api/#tag/Transaction/paths/~1transactions~1%7BtxHash%7D/delete)                                | ❌✅✅   |
| `createTag`                          | `POST /tags` [🔗](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags/post)                                                                              | ❌✅✅   |
| `retrieveTag`                        | `GET /tags/:id` [🔗](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1%7Buid%7D/get)                                                                 | ❌✅✅   |
| `getAllTags`                         | `GET /tags` [🔗](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags/get)                                                                                | ❌✅✅   |
| `deleteTag`                          | `DELETE /tags/:id` [🔗](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1%7Buid%7D/delete)                                                           | ❌✅✅   |
| `updateTag`                          | `PATCH /tags/:id` [🔗](https://docs.ethswarm.org/api/#tag/Tag/paths/~1tags~1%7Buid%7D/patch)                                                             | ❌✅✅   |
| `pin`                                | `POST /pins/:reference` [🔗](https://docs.ethswarm.org/api/#tag/Pinning/paths/~1pins~1%7Breference%7D/post)                                              | ✅✅✅   |
| `getAllPins`                         | `GET /pins` [🔗](https://docs.ethswarm.org/api/#tag/Pinning/paths/~1pins/get)                                                                            | ✅✅✅   |
| `getPin`                             | `GET /pins/:reference` [🔗](https://docs.ethswarm.org/api/#tag/Pinning/paths/~1pins~1%7Breference%7D/get)                                                | ✅✅✅   |
| `isReferenceRetrievable`             | `GET /stewardship/:reference` [🔗](https://docs.ethswarm.org/api/#tag/Stewardship/paths/~1stewardship~1%7Breference%7D/get)                              | ✅✅✅   |
| `reuploadPinnedData`                 | `PUT /stewardship/:reference` [🔗](https://docs.ethswarm.org/api/#tag/Stewardship/paths/~1stewardship~1%7Breference%7D/put)                              | ❌✅✅   |
| `unpin`                              | `DELETE /pins/:reference` [🔗](https://docs.ethswarm.org/api/#tag/Pinning/paths/~1pins~1%7Breference%7D/delete)                                          | ✅✅✅   |
| `getGrantees`                        | `GET /grantee/:reference` [🔗](https://docs.ethswarm.org/api/#tag/ACT/paths/~1grantee~1%7Breference%7D/get)                                              | ❌✅✅   |
| `createGrantees`                     | `POST /grantee` [🔗](https://docs.ethswarm.org/api/#tag/ACT/paths/~1grantee/post)                                                                        | ❌✅✅   |
| `patchGrantees`                      | `PATCH /grantee/:reference` [🔗](https://docs.ethswarm.org/api/#tag/ACT/paths/~1grantee~1%7Breference%7D/patch)                                          | ❌✅✅   |
| `pssSend`                            | `POST /pss/send/:topic/:target` [🔗](https://docs.ethswarm.org/api/#tag/Postal-Service-for-Swarm/paths/~1pss~1send~1%7Btopic%7D~1%7Btargets%7D/post)     | ❌✅✅   |
| `pssSubscribe` _Websocket_           | `GET /pss/subscribe/:topic` [🔗](https://docs.ethswarm.org/api/#tag/Postal-Service-for-Swarm/paths/~1pss~1subscribe~1%7Btopic%7D/get)                    | ❌❌✅   |
| `pssReceive`                         | `GET /pss/subscribe/:topic` [🔗](https://docs.ethswarm.org/api/#tag/Postal-Service-for-Swarm/paths/~1pss~1subscribe~1%7Btopic%7D/get)                    | ❌❌✅   |
| `getAllPostageBatch`                 | `GET /stamps` [🔗](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps/get)                                                                 | ❌✅✅   |
| `getGlobalPostageBatches`            | `GET /batches` [🔗](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1batches/get)                                                               | ❌✅✅   |
| `getPostageBatch`                    | `GET /stamps/:batchId` [🔗](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1%7Bbatch_id%7D/get)                                        | ❌✅✅   |
| `getPostageBatchBuckets`             | `GET /stamps/:batchId/buckets` [🔗](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1%7Bbatch_id%7D~1buckets/get)                       | ❌✅✅   |
| `createPostageBatch`                 | `POST /stamps/:amount/:depth` [🔗](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1%7Bamount%7D~1%7Bdepth%7D/post)                     | ❌✅✅   |
| `topUpBatch`                         | `PATCH /stamps/topup/:batchId/:amount` [🔗](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1topup~1%7Bbatch_id%7D~1%7Bamount%7D/patch) | ❌✅✅   |
| `diluteBatch`                        | `PATCH /stamps/dilute/:batchId/:depth` [🔗](https://docs.ethswarm.org/api/#tag/Postage-Stamps/paths/~1stamps~1dilute~1%7Bbatch_id%7D~1%7Bdepth%7D/patch) | ❌✅✅   |
| `createEnvelope`                     | `POST /envelope/:reference` [🔗](https://docs.ethswarm.org/api/#tag/Envelope/paths/~1envelope~1%7Baddress%7D/post)                                       | ❌✅✅   |
| `getStake`                           | `GET /stake` [🔗](https://docs.ethswarm.org/api/#tag/Staking/paths/~1stake/get)                                                                          | ❌❌✅   |
| `depositStake`                       | `POST /stake` [🔗](https://docs.ethswarm.org/api/#tag/Staking/paths/~1stake~1%7Bamount%7D/post)                                                          | ❌❌✅   |

### Utils

#### General

- `getCollectionSize`
- `getFolderSize`

#### PSS

- `makeMaxTarget`

#### Erasure Coding

- `approximateOverheadForRedundancyLevel`
- `getRedundancyStat`
- `getRedundancyStats`

#### Stamps

- `getAmountForTtl`
- `getDepthForCapacity`
- `getStampCost`
- `getStampEffectiveBytes`
- `getStampMaximumCapacityBytes`
- `getStampTtlSeconds`
- `getStampUsage`

## Usage

### Upload via Swarm Gateway

```js
import { Bee, NULL_STAMP, SWARM_GATEWAY_URL } from '@ethersphere/bee-js'

main()

async function main() {
  const bee = new Bee(SWARM_GATEWAY_URL)
  const { reference } = await bee.uploadData(NULL_STAMP, 'Hello, World!')
  console.log(reference.toHex())
}
```

### Create or select an existing postage batch

Swarm incentivizes nodes in the network to store content, therefor all uploads require a paid
[postage batch](https://docs.ethswarm.org/docs/learn/technology/contracts/postage-stamp).

```js
import { Bee } from '@ethersphere/bee-js'

async function getOrCreatePostageBatch() {
  const bee = new Bee('http://localhost:1633')
  let batchId

  const batches = await bee.getAllPostageBatch()
  const usable = batches.find(x => x.usable)

  if (usable) {
    batchId = usable.batchID
  } else {
    batchId = await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(7))
  }
}
```

> The following examples all assume an existing batchId.

### Upload simple data (Browser + Node.js)

```js
import { Bee } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')

const uploadResult = await bee.uploadData(batchId, 'Bee is awesome!')
const data = await bee.downloadData(uploadResult.reference)

console.log(data.toUtf8()) // prints 'Bee is awesome!'
```

### Upload data from a file input (React)

```js
import { Bee } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')
const result = await bee.uploadFile(batchId, file)
```

### Upload multiple files or a directory (React)

```js
import { Bee } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')
const result = await bee.uploadFiles(batchId, fileList)
```

### Upload arbitrary large file (Node.js)

```js
import { Bee } from '@ethersphere/bee-js'
import { createReadStream } from 'fs'

const bee = new Bee('http://localhost:1633')
const readable = createReadStream('./path/to/large.bin')
const uploadResult = await bee.uploadFile(batchId, readable)
```

### Upload arbitrary large directories (Node.js)

```js
import { Bee } from '@ethersphere/bee-js'
import { createReadStream } from 'fs'

const bee = new Bee('http://localhost:1633')
const uploadResult = await bee.uploadFilesFromDirectory(batchId, './path/to/gallery/')
```

### Customize http/https agent and headers

```js
const bee = new Bee('http://localhost:1633', {
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  headers: {
    Authorization: 'Basic ' + Buffer.from('username:password').toString('base64'),
  },
})
```

## Contribute

Stay up to date by joining the [official Discord](https://discord.gg/GU22h2utj6) and by keeping an eye on the
[releases tab](https://github.com/ethersphere/bee-js/releases).

We are using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for our commit messages and pull
requests, following the [Semantic Versioning](https://semver.org/) rules.

There are some ways you can make this module better:

- Consult our [open issues](https://github.com/ethersphere/bee-js/issues) and take on one of them
- Help our tests reach 100% coverage!
- Join us in our [Discord chat](https://discord.gg/wdghaQsGq5) in the #develop-on-swarm channel if you have questions or
  want to give feedback

### Setup

Install project dependencies:

```sh
npm install
```

Build the project:

```sh
npm run build
```

After making changes, link the package to your project by running `npm link` in the Bee-JS project root, and
`npm link @ethersphere/bee-js` in your project root.

### Test

[Code coverage](https://bah5acgza26tlmya36bdiu5cdfs3hh22hqthkhfv6cvq2ugxqrv5aw267ydlq.bzz.limo/)

Tests are currently run against a mainnet Bee nodes. This is temporary and this section will be revised in the future.

## License

[BSD-3-Clause](./LICENSE)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js?ref=badge_large)
