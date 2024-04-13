const MS = 200
const defaultLang = 'en'
const fs = require('fs')
const { data } = require('./data')

const readDir = path => {
  try {
    return fs.readdirSync(path);
  } catch (err) {
    return []
  }
}
let cached = {}
const requireUncached = (module) => {
  const path = require.resolve(module)
  const old = cached[path] && Date.now() - cached[path].time > MS
  if (!cached[path] || old) {
    delete require.cache[path]
    cached[path] = {
      data: require(path),
      time: Date.now()
    }
    return cached[path].data
  }
  return cached[path].data
}

const condition = file => file.path.includes('/pages')
const langsCache = {}
const langs = () => {
  if (!langsCache.time || langsCache.time && Date.now() - langsCache.time > 2 * MS) {
    langsCache.time = Date.now()
    langsCache.langs = ['', ...readDir(__dirname + '/../i18n').map(i => i.split('.')[0])]
  }
  return langsCache.langs
}

const i18n = (lang) => langs()
  .filter(Boolean)
  .reduce((acc, key, i) => {
    acc[key] = requireUncached(`${__dirname}/../i18n/${key}.json`)
    return acc
  }, {})[lang || defaultLang]

const context = ({lang, aux}) => {
  return ({
    ...data,
    i18n: i18n(lang),
    lang: lang || defaultLang,
    ...(aux || {})
  })
}

const layoutsCache = {}
const layouts = (layout) => {
  const name = layout || 'base'
  const old = layoutsCache[name] && Date.now() - layoutsCache[name].time > MS
  if (!layoutsCache[name] || old) {
    layoutsCache[name] = {
      time: Date.now(),
      data: require('fs').readFileSync(`src/layouts/${name}.html`).toString()
    }
  }
  return layoutsCache[name].data
}

const setVersion = (value) => {
  data.$version = value
}

module.exports = {
  condition,
  data,
  context,
  layouts,
  langs,
  setVersion
}
