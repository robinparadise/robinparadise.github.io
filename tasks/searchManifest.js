const fs = require('fs')
const { data } = require('../context')
const { collection } = require('../utils/fm2json')

const searchManifest = async () => {

  if (!data?.collection?.$all) {
    const promises = data.collections.map(c => collection(c)) // projects, blog
    await Promise.all(promises)
    .then(collections => {
      collections.map((frontmatters, i) => {
        const key = data.collections[i]
        data.collection ||= {}
        data.collection[key] = frontmatters.map(fm => fm.data)

        data.collection.$all ||= []
        data.collection.$all.push(...frontmatters.map(fm => fm.data))

        frontmatters.map(({ fm }) => {
          (fm?.tags || []).map(t => {
            data.collection.$count ||= {}
            data.collection.$count[t] ||= 0
            data.collection.$count[t] += 1
          })
        })
      })
    })
  }
  const all = data.collection.$all.map(doc => {
    const aux = {}

    Object.keys(doc).map(key => {
      if (key.includes('title') || key.includes('description') || key.includes('tags') || key.includes('url')) {
        aux[key] = doc[key]
      }
    })
    return aux
  })

  fs.writeFileSync('./www/assets/search.json', JSON.stringify(all))
  return true
}

module.exports = {
  searchManifest
}