var blockIterator = require('../block-iterator')
var u             = require('../util')
var readIterator  = u.iteratorReader

var fs = require('fs')
var shasum = require('shasum')
var test = require('tape')

var pull = require('pull-stream')

var file = '/tmp/whatever-test.json.sst'
fs.stat(file, function (err, stat) {
  fs.open(file, 'r', function (err, fd) {
      stat.fd = fd

    test('forward, backward, blocks, json', function (t) {
      var fore, rev

      var bi = blockIterator(stat)
      console.log('read iterator', bi)
  
      readIterator(bi, function (err, array) {
        fore = array.map(function (e) {return shasum(e)})
        console.log('FORWARD', fore)
        if(fore && rev) next()
      })
    
      readIterator(blockIterator(stat, {reverse: true}), function (err, array) {
        rev = array.map(function (e) {return shasum(e)})
        console.log('REVERSE', rev)
        if(fore && rev) next()
      })

      function next () {
        t.deepEqual(fore, rev.reverse())
        t.end()
      }
    })

    test('json: forward, backward', function (t) {
      blockIterator(stat)
      .pipe(u.json())
      .pipe(pull.writeArray(function (err, fore) {

        blockIterator(stat, {reverse: true})
        .pipe(u.json(true))
        .pipe(pull.filter())
        .pipe(pull.writeArray(function (err, rev) {
          t.deepEqual(fore, rev.reverse())
          t.end()
        }))
      }))
    })
  })
})
