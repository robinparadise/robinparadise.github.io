const { html, tags } = require('./html')
const { assets, robots } = require('./assets')
const { css, cssBuild } = require('./css')
const { watcher, initWatcher } = require('./watcher')
const { kill } = require('./reload')

module.exports = {
  assets,
  robots,
  html,
  tags,
  css,
  cssBuild,
  watcher,
  initWatcher,
  kill
}
