const path = require('path')

const dirname = (p) => path.basename(path.dirname(p))
const pwd = (p) => path.dirname(p)
const basename = (p) => path.parse(p).name
const condition = file => file.path.includes('/pages')
const requireJSON = (path) => {
  try {
    return require(path)
  }
  catch (e) {
    return {}
  }
}
const data = {
  style: 'style.css',
  favicon: '/assets/favicon.ico',
  image: '',
  description: 'Fullstack JavaScript Developer. Passionate about the Linux operating system, free software and web programming.',
  year: new Date().getFullYear(),
  age: parseInt((new Date() - new Date(1990, 4, 23)) / (1000 * 60 * 60 * 24 * 365))
}
let time = 0
const layoutsCache = {}
const layouts = (layout) => {
  const name = layout || 'base'
  const old = layoutsCache[name] && Date.now() - time > 3000
  if (!layoutsCache[name] || old) {
    time = Date.now()
    layoutsCache[name] = require('fs').readFileSync(`src/layouts/${name}.html`).toString()
    return layoutsCache[name]
  } else {
    return layoutsCache[name]
  }
}

module.exports = {
  dirname,
  pwd,
  requireJSON,
  basename,
  condition,
  data,
  layouts
}