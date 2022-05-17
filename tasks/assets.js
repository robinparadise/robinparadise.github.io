const path = require('path')
const { src, dest } = require('gulp')
const connect = require('gulp-connect')
const md5 = require('gulp-md5-plus')
const gdata = require('gulp-data')
const { data } = require('../utils')

const postcss = require('gulp-postcss')
const pimport = require('postcss-import')
const cssnano = require('postcss-csso')

const css = () => src('src/css/*.css').pipe(dest('www/assets')).pipe(connect.reload())
const cssBuild = () => src('src/css/style.css')
  .pipe(postcss([pimport(), cssnano({ restructure: false })]))
  .pipe(md5(10))
  .pipe(gdata((file, cb) => {
    data.style = path.basename([...file.history].pop())
    cb(undefined, file)
  }))
  .pipe(dest('www/assets'))

const assets = () => src('src/assets/*').pipe(dest('www/assets'))

module.exports = { css, cssBuild, assets }
