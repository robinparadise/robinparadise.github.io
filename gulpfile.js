const { series, parallel, watch } = require('gulp')
const del = require('del')
const connect = require('gulp-connect')

const { md } = require('./gulp/md')
const { html } = require('./gulp/html')
const { css, cssBuild, assets } = require('./gulp/assets')

const watchFiles = parallel(
  () => watch('src/pages/*.html', html),
  () => watch('src/components/*.html', parallel(
    (done) => html(done, true),
    (done) => md(done, true)
  )),
  () => watch('src/layouts/*.html', parallel(
    (done) => html(done, true),
    (done) => md(done, true)
  )),
  () => watch('src/css/*.css', css),
  () => watch('src/assets/*', assets),
  () => watch('src/pages/**/*.md', md)
)

const clean = () => del(['www'])

const server = () => connect.server({
  livereload: true,
  port: 8080,
  root: 'www'
})

exports.build = series(clean, cssBuild, parallel(html, md, assets))
exports.default = parallel(html, md, css, assets, watchFiles, server)
