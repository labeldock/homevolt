const { isArray, asArray, isPlainObject } = require('./functions')
const { sessionStorage, localStorage } = window

const polyfillSetObjectStorage = (objectStorage, key, value) => {
  if (typeof objectStorage.setItem === 'function') {
    objectStorage.setItem(key, value)
  } else {
    objectStorage[key] = value
  }
}

const polyfillGetObjectStorage = (objectStorage, key) => {
  if (typeof objectStorage.getItem === 'function') {
    return objectStorage.getItem(key)
  } else {
    return objectStorage[key]
  }
}

const polyfillRemoveObjectStorage = (objectStorage, key) => {
  if (typeof objectStorage.getItem === 'function') {
    objectStorage.removeItem(key)
  } else {
    delete objectStorage[key]
  }
}

export const setObject = (objectStorage, key, value) => {
  //첫번째 매개변수가 오브젝트일때
  if (isPlainObject(key)) {
    const object = key
    return Object.keys(object).reduce((dest, key) => {
      //두번째 매개변수가 함수일때
      if (typeof value === 'function') {
        const keyTransformer = value
        const transformedKey = keyTransformer(key, object[key])
        if (typeof transformedKey === 'string') {
          polyfillSetObjectStorage(objectStorage, transformedKey, object[key])
          dest[transformedKey] = object[key]
        }
      } else {
        polyfillSetObjectStorage(objectStorage, key, object[key])
        dest[key] = object[key]
      }
      return dest
    }, {})
  }
  polyfillSetObjectStorage(objectStorage, key, value)
}
export const getObject = (objectStorage, key) => {
  if (isArray(key)) {
    return key.reduce((dest, key) => {
      if (typeof key === 'string') {
        dest[key] = polyfillGetObjectStorage(objectStorage, key)
      }
      return dest
    }, {})
  }
  return polyfillGetObjectStorage(objectStorage, key)
}

export const removeObject = (objectStorage, key) => {
  if (typeof key === 'string') {
    delete objectStorage[key]
  }

  if (isArray(key)) {
    return key.reduce((dest, key) => {
      const deletedValue = objectStorage[key]
      dest[key] = deletedValue
      polyfillRemoveObjectStorage(objectStorage, key)
      return dest
    }, {})
  }
}

export const setSession = (...args) => setObject(...[sessionStorage, ...args])
export const getSession = (...args) => getObject(...[sessionStorage, ...args])
export const getSessionJSON = (...args) => {
  try {
    return JSON.parse(getSession(...args))
  } catch (e) {
    const keyname = args[0]
    if (sessionStorage.hasOwnProperty(keyname)) {
      console.error(`sessionStorage의 ${keyname}은 JSON 형식이 아닙니다`, e, sessionStorage[keyname])
      return null
    } else {
      return undefined
    }
  }
}
export const setSessionJSON = (key, value) => {
  if (typeof value !== 'object') {
    throw new Error(`setSessionJSON::${key}는 오브젝트가 아닙니다.`)
  }
  const stringJSON = JSON.stringify(value)
  setSession(key, stringJSON)
  return value
}
export const getSessionArray = (...args) => asArray(getSessionJSON(...args))
export const removeSession = (...args) => removeObject(...[sessionStorage, ...args])
export const setLocal = (...args) => setObject(...[localStorage, ...args])
export const getLocal = (...args) => getObject(...[localStorage, ...args])
export const getLocalJSON = (...args) => {
  try {
    return JSON.parse(getLocal(...args))
  } catch (e) {
    const keyname = args[0]
    if (localStorage.hasOwnProperty(keyname)) {
      console.error(`localStorage의 ${keyname}은 JSON 형식이 아닙니다`, e, localStorage[keyname])
      return null
    } else {
      return undefined
    }
  }
}
export const setLocalJSON = (key, value) => {
  if (typeof value !== 'object') {
    throw new Error(`setLocalJSON::${key}는 오브젝트가 아닙니다.`)
  }
  const stringJSON = JSON.stringify(value)
  setLocal(key, stringJSON)
  return value
}
export const getLocalArray = (...args) => asArray(getLocalJSON(...args))
export const removeLocal = (...args) => removeObject(...[localStorage, ...args])
