const fs = require('fs')

const layouts = layout => fs.readFileSync(`src/layouts/${layout || 'base'}.html`).toString()

module.exports = { layouts }