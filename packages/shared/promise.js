const eventHelper = require("./eventHelper")
const { asArray } = require("./functions")

function deferral() {
  var resolve, reject
  var promise = new Promise(function() {
    resolve = arguments[0]
    reject = arguments[1]
  })
  return {
    resolve: resolve,
    reject: reject,
    promise: promise,
  }
}

function deferralReference (value){
  const { resolve:bootResolve, reject:bootReject, promise: boot } = deferral()
  let deferralEvents = {fullfill:[]};
  let fullfillDeferral = false;

  function resolve (value){
    if(fullfillDeferral === true) return
    deferralEvents.fullfill
    fullfillDeferral = true
    deferralEvents.fullfill.forEach((fn)=>fn());
    deferralEvents = null;
    bootResolve(value)
  }

  function reject (error){
    if(fullfillDeferral === true) return
    fullfillDeferral = true
    deferralEvents.fullfill.forEach((fn)=>fn());
    deferralEvents = null;
    bootReject(error)
  }

  const promise = new Promise((resolve, reject) => {
    boot.then((deferralResult) => {
      resolve(deferralResult)
    }).catch(reject)
  })

  async function finish (fn){
    let result = deferralObject.value;
    if(typeof fn === "function"){
      try {
        result = await fn(result)
      } catch(error){
        reject(error)
      }
    }
    resolve(result)
    return boot
  }

  function use (fn){
    function onBeforeFullfill (fn){
      typeof fn === "function" && deferralEvents.fullfill.push(fn)
    }
    if(typeof fn === "function"){
      try {
        fn({ onBeforeFullfill, finish, resolve, reject })
      } catch(error){
        reject(error)
      }
    }
    return deferralObject
  }

  const deferralObject = {
    resolve,
    reject,
    promise,
    value,
    finish,
    use,
  }

  return deferralObject
}

function timeoutPromise (wait = 0) {
  const time = Date.now()
  if (typeof wait !== 'number') {
    throw new Error('timeoutPromise::wait time must be number')
  }
  return new Promise(resolve => setTimeout(() => resolve({ wait, time, now: Date.now() }), wait))
}

function sequentialForEach (sequentialData, sequentialFn, option){
  
  const concurrent = typeof option === "object" && option && typeof option.concurrent === 'number' ? option.concurrent : 1
  const reservedWorks = [...asArray(sequentialData)].map((data, index) => {
    return { data, index, handler: () => Promise.resolve(sequentialFn(data, index)) }
  })
  const totalValue = reservedWorks.length
  const sequentialResult = Array.from({ length: totalValue })

  const promise = new Promise((resolve, reject) => {
    if (reservedWorks.length === 0) {
      return resolve()
    }

    const sequentialEvnet = eventHelper(typeof option === "object" && option && option.on)
    const shiftEvent = eventHelper({
      start: () => {
        if (isFullfill === true) return
        retainCount++
        if (reservedWorks.length > 0 && retainCount < concurrent) {
          shiftCall()
        }
      },
      end: ({ data, index, result }) => {
        retainCount--
        progressValue++
        if (isFullfill === true) return
        sequentialEvnet.emit('progress', {
          data,
          index,
          result,
          totalValue,
          progressValue,
        })
        if (reservedWorks.length !== 0 && retainCount < concurrent) {
          shiftCall()
        } else if (retainCount === 0 && reservedWorks.length === 0 && isFullfill === false) {
          isFullfill = true
          resolve(sequentialResult)
          sequentialEvnet.emit('success', {
            totalValue,
            progressValue,
          })
        }
      },
    })

    let progressValue = 0
    let retainCount = 0
    let isFullfill = false

    function shiftCall() {
      const worker = reservedWorks.shift()
      Promise.resolve(worker)
        .then(props => {
          const { data, index } = props
          shiftEvent.emit('start', { data, index })
          return props
        })
        .then(props => {
          const { handler, data, index } = props
          return handler().then(result => {
            sequentialResult[index] = result
            return {
              data,
              index,
              result,
            }
          })
        })
        .catch(error => {
          isFullfill = true
          reject(error)
          return new Promise(() => {})
        })
        .then(({ data, index, result }) => {
          shiftEvent.emit('end', { data, index, result })
        })
    }
    shiftCall()
  })
  promise.then(() => sequentialResult)
  return promise
}

function withSequentialFire (fn){
  const queue = []
  let current = null

  function touchTick() {
    if (!current && queue.length) {
      const currentQueue = queue.shift()
      const { args, deferred } = currentQueue
      current = currentQueue

      const tickPromise = new Promise((resolve, reject) => {
        try {
          const result = fn(...args)
          resolve(result)
        } catch (e) {
          reject(Promise.reject(e).catch(() => e))
        }
      })

      tickPromise.then(deferred.resolve).catch(deferred.reject)
    }
  }

  const sequentiallyFn = (...args) => {
    const deferred = deferral()

    //let resolvedDefer = null
    deferred.promise
      .then(result => {
        current = null
        setTimeout(touchTick, 0)
        return result
      })
      .catch(error => {
        current = null
        setTimeout(touchTick, 0)
        return Promise.reject(error)
      })

    queue.push({ args, deferred })
    touchTick()
    return deferred.promise
  }

  return sequentiallyFn
}

module.exports = {
  deferral,
  deferralReference,
  timeoutPromise,
  sequentialForEach,
  withSequentialFire
}