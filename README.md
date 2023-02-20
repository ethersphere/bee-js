# Bee-js

[![Tests](https://github.com/ethersphere/bee-js/actions/workflows/tests.yaml/badge.svg)](https://github.com/ethersphere/bee-js/actions/workflows/tests.yaml)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js?ref=badge_shield)
[![](https://img.shields.io/badge/made%20by-Swarm-blue.svg?style=flat-square)](https://swarm.ethereum.org/)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D6.9.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D14.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/runs%20in-browser%20%7C%20node%20%7C%20webworker%20%7C%20electron-orange)

> Client library for connecting to Bee decentralised storage

**Warning: This project is in beta state. There might (and most probably will) be changes in the future to its API and working. Also, no guarantees can be made about its stability, efficiency, and security at this stage.**

This project is intended to be used with **Bee version <!-- SUPPORTED_BEE_START -->1.12.0<!-- SUPPORTED_BEE_END -->**. Using it with older or newer Bee versions is not recommended and may not work. Stay up to date by joining the [official Discord](https://discord.gg/GU22h2utj6) and by keeping an eye on the [releases tab](https://github.com/ethersphere/bee-js/releases).

## Table of Contents

- [Install](#install)
  - [npm](#npm)
  - [Use in Node.js](#use-in-nodejs)
  - [Use in a browser with browserify, webpack or any other bundler](#use-in-a-browser-with-browserify-webpack-or-any-other-bundler)
  - [Use in a browser Using a script tag](#use-in-a-browser-using-a-script-tag)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
  - [Setup](#setup)
  - [Test](#test)
- [License](#license)

## Install

### npm

```sh
> npm install @ethersphere/bee-js --save
```

### yarn

```sh
> yarn add @ethersphere/bee-js
```

Be aware, if you are running Yarn v1 and are attempting to install this repo using GitHub URL, this won't unfortunately
work as it does not correctly handle execution of `prepare` script.

### Use in Node.js

**We require Node.js's version of at least 12.x**

```js
var BeeJs = require("@ethersphere/bee-js");
```

### Use in a browser with browserify, webpack or any other bundler

```js
var BeeJs = require("@ethersphere/bee-js");
```

### Use in a browser Using a script tag

Loading this module through a script tag will make the `BeeJs` object available in the global namespace.

```html
<script src="https://unpkg.com/@ethersphere/bee-js/dist/index.browser.min.js"></script>
```

## Usage

```js
import { Bee, BeeDebug } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')
const beeDebug = new BeeDebug('http://localhost:1635')

// Be aware, this creates on-chain transactions that spend Eth and BZZ!
const batchId = await bee.createPostageBatch('2000', 20)
const uploadResult = await bee.uploadData(batchId, "Bee is awesome!")
const data = await bee.downloadData(uploadResult.reference)

console.log(data.text()) // prints 'Bee is awesome!'
```

[**Check out our examples repo for some more ideas on how to use `bee-js`**](https://github.com/ethersphere/examples-js)

## Documentation

You can find the full documentation [here](https://bee-js.ethswarm.org/docs). The API reference documentation can be found [here](https://bee-js.ethswarm.org/docs/api).

## Contribute

There are some ways you can make this module better:

- Consult our [open issues](https://github.com/ethersphere/bee-js/issues) and take on one of them
- Help our tests reach 100% coverage!
- Join us in our [Discord chat](https://discord.gg/wdghaQsGq5) in the #develop-on-swarm channel if you have questions or want to give feedback

### Setup

Install project dependencies with

```sh
npm i
```

### Node 18

Node 18 came with its own fetch's native implementation called Undici. If you want to run bee-js tests under Node 18, then disable
the native's fetch implementation otherwise unit tests will fail as they capture HTTP calls with library called `nock` that does
not support native fetch yet.

```
export NODE_OPTIONS='--no-experimental-fetch'
```

### Test

The tests run in both context: node and dom with Jest.

To run the integration tests, you need to spin up local Bee cluster using our [`bee-factory`](https://github.com/ethersphere/bee-factory/) project.
In order to do that you have to have locally Docker running on your machine, but afterwards you can just simply run `npm run bee`, which spins up the
cluster and display Queen's logs. If you want to exit hit `CTRL+C`.

If you want to skip creation of postage stamps every run of integration tests you can create stamps for both nodes and set them under env. variables `BEE_POSTAGE` and `BEE_PEER_POSTAGE`.

By default, for integration tests two bee nodes are expected to run on localhost on addresses `http://localhost:1633` and `http://localhost:11633`. These are the default values for the `bee-factory` script.
If you want to use custom setup, you can change the behavior of tests to different addresses using environment variables `BEE_API_URL`, `BEE_DEBUG_API_URL`, `BEE_PEER_DEBUG_API_URL` and `BEE_PEER_API_URL`.

There are also browser tests by Puppeteer, which also provide integrity testing.
```sh
npm run test:browser
```
The test HTML file which Puppeteer uses is the [test/testpage/testpage.html](test/testpage/testpage.html).
To open and manually test BeeJS with developer console, it is necessary to build the library first with `npm run compile:browser` (running the browser tests `npm run test:browser` also builds the library).

### Compile code

In order to compile NodeJS code run

`npm run compile:node`

or for Browsers

`npm run compile:browser`

## Maintainers


## License

[BSD-3-Clause](./LICENSE)


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js?ref=badge_large)
