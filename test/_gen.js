var randomName = require('random-name')
var Iterator   = require('async-iterator')
var shasum     = require('shasum')
var test       = require('tape')
var assert     = require('assert')
var fs         = require('fs')

try {
  fs.unlinkSync('/tmp/whatever-test.json.sst')
} catch (_) {}

var l = 200, array = [], names = {}
while(l --) {
  var n = randomName(), d = new Date() + '_' + Math.random() + '-' + shasum(n)
  names[n] = d
  array.push({key: n, value: d })
}

array.sort(function (a, b) {
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0 
})

var it = Iterator(function (i, cb) {
  cb(null, array[i])
})

var SST = require('../')
var dbDir = '/tmp/whatever-test.json.sst'
SST.createSST(dbDir, it, function (err) {

  SST(dbDir, function (err, sst) {

    test('forward', function (t) {
      var it = sst.iterator()
      t.plan(200)
      var i = 0

      ;(function next () {
        it.next(function (err, item) {
          if(item == null)
            return t.end()

          t.deepEqual(item, array[i++])
          next()
        })
      })();

    })

    test('reverse', function (t) {
      var it = sst.iterator({reverse: true})
      t.plan(200)

      var i = array.length

      ;(function next () {
        it.next(function (err, item) {
          if(item == null)
            return t.end()
          --i

          t.deepEqual(item, array[i])
          assert.deepEqual(item, array[i])
          next()
        })
      })();

    })
  })

})

