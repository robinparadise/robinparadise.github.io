const { parallel, watch } = require('gulp')
const { html } = require('./html')
const { md } = require('./md')
const { css, assets } = require('./assets')

const force = true

const watcher = parallel(
  () => watch('src/pages/*.html', html),
  () => watch('src/(layouts|components)/*.html', parallel(
    (done) => html(done, force),
    (done) => md(done, force)
  )),
  () => watch('src/css/*.css', css),
  () => watch('src/assets/*', assets),
  () => watch('src/pages/**/*.md', md)
)

module.exports = { watcher }