var BlockIterator = require('../block-iterator')
var fs = require('fs')
var shasum = require('shasum')
var test = require('tape')

function readIterator (it, cb) {
  var array = []
  ;(function next () {
    it.next(function (err, range) {
      if(range)
        return array.push(range), next()

      else cb(null, array)
    })
  })();
}

test('reverse.reverse == forward', function (t) {

  var file = '/tmp/whatever-test.json.sst'
  fs.stat(file, function (err, stat) {
    console.log(err, stat)
    fs.open(file, 'r', function (err, fd) {
      stat.fd = fd
      var fore, rev

      readIterator(BlockIterator(stat), function (err, array) {
        fore = array.map(function (e) {return shasum(e)})
        console.log('FORWARD', fore)
        if(fore && rev) next()
      })
    
      readIterator(BlockIterator(stat, {reverse: true}), function (err, array) {
        rev = array.map(function (e) {return shasum(e)})
        console.log('REVERSE', rev)
        if(fore && rev) next()
      })

      function next () {
        t.deepEqual(fore, rev.reverse())
        t.end()
      }

    })
  })
})
