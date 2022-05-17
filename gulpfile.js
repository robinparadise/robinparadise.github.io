const { series, parallel } = require('gulp')
const { html, md, css, cssBuild, assets, watcher } = require('./tasks')

const clean = () => require('del')(['www'])
const server = () => require('gulp-connect').server({
  livereload: true,
  port: 8080,
  root: 'www'
})

exports.build = series(clean, cssBuild, parallel(html, md, assets))
exports.default = parallel(html, md, css, assets, watcher, server)
