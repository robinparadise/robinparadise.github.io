const { parallel, watch } = require('gulp')
const { html } = require('./html')
const { css, assets } = require('./assets')
const { rollup } = require('./rollup')
const { reload: reloadGulp } = require('./reload')
const { setVersion } = require('../context')
const { loadCriticalCss } = require('../context/data')
const { reload } = require('./app')

const watcher = parallel(
  () => watch('src/css/*.css', css),
  () => watch('src/assets/*', assets),
  () => watch(['gulpfile.js', 'tasks/*', 'utils/*', 'context/*'], reloadGulp)
)

const wacherHandler = (path) => {
  if (path.includes('.md')) setVersion(Date.now())
  if (path.includes('src/pages/')) return html(path).then(reload)
  if (path.includes('.css')) return loadCriticalCss() && reload()
  if (path.includes('.js')) return rollup().then(reload)
  else {
    setVersion(Date.now())
    reload()
  }
}

const initWatcher = () => {
  const watching = watch([
    'src/pages/*.html',
    'src/css/critical.css',
    'src/pages/**/*.md',
    'src/js/**/*.js',
    'src/(layouts|components)/*.html',
    'i18n/*.json'
  ], done => done())

  watching.on('change', function(path) {
    console.log(`File ${path} was changed`);
    wacherHandler(path)
  })

  watching.on('add', function(path) {
    console.log(`File ${path} was added`);
    wacherHandler(path)
  })

  watching.on('unlink', function(path) {
    console.log(`File ${path} was removed`);
  })
}


module.exports = { watcher, initWatcher }
