const { src, dest } = require('gulp')
const gulpif = require('gulp-if')
const markdown = require('gulp-markdown')
const njk = require('gulp-nunjucks-render')
const gdata = require('gulp-data')
const prism = require('prismjs')
const { preprocess } = require('./preprocess')
const { liteMatter } = require('./liteMatter')
const { langs, data } = require('../context')
const { collection } = require('../utils/fm2json')
const { localdate } = require('../utils/localdate')

const allowEmpty = true
const nodir = true

const highlight = (code, lang, cb) => {
  return lang ? cb(undefined, prism.highlight(code, prism.languages[lang], 'javascript')) : cb(undefined, code)  
}

const manageEnv = (environment) => {
  environment.addFilter('date', localdate)
}

let production = false
const unique = arr => [...new Set(arr)]
const www = (file) => {
  if (production) {
    return 'www' + file.data.langPath
  } else {
    return 'www' + unique(file.data.url.split('/').slice(0, -1)).join('/')
  }
}

const wwwTags = (file) => {
  return 'www' + unique(file.data.url.split('/').slice(0, -1)).join('/')
}


const html = (path = 'src/pages/**/*.+(html|md)') => {
  production = path === 'src/pages/**/*.+(html|md)'
  const isMdCondition = (file) => {
    const isMd = file.path.includes('.md')
    file.data.md = isMd
    return isMd
  }

  const promises = langs().map(lang => {
    return new Promise(resolve => {
      src([path, '!src/pages/tags/:tag.html'], { allowEmpty, nodir })
      .pipe(liteMatter(lang))
      .pipe(gulpif(isMdCondition, markdown({ highlight })))
      .pipe(preprocess(lang))
      .pipe(njk({ path: ['src'], manageEnv }))
      .pipe(dest(www))
      .on('end', resolve)
    })
  })
  return Promise.all(promises)
}

const tags = async () => {
  const promises = []
  const promisesCollections = data.collections.map((...args) => collection(...args))

  const fm = []
  const tags = []
  await Promise.all(promisesCollections).then(collections => {
    collections.map((frontmatters, i) => {
      frontmatters.map(({ data }) => {
        ;(data.tags || []).map(tag => {
          fm[tag] ||= []
          fm[tag].push(data)
          tags.push(tag)
        })
      })
    })
  })

  const uniqueTags = [...new Set(tags)]

  uniqueTags.map((tag) => {
    promises.push(...langs().map(lang => {
      return new Promise(resolve => {
        src(['src/pages/tags/:tag.html'], { allowEmpty, nodir })
        .pipe(liteMatter(lang, tag))
        .pipe(preprocess(lang))
        .pipe(gdata((file, cb) => {
          file.data.filtered = fm[tag]
          cb(undefined, file)
        }))
        .pipe(njk({ path: ['src'], manageEnv }))
        .pipe(dest(wwwTags))
        .on('end', resolve)
      })
    }))
  })
  return Promise.all(promises)
}

module.exports = { html, tags }
