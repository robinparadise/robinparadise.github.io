const { src, dest } = require('gulp')
const connect = require('gulp-connect')
const concatCss = require('gulp-concat-css')
const postcss = require('gulp-postcss')
const cssnano = require('cssnano')
const md5 = require('gulp-md5-plus')
const gdata = require('gulp-data')

const path = require('path')
const { data } = require('./data')

const css = () => src('src/css/*.css').pipe(postcss([])).pipe(dest('www/assets')).pipe(connect.reload())
const cssBuild = () => src('src/css/*.css')
  .pipe(concatCss('style.css'))
  .pipe(postcss([cssnano()]))
  .pipe(md5(10))
  .pipe(gdata((file, cb) => {
    data.style = path.basename([...file.history].pop())
    cb(undefined, file)
  }))
  .pipe(dest('www/assets'))

const assets = () => src('src/assets/*').pipe(dest('www/assets'))

module.exports = { css, cssBuild, assets }
