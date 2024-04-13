const fs = require('fs')
const { series, parallel } = require('gulp')
const { html, tags, css, cssBuild, assets, robots, watcher, initWatcher } = require('./tasks')
const { server } = require('./tasks/app')
const { rollupBuild, rollup } = require('./tasks/rollup')
const { searchManifest } = require('./tasks/searchManifest')

const clean = (done) => fs.rm('./www', { recursive: true }, () => done())

exports.build = series(
  clean,
  assets,
  robots,
  cssBuild,
  function rollupTask(done) { return rollupBuild().then(_ => done())  },
  function htmlTask(done) { return html().then(_ => done()) },
  function tagsTask(done) { return tags().then(_ => done()) },
  function searchTasks(done) { return searchManifest().then(_ => done()) }
)

exports.default = series(
  function rollupTask(done) { return rollup().then(_ => done()) },
  css,
  assets,
  function searchTasks(done) { return searchManifest().then(_ => done()) },
  parallel(
    initWatcher,
    watcher,
    server
  )
)
