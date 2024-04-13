const { basename, requireJSON, pwd } = require('../utils')
const { layouts, context } = require('../context')
const { collection } = require('../utils/fm2json')
const gdata = require('gulp-data')

const preprocessCall = async (file, cb, lang) => {
  const isMd = file.data.md
  const isTag = file.path.includes('/tags/')
  file.data.page = isMd || isTag ? basename(pwd(file.path)) : basename(file.path)
  file.data.path = `${file.path.split('/src/pages/').pop()}`
  file.data.langPath = lang ? `/${lang}` : ''
  file.data.url = isMd || isTag ? `${file.data.langPath}/${file.data.path}` : `${file.data.langPath}/${file.data.page}`

  const json = requireJSON(`${pwd(file.path)}.json`)

  file.data = { ...context({lang}), ...json, ...file.data }

  if (file.data.collections) {
    const promises = file.data.collections.map(c => collection(c)) // projects, blog

    await Promise.all(promises)
    .then(collections => {
      collections.map((frontmatters, i) => {
        const key = file.data.collections[i]
        file.data.collection ||= {}
        file.data.collection[key] = frontmatters.map(fm => fm.data)

        file.data.collection.$all ||= []
        file.data.collection.$all.push(...frontmatters.map(fm => fm.data))

        frontmatters.map(({ data }) => {
          (data.tags || []).map(t => {
            file.data.collection.$count ||= {}
            file.data.collection.$count[t] ||= 0
            file.data.collection.$count[t] += 1
          })
        })
      })
    })
  }

  const raw = String(file.contents)
    .replaceAll('&quot;', '"')
    .replace(/<.*>{%/g, '{%')
    .replace(/%}<\/.*>/g, '%}')
    .replaceAll('%7B%7B', '{{')
    .replaceAll('%7D%7D', '}}')
    .replaceAll('<a href="{{link}}"', '<a target=_blank rel="noopener noreferrer" href="{{link}}"')

  const content = isMd ? `<div class="markdown-body">${raw}</div>` : raw

  file.contents = new Buffer.from(
    layouts(file.data.layout).replace(`{{ content | safe }}`, content)
  )
  return cb(undefined, file)
}

const preprocess = (lang) => {
  return gdata((file, cb) => preprocessCall(file, cb, lang))
}

module.exports = {
  preprocess
}