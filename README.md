# Bee-js

[![Tests](https://github.com/ethersphere/bee-js/actions/workflows/tests.yaml/badge.svg)](https://github.com/ethersphere/bee-js/actions/workflows/tests.yaml)
[![Dependency Status](https://david-dm.org/ethersphere/bee-js.svg?style=flat-square)](https://david-dm.org/ethersphere/bee-js)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js?ref=badge_shield)
[![](https://img.shields.io/badge/made%20by-Swarm-blue.svg?style=flat-square)](https://swarm.ethereum.org/)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D6.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D12.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/runs%20in-browser%20%7C%20node%20%7C%20webworker%20%7C%20electron-orange)

> Client library for connecting to Bee decentralised storage

**Warning: This project is in beta state. There might (and most probably will) be changes in the future to its API and working. Also, no guarantees can be made about its stability, efficiency, and security at this stage.**

This project is intended to be used with **Bee version 1.3.0**. Using it with older or newer Bee versions is not recommended and may not work. Stay up to date by joining the [official Discord](https://discord.gg/GU22h2utj6) and by keeping an eye on the [releases tab](https://github.com/ethersphere/bee-js/releases).

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
import { Bee } from "@ethersphere/bee-js"

bee = new Bee("http://localhost:1633")

// Be aware, this creates on-chain transactions that spend Eth and BZZ!
const batchId = await bee.createPostageBatch('100', 17)
const fileHash = await bee.uploadData(batchId, "Bee is awesome!")
const data = await bee.downloadData(fileHash)

console.log(data.text()) // prints 'Bee is awesome!'
```

[**Check out our examples repo for some more ideas on how to use `bee-js`**](https://github.com/ethersphere/examples-js)

## Documentation

You can find the full documentation [here](https://bee-js.ethswarm.org/docs). The API reference documentation can be found [here](https://bee-js.ethswarm.org/docs/api).

You can generate API docs locally with:

```sh
npm run docs
```

The generated docs can be viewed in browser by opening `./docs/index.html`

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

### Test

The tests run in both context: node and dom with Jest.

To run the integration tests, you need to use our [`bee-factory`](https://github.com/ethersphere/bee-factory/) project. Clone the repo, you can use our prebuilt Docker images with setting env. variables like:

```bash
export BEE_VERSION="1.0.0-2572fa48"
export BLOCKCHAIN_VERSION="1.2.0"
export BEE_ENV_PREFIX="swarm-test"
export BEE_IMAGE_PREFIX="docker.pkg.github.com/ethersphere/bee-factory"
```

Customize these values based on which Bee version you want to run. After the env. variables are set use the `./scripts/environment.sh` script with `start` parameter.

If you want to skip creation of postage stamps every run of integration tests you can create stamps for both nodes and set them under env. variables `BEE_POSTAGE` and `BEE_PEER_POSTAGE`.

By default, for integration tests two bee nodes are expected to run on localhost on addresses `http://localhost:1633` and `http://localhost:11633`. These are the default values for the `bee-factory` script.
If you want to use custom setup, you can change the behavior of tests to different addresses using environment variables `BEE_API_URL`, `BEE_DEBUG_API_URL`, `BEE_PEER_DEBUG_API_URL` and `BEE_PEER_API_URL`.

In Visual Studio environment, the tests have been set up to run against your local bee node on `http://localhost:1633`
To run Jest tests, choose the `vscode-jest-tests` CI job under the Run tab.

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

- [nugaon](https://github.com/nugaon)
- [auhau](https://github.com/auhau)

## License

[BSD-3-Clause](./LICENSE)


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fbee-js?ref=badge_large)
