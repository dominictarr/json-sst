var JsonIterator = require('../json-iterator')
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
    fs.open(file, 'r', function (err, fd) {
      stat.fd = fd
      var fore, rev

      readIterator(JsonIterator(stat), function (err, array) {
        fore = array
        if(fore && rev) next()
      })
    
      readIterator(JsonIterator(stat, {reverse: true}), function (err, array) {
        rev = array
        if(fore && rev) next()
      })

      function next () {
        console.log(fore)
        t.deepEqual(fore, rev.reverse())
        t.end()
      }

    })
  })
})
