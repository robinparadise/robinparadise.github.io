const path = require('path')

const dirname = (p) => path.basename(path.dirname(p))
const dir = (p) => path.dirname(p)
const basename = (p) => path.parse(p).name
const requireF = (path) => {
  try {
    return require(path)
  }
  catch (e) {
    return {}
  }
}

module.exports = {
  dirname,
  dir,
  requireF,
  basename
}