const { src, dest } = require('gulp')
const njk = require('gulp-nunjucks-render')
const connect = require('gulp-connect')
const grayMatter = require('gulp-gray-matter')
const gdata = require('gulp-data')
const cache = require('gulp-cached')
const gulpif = require('gulp-if')
const { basename, layouts, data, condition } = require('../utils')

const html = (_, force) => src('src/pages/**/*.html')
  .pipe(gulpif(force ? false : condition, cache({ optimizeMemory: true })))
  .pipe(grayMatter())
  .pipe(gdata((file, cb) => {
    Object.assign(file.data, { page: basename(file.path) })
    file.contents = new Buffer.from(layouts(file.data.layout)
      .replace(`{{ content | safe }}`, String(file.contents)))
    cb(undefined, file)
  }))
  .pipe(njk({ path: ['src'], data }))
  .pipe(dest('www'))
  .pipe(connect.reload())

module.exports = { html }