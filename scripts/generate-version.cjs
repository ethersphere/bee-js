#!/usr/bin/env node
// Generates src/version.ts from the `engines` field of package.json, so the supported
// Bee / Bee API versions have a single source of truth (package.json). Run via
// `npm run generate:version` (also wired into `prepare` and `build`).
const fs = require('fs')
const path = require('path')

const pkg = require('../package.json')
const beeExact = pkg.engines && pkg.engines.bee
const apiVersion = pkg.engines && pkg.engines.beeApiVersion

if (!beeExact || !apiVersion) {
  throw new Error('package.json must define "engines.bee" and "engines.beeApiVersion"')
}

const content = `// AUTO-GENERATED from package.json "engines" by scripts/generate-version.cjs — do not edit by hand.
// Run \`npm run generate:version\` to regenerate.

/** Exact supported Bee version, including the commit hash suffix. */
export const SUPPORTED_BEE_VERSION_EXACT = '${beeExact}'

/** Supported Bee version without the commit hash suffix. */
export const SUPPORTED_BEE_VERSION = SUPPORTED_BEE_VERSION_EXACT.split('-')[0]

/** Supported Bee API version. */
export const SUPPORTED_API_VERSION = '${apiVersion}'
`

const outPath = path.join(__dirname, '..', 'src', 'version.ts')
fs.writeFileSync(outPath, content)
console.log(`Generated ${path.relative(path.join(__dirname, '..'), outPath)} from package.json engines`)
