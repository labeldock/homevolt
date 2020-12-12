const { isPlainObject, asArray, isText, generateUUID } = require('./functions') 

const badgeDefault = 'background-color:default;color:default;border-radius:default;'
const badgeGrayStyle = 'background-color:gray;color:white;border-radius:4px;padding:0 4px 0 4px;'
const badgePrimaryStyle = 'background-color:blue;color:white;border-radius:4px;padding:0 4px 0 4px;'
const badgeDangerStyle = 'background-color:red;color:white;border-radius:4px;padding:0 4px 0 4px;'
const badgeWarningStyle = 'background-color:yellow;color:black;border-radius:4px;padding:0 4px 0 4px;'

// on emit 스타일 이벤트 헬퍼
class EventHelperClass {
  listeners = {}
  traceDebug = false

  constructor(events) {
    if (isPlainObject(events)) {
      for (const key in events) {
        this.on(key, events[key])
      }
    }

    // trace debug
    let _traceDebug = this.traceDebug
    Object.defineProperty(this, 'traceDebug', {
      enumerable: false,
      get() {
        return _traceDebug
      },
      set(aTraceDebug) {
        const enabled = Boolean(aTraceDebug)
        if (enabled) {
          console.log(`enabled traceDebug => %c${aTraceDebug}`, badgeGrayStyle, this)
          _traceDebug = aTraceDebug
        } else {
          console.log(`disabled traceDebug => ${_traceDebug}`)
          _traceDebug = false
        }
      },
    })
  }
  clone() {
    return new EventHelperClass(this.listeners)
  }
  on(key, eventFns) {
    const { listeners, traceDebug } = this
    const addTargets = asArray(eventFns)

    if (!listeners[key]) listeners[key] = []

    addTargets.forEach(fn => {
      if (typeof fn === 'function') {
        listeners[key] = [...listeners[key], fn]
      } else {
        throw new Error('Event listener는 반드시 function 이여야 합니다.', key, eventFns)
      }
    })

    if (traceDebug) {
      console.log(
        `%c${traceDebug}%c %con%c ${key} +[${addTargets.length}] =[${listeners[key].length}]`,
        badgeGrayStyle,
        badgeDefault,
        badgePrimaryStyle,
        badgeDefault,
      )
    }

    return this
  }
  off(key, eventFns) {
    const { listeners, traceDebug } = this
    const removeTargets = asArray(eventFns)

    removeTargets.forEach(fn => {
      if (typeof fn === 'function') {
        const beforeOffLength = traceDebug && listeners[key] ? listeners[key].length : 0

        if (listeners[key]) {
          listeners[key] = listeners[key].filter(event => event !== fn)
        }

        if (traceDebug) {
          const afterOffLength = listeners[key] ? listeners[key].length : 0
          const removeFnsLength = removeTargets.length
          const removedLength = beforeOffLength - afterOffLength
          console.log(
            `%c${traceDebug}%c %coff%c ${key} before[${beforeOffLength}] payload[${removeFnsLength}] removed[${removedLength}] =[${afterOffLength}]`,
            badgeGrayStyle,
            badgeDefault,
            badgeDangerStyle,
            badgeDefault,
          )
        }
      } else {
        throw new Error('Event listener는 반드시 function 이여야 합니다.', key, eventFns)
      }
    })
    return this
  }
  once(key, eventFns) {
    const self = this
    const wrapFns = asArray(eventFns)
      .map(fn => {
        if (typeof fn !== 'function') {
          return undefined
        }
        return function wrapFn(...values) {
          fn(...values)
          self.off(key, fn)
        }
      })
      .filter(Boolean)
    self.on(key, wrapFns)
    return self
  }
  ticket(handler){
    const ticketId = generateUUID();
    this.once(ticketId, handler);
    return ticketId;
  }
  emit(key, ...values) {
    const { listeners, traceDebug } = this
    const targets = asArray(listeners[key])

    if (traceDebug) {
      console.log(
        `%c${traceDebug}%c %cemit%c ${key} listener[${targets.length}]`,
        badgeGrayStyle,
        badgeDefault,
        badgeWarningStyle,
        badgeDefault,
        asArray(values),
      )
    }

    const result = targets.map(fn => fn(...values))
    return result
  }
  trigger(key, values) {
    const { listeners, traceDebug } = this
    const targets = asArray(listeners[key])

    if (traceDebug) {
      console.log(
        `%c${traceDebug}%c %ctrigger%c ${key} listener[${targets.length}]`,
        badgeGrayStyle,
        badgeDefault,
        badgeWarningStyle,
        badgeDefault,
        asArray(values),
      )
    }

    const parameters = asArray(values)
    const result = targets.map(fn => fn(...parameters))
    return result
  }
  getListeners(key) {
    if (!isText(key)) {
      return []
    }
    return asArray(this.listeners[key]).slice(0)
  }
  offEvents(key) {
    const { listeners, traceDebug } = this

    if (typeof key === 'string' && listeners[key]) {
      const beforeOffLength = traceDebug && listeners[key] ? listeners[key].length : 0

      listeners[key] = []

      if (traceDebug) {
        console.log(
          `%c${traceDebug}%c %coffEvents%c ${key} removed[${beforeOffLength}] =[0]`,
          badgeGrayStyle,
          badgeDefault,
          badgeDangerStyle,
          badgeDefault,
        )
      }
    }
  }
  cleanListeners() {
    const { listeners } = this
    const cleanedListeners = {}
    for (const key in listeners) {
      this.offEvents(key)
    }
    this.listeners = cleanedListeners
    return this
  }
  destroy() {
    this.listeners = null
    return null
  }
}

const eventHelper = (...params) => new EventHelperClass(...params)

eventHelper.EventHelper = EventHelperClass

module.exports = eventHelper
