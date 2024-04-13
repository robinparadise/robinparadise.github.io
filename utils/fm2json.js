const path = require('path')
const MS = 1000
const defaultLang = require('../context')

const fm2json = (data, file, lang) => {
  let attributes = {}
  let content = ''

  if ( !data ) return { data: {}, content: '' }

  const start = data.slice(0, 10).trim()

  const [_, match, ...body] = start.startsWith('---\n') ? data.split('---') : [, '', data]

  if (match && match.length) {
    const items = match.split('\n').filter(Boolean)
    items.map(item => {
      const [key, ...val] = item.split(':')
      const raw = val.join(':').trim()
      try {
        attributes[key] = eval(raw)
      } catch(_) {
        attributes[key] = raw
      }
    })
    if (lang && lang !== defaultLang) {
      Object.keys(attributes)
      .filter(k => k.endsWith(`.${lang}`))
      .map(key => {
        const [k] = key.split('.')
        attributes[k] = attributes[key]
      })
    }
    content = body.join('---')
  } else {
    attributes = {}
    content = data
  }
  attributes.url = file.replace('.md', '.html')
  attributes.langPath = lang ? `/${lang}` : ''
  return { data: attributes, content }
}

const cache = {}
const readFile = path => {
  const now = Date.now()
  if (cache[path]) {
    const old = now - cache[path].time > MS
    if (!old) {
      cache[path].time = now
      return cache[path].data
    }
  }
  cache[path] = {
    data: require('fs').promises.readFile(path, 'utf-8'),
    time: now
  }
  return cache[path].data
}

const dirs = {}
const readDirs = (dir) => {
  if (!dirs[dir] || (dirs[dir] && Date.now() - dirs[dir].time > MS)) {
    const onlyFiles = /(md|html)$/
    const files = require('fs').readdirSync(dir).filter(i => i.match(onlyFiles))
    dirs[dir] = {
      time: Date.now(),
      data: files
    }
    return dirs[dir].data
  }
  return dirs[dir].data
}

const collections = {}
const collection = (name, lang) => {
  const dir = `${__dirname}/../src/pages/${name}`
  if (!collections[dir] || (collections[dir] && Date.now() - collections[dir].time > MS)) {
    const files = readDirs(dir)

    const promises = files.map((basename, i) => {
      return readFile(`${dir}/${basename}`)
      .then((file) => fm2json(file, path.join('/', name, basename), lang))
    })

    collections[dir] = {
      time: Date.now(),
      data: Promise.all(promises)
    }
    return collections[dir].data
  }
  return collections[dir].data
}

module.exports = { collection, fm2json }
