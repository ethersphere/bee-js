# Bee-JS

[![](https://img.shields.io/badge/made%20by-Swarm-blue.svg?style=flat-square)](https://swarm.ethereum.org/)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js?ref=badge_shield)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/runs%20in-browser%20%7C%20node%20%7C%20webworker%20%7C%20electron-orange)

> JavaScript SDK for connecting to a Bee node in the Swarm decentralised storage.

> Supports Node.js 18+, Vite and Webpack.

> Write your code in CJS, MJS or TypeScript.

> Intended to be used with Bee version 2.1.0.

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

or

```sh
yarn add @ethersphere/bee-js
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

## Usage

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
    batchId = await bee.createPostageBatch('500000000', 20)
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

console.log(data.text()) // prints 'Bee is awesome!'
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

[**Check out our examples repo for some more ideas on how to use `bee-js`**](https://github.com/ethersphere/examples-js)

## Documentation

You can find the full documentation [here](https://bee-js.ethswarm.org/docs). The API reference documentation can be
found [here](https://bee-js.ethswarm.org/docs/api).

## Contribute

Stay up to date by joining the [official Discord](https://discord.gg/GU22h2utj6) and by keeping an eye on the
[releases tab](https://github.com/ethersphere/bee-js/releases).

There are some ways you can make this module better:

- Consult our [open issues](https://github.com/ethersphere/bee-js/issues) and take on one of them
- Help our tests reach 100% coverage!
- Join us in our [Discord chat](https://discord.gg/wdghaQsGq5) in the #develop-on-swarm channel if you have questions or
  want to give feedback

### Setup

Install project dependencies with

```sh
npm i
```

### Test

The tests run in both context: node and dom with Jest.

To run the integration tests, you need to spin up local Bee cluster using our
[`fdp-play`](https://github.com/fairDataSociety/fdp-play/) project. In order to do that you have to have locally Docker
running on your machine, but afterwards you can just simply run `npm run bee`, which spins up the cluster and display
Queen's logs. If you want to exit hit `CTRL+C`.

If you want to skip creation of postage stamps every run of integration tests you can create stamps for both nodes and
set them under env. variables `BEE_POSTAGE` and `BEE_PEER_POSTAGE`.

By default, for integration tests two bee nodes are expected to run on localhost on addresses `http://localhost:1633`
and `http://localhost:11633`. These are the default values for the `fdp-play` script. If you want to use custom setup,
you can change the behavior of tests to different addresses using environment variables `BEE_API_URL` and
`BEE_PEER_API_URL`.

There are also browser tests by Puppeteer, which also provide integrity testing.

```sh
npm run test:browser
```

The test HTML file which Puppeteer uses is the [test/testpage/testpage.html](test/testpage/testpage.html). To open and
manually test BeeJS with developer console, it is necessary to build the library first with `npm run compile:browser`
(running the browser tests `npm run test:browser` also builds the library).

### Compile code

In order to compile NodeJS code run

`npm run compile:node`

or for Browsers

`npm run compile:browser`

## License

[BSD-3-Clause](./LICENSE)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js?ref=badge_large)
