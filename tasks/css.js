const path = require('path')
const { src, dest } = require('gulp')
const md5 = require('gulp-md5')
const gdata = require('gulp-data')
const { data } = require('../context')
const postcss = require('gulp-postcss')
const pimport = require('postcss-import')
const cssnano = require('postcss-csso')
const nested = require('postcss-nested')
const { reload } = require('./app')

const css = () => src('src/css/*.css')
  .pipe(postcss([nested()]))
  .pipe(dest('www/assets'))
  .on('end', () => reload({ css: true }))
  
const cssBuild = () => src('src/css/style.css')
  .pipe(postcss([pimport(), nested(), cssnano({ restructure: false })]))
  .pipe(md5({ size: 16 }))
  .pipe(gdata((file, cb) => {
    data.style = path.basename([...file.history].pop())
    cb(undefined, file)
  }))
  .pipe(dest('www/assets'))

module.exports = { css, cssBuild }
