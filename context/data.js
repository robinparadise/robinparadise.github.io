const MS = 200

const fs = require('fs')
const { minify } = require('csso')
const { localdate } = require('../utils/localdate')

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

const loadCritical = (data = null) => {
  const critical = minify(fs.readFileSync(`${__dirname}/../src/css/critical.css`).toString()).css
  if (data) return data.critical = critical
  else return critical
}

const manifest = { time: 0, data: null }
const requireManifest = (script) => {
  const old = manifest.data && Date.now() - manifest.time > MS
  if (!manifest.data || old) {
    const names = fs.readdirSync(`www/assets`, { withFileTypes: true })
      .filter(file => file.name.includes('.js'))
      .map(file => file.name)
    manifest.data = names
    manifest.time = Date.now()
  }

  const data = manifest.data || {}
  return data.find(name => name.includes(script.replace('.js', '')))
}

const data = {
  $version: 0,
  style: 'style.css',
  critical: loadCritical(),
  favicon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔥</text></svg>',
  image: '/assets/blog/19may22-firebase.jpg',
  description: 'Fullstack JavaScript Developer. Passionate about the Linux operating system, free software and web programming.',
  year: new Date().getFullYear(),
  age: parseInt(`${(Date.now() - Date.parse('1990-04-23')) / (1000 * 60 * 60 * 24 * 365)}`),
  collections: getDirectories('src/pages').filter(i => i !== 'tags'),
  functions: {
    date: localdate
  },
  scripts: (v) => requireManifest(v) || v
}

module.exports = {
  data,
  loadCriticalCss: () => {
    loadCritical(data)
    return true
  }
}
