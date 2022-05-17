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
const layouts = layout => require('fs').readFileSync(`src/layouts/${layout || 'base'}.html`).toString()

module.exports = {
  dirname,
  pwd,
  requireJSON,
  basename,
  condition,
  data,
  layouts
}