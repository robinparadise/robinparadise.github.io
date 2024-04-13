const path = require('path')

const join = (...a) => path.join(...a)
const dirname = p => path.basename(path.dirname(p))
const pwd = p => path.dirname(p)
const basename = p => path.parse(p).name
const requireJSON = path => {
  try {
    return require(path)
  }
  catch (e) {
    return {}
  }
}

module.exports = {
  requireJSON,
  join,
  dirname,
  pwd,
  basename
}
