var randomName = require('random-name')
var shasum     = require('shasum')
var test       = require('tape')
var assert     = require('assert')
var fs         = require('fs')
var opts       = require('optimist').argv
var pull       = require('pull-stream')

try {
  fs.unlinkSync('/tmp/whatever-test.json.sst')
} catch (_) {}

var l = opts.n || 200, array = [], names = {}
while(l --) {
  var n = randomName(), d = new Date() + '_' + Math.random() + '-' + shasum(n)
  names[n] = d
  array.push({key: n, value: d })
}

array.sort(function (a, b) {
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0 
})

var it = pull.values(array)

var SST = require('../')
var sstFile = '/tmp/whatever-test.json.sst'
pull(it, SST.createStream(sstFile, function (err) {
  console.log('create')
  var sst = SST(sstFile)

  sst.open(function (err) {
    console.log('SST')
    test('forward', function (t) {
      var it = sst.iterator()
      t.plan(opts.n || 200)
      var i = 0

      pull(
        it,
        pull.through(console.log),
        pull.drain(function (item) {
          t.deepEqual(item, array[i++])
        }, function () {
          return t.end()
        })
      )

    })

    test('reverse', function (t) {
      var it = sst.iterator({reverse: true})

      t.plan(opts.n || 200)

      var i = array.length

      pull(it, pull.drain(function (item) {
          --i
          t.deepEqual(item, array[i])
          assert.deepEqual(item, array[i])
      }, function () {
        return t.end()
      }))

    })
  })

}))
