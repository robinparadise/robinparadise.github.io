// @ts-nocheck
const fs = require('fs')
const path = require('path')
const { src, dest } = require('gulp')
const md5 = require('gulp-md5')
const gdata = require('gulp-data')
const rollupEach = require('gulp-rollup-each')
const { data } = require('../context')
const postcss = require('gulp-postcss')
const pimport = require('postcss-import')
const cssnano = require('postcss-csso')
const nested = require('postcss-nested')
const { reload } = require('./app')

const rollupStream = require('@rollup/stream')
const buffer = require('vinyl-buffer')
const gulp = require('gulp')
const source = require('vinyl-source-stream')

const { terser } = require('rollup-plugin-terser')

const webpack = require('webpack-stream')

const js = () => src(['src/js/**/*.js'])
  .pipe(dest('www/assets'))
  .on('end', () => {
    data.scripts = (val) => val
    reload({ js: true })
  })

const jsWebpack = () => src('src/js/lit-index.js')
  .pipe(webpack({
    mode: 'development',
    webpackMode: 'lazy',
    output: {
      filename: 'lit-index.js'
    }
  }))
  .pipe(gulp.dest('www/assets'));

let cache;
const jsRollup = () =>
  rollupStream({
    input: 'src/js/lit-index.js',
    cache
  })
  .on('bundle', (bundle) => {
    cache = bundle
  })
  .pipe(source('bundle.js'))
  .pipe(buffer())
  .pipe(dest('www/assets'))

const scripts = {}
const jsBuild = () => src([
    'src/js/**/*.js',
  ])
  .pipe(rollupEach(
    {
      plugins: [terser()],
      isCache: true // enable Rollup cache
    },
    file => {
      return {
        format: 'es',
        compact: true,
        chunkFileNames: '[name]-[hash].js'
        // name: path.basename(file.path, '.js')
      }
    }
  ))
  // .pipe(md5({ size: 8 }))
  .pipe(buffer())
  .pipe(gdata((file, cb) => {
    console.log({p: file.path})
    const basename = path.basename(file.history[0])
    const distname = path.basename([...file.history].pop())
    scripts[basename] = distname

    data.scripts = (val) => scripts[val]

    cb(undefined, file)
  }))
  .pipe(dest('www/assets'))
  .on('end', () => console.log(scripts))

module.exports = { js, jsBuild, jsRollup, jsWebpack }
