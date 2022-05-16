const isPrimitive = (val: any) => {
  if (val === null || val === undefined) {
    return true
  }
  if (typeof val === 'object' || typeof val === 'function') {
    return false
  } else {
    return true
  }
}
const deep = (obj: any, path: string, val: any) => {
  return path.split('/').filter(Boolean).reduce((prev, curr) => {
    if (val === null) {
      prev[curr] = val
    } else if (isPrimitive(prev[curr])) {
      prev[curr] = val
    } else {
      prev[curr] = prev[curr] || {}
    }
    return prev && prev[curr]
  }, obj) || ''
}

export { deep }