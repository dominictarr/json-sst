var pull   = require('pull-stream')
var tape   = require('tape')
var sst  = require('../')
var path   = require('path')
var tmpdir = require('osenv').tmpdir()
var fs     = require('fs')

function sortKeys(obj) {
  var o = {}
  Object.keys(obj).sort().forEach(function (key) {
    o[key] = obj[key]
  })
  return o
}

function isSorted() {
  var max
  return pull.map(function (data) {
    if(!max) 
      max = data.key
    else if(data.key < max) throw new Error('out of order')
    return data
  })
}


function create(name, cb) {
  var filename = path.join(tmpdir, name)
  fs.unlink(filename, function () {
    var db = Logdb(filename)
    db.open(cb)
  })
}

function cmp (a, b) {
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
}

function compare(t, a, b) {
  for(var k in a)
    if(!b[k]) t.ok(false, k + ' is extra')
  for(var k in b)
    if(!a[k]) t.ok(false, k + ' is missing')
}

tape('dump lots of data', function (t) {
  var filename = path.join(tmpdir, 'test-sst-bulk')

  fs.unlink(filename, function () {

    var input = {}
    pull(
      pull.count(100000),
      pull.map(function (e) {
        return { key: '*' + Math.random(), value: {count: e, ts: Date.now()} }
      }),
      pull.through(function (e) {
        input[e.key] = e.value
      }),
      pull.collect(function (err, ary) {
        if(err) throw err
        pull(
          pull.values(ary.sort(cmp)),
          sst.createStream(filename, function (err, db) {

            if(err) throw err
            input = sortKeys(input)
            var output = {}
            console.log('now read...')
            pull(
              db.createReadStream(),
              isSorted(),
              pull.through(function (data) {
                if(Math.random() < 0.01)
                  console.log(data.key)
                output[data.key] = data.value
              }),
              pull.drain(null, function () {
                console.log('done')
//                t.deepEqual(output, input)
                compare(t, output, input)
                console.log('done')
                t.end()
              })
            )
          })
        )
      })
    )
  })
})
