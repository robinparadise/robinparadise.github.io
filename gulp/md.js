const { src, dest } = require('gulp')
const njk = require('gulp-nunjucks-render')
const connect = require('gulp-connect')
const markdown = require('gulp-markdown')
const grayMatter = require('gulp-gray-matter')
const gdata = require('gulp-data')
const cache = require('gulp-cached')
const gulpif = require('gulp-if')
const { dirname, dir, requireF, basename } = require('./utils')

const { data } = require('./data')
const { layouts } = require('./layouts')

const condition = file => file.path.includes('/pages')

const md = (_, force) => src(['src/pages/**/*.md'])
  .pipe(gulpif(force ? false : condition, cache({ optimizeMemory: true })))
  .pipe(grayMatter())
  .pipe(markdown())
  .pipe(gdata((file, cb) => {
    const { contents, ...more } = file
    const json = requireF(`${dir(file.path)}/${dirname(file.path)}.json`)
    json.page = basename(dirname(file.path))
    Object.assign(file.data, json)
    file.data = { ...json, ...file.data }
    file.data.layout = file.data.layout || 'base'
    file.contents = new Buffer.from(layouts(file.data.layout)
      .replace(`{{ content | safe }}`, `<div class="markdown-body">${String(file.contents)}</div>`))
    cb(undefined, file)
  }))
  .pipe(njk({ path: ['src'], data }))
  .pipe(dest('www'))
  .pipe(connect.reload())

module.exports = { md }