var SST = require('../')
var file = '/tmp/whatever-test.json.sst'
var pull = require('pull-stream')
var opts = require('optimist').argv
var test = require('tape')
var sst = SST(file)

function randomItem(array) {
  return array[~~(Math.random() * array.length)]
}

function collectObject (cb) {
  return pull.reduce(function (acc, item) {
    acc[item.key] = item.value
    return acc
  }, {}, cb)
}

sst.open(function (err) {

  sst.iterator()
    .pipe(collectObject(function (err, all) {

      var keys = Object.keys(all)
      console.log('KEYS', keys)

      function makeRandomGet() {
        var key = randomItem(keys)
        test('GET ' + JSON.stringify(key), function (t) {
          sst.get(key, function (err, data) {
            console.log('=>', data)
            t.equal(data, all[key])
            t.end()
          })
        })
      }

      var l = 100
      while(l--) makeRandomGet()

      function makeRandomRange() {
        var range = [randomItem(keys), randomItem(keys)].sort()
        var start = range.shift()
        var end   = range.shift()
        test('RANGE '
          + JSON.stringify(start)
          + ' - '
          + JSON.stringify(end), function (t) {
          sst.iterator({start: start, end: end})
            .pipe(collectObject(function (err, o) {
              //KEYs *must* be in order.
              var ks = Object.keys(o)
              t.deepEqual(ks, ks.slice().sort())

              ks.forEach(function (k) {
                t.equal(o[k], all[k])
              })
              t.end()
            }))
        })
      }

      var l = 10
      while(l--) makeRandomRange()

      function makeRandomReverse() {
        var range = [randomItem(keys), randomItem(keys)].sort()
        var start = range.shift()
        var end   = range.shift()
        test('RANGE '
          + JSON.stringify(start)
          + ' - '
          + JSON.stringify(end)
          + ' (reverse)', function (t) {

          sst.iterator({start: start, end: end})
            .pipe(pull.map('key'))
            .pipe(pull.collect(function (err, keys) {
              //KEYs *must* be in order.

              sst.iterator({start: start, end: end, reverse: true})
                .pipe(pull.map('key'))
                .pipe(pull.collect(function (err, _keys) {
                  //KEYs *must* be in order.
                  t.deepEqual(keys, _keys.reverse())
                  t.end()
                }))
            }))

        })
      }

      var l = 100
      while(l--) makeRandomReverse()

    }))
})
