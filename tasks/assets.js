const fs = require('fs')
const { src, dest } = require('gulp')

const assets = () => src('src/assets/**')
  .pipe(dest('www/assets'))

const robots = (done) => fs.writeFile('./www/robots.txt', `User-agent: *
Allow: /
`, () => done())

module.exports = { assets, robots }
