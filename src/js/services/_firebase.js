import config from '../_config'
import { deep } from '../utils/_deep'
const cache = {}

const post = (path, data) => {
  const aux = {
    ...data,
    id: `${Date.now()}`,
    created_at: Date.now()
  }
  return fetch(`${config.host}/${path}.json`, {
    method: 'POST',
    body: JSON.stringify(aux)
  })
  .then(r => r.json())
}

const on = (resource) => {
  cache[resource] = {}
  const evs = new EventSource(`${config.host}/${resource}.json`)

  evs.addEventListener('error', (e) => {
    console.error('error', 'Error - connection was lost.')
  }, false)

  evs.addEventListener('patch', (e) => {
    const data = JSON.parse(e.data)
    deep(cache[resource], data.path, data.data)
  }, false)

  evs.addEventListener('put', (e) => {
    const data = JSON.parse(e.data)
    if (data.path === '/') {
      Object.assign(cache[resource], data.data)
    } else {
      deep(cache[resource], data.path, data.data)
    }
  }, false)

  return {
    evs,
    close: () => evs.close()
  }
}

export { post, on }
