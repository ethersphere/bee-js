const { default: axios } = require('axios')
const { Strings } = require('cafe-utility')
const { readdirSync, statSync, readFileSync } = require('fs')
const { join } = require('path')

main()

function main() {
  walk('src')
}

function walk(dir) {
  const files = readdirSync(dir)
  for (const file of files) {
    const path = join(dir, file)
    if (statSync(path).isDirectory()) {
      walk(path)
    } else {
      check(path)
    }
  }
}

function check(path) {
  const content = readFileSync(path, 'utf8')
  const links = Strings.extractAllBlocks(content, {
    opening: '](https://docs.ethswarm.org',
    closing: ')',
  })
  for (const link of links) {
    const cleanLink = link.replaceAll('](', '').replaceAll(')', '')
    axios.get(cleanLink).catch(error => {
      console.error(path, cleanLink, error.response.status)
    })
  }
}
