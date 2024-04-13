const gdata = require('gulp-data')

const { context } = require('../context')
const { fm2json } = require('../utils/fm2json')

const liteMatter = (file, cb, lang, tag = null) => {
  const { data, content } = fm2json(String(file.contents), file.path, lang)
  file.data = { ...context({lang}), ...data, ...file.data }

  if (tag) {
    file.path = file.path.replace(':tag.html', `${tag}.html`)

    file.data.page = 'tags'
    file.data.tag = tag
    file.data.title = tag
  }
  file.contents = new Buffer.from(content)
  cb(undefined, file)
}

module.exports = {
  liteMatter: (...args) => gdata((file, cb) => liteMatter(file, cb, ...args))
}