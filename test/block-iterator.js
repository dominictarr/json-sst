var BlockIterator = require('../block-iterator')

var fs = require('fs')
var shasum = require('shasum')
var test = require('tape')

var pull = require('pull-stream')
var split = require('pull-split')

var readIterator = require('../util').iteratorReader

test('reverse.reverse == forward', function (t) {
  var file = '/tmp/whatever-test.json.sst'
  fs.stat(file, function (err, stat) {
    console.log(err, stat)
    fs.open(file, 'r', function (err, fd) {
      stat.fd = fd
      var fore, rev

      readIterator(BlockIterator(stat), function (err, array) {
        fore = array.map(function (e) {return shasum(e)})

        /*
        pull.readArray(array)
          .pipe(split())
          .pipe(pull.log())
        */

        console.log('FORWARD', fore, fore && rev)
        if(fore && rev) next()
      })
    
      readIterator(BlockIterator(stat, {reverse: true}), function (err, array) {
        rev = array.map(function (e) {return shasum(e)})
        console.log('REVERSE', rev, fore && rev)
        
        if(fore && rev) next()
      })

      function next () {
        console.log('done')
        t.deepEqual(fore, rev.reverse())
        t.end()
      }
    })
  })
})
