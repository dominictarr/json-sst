
var fs = require('fs')
var Iterator = require('async-iterator')

var shasum = require('shasum')

function calcBlock(stat, opts, i) {
  opts = opts || {}
  var blocks = Math.floor(stat.size / stat.blksize)
  var j = opts.reverse ? blocks - i : i
  var start = j * stat.blksize
  var limit = opts.limit ? opts.limit - 1 : blocks
  console.log('LIMIT', opts, blocks, limit, Math.min(blocks, limit))
  if(i > Math.min(blocks, limit)) return false
  return {
    length: (j + 1) * stat.blksize > stat.size
      ? stat.size - j * stat.blksize
      : stat.blksize,
    position: start, size: stat.size,
    i: j,
    end: i > blocks
  }
}

var blockIterator = module.exports = function (stat, opts) {
  opts = opts || {}
  var blocks = Math.floor(stat.size / stat.blksize)

  var initial = opts.inital

  return Iterator(function (i, cb) {
    var range = calcBlock(stat, opts, i)
    if(!range) return cb(null, null)
    var block = new Buffer(range.length)
    fs.read(stat.fd, block, 0, range.length, range.position, function (err) {
      cb(err, block.toString())
    })
  })
}

function jsonIterator(stat, opts) {
  opts = opts || {}
  var it = blockIterator(stat, opts)
  var data = []
  var tail = ''
  var reverse = opts.reverse
  return Iterator(function (i, cb) {
    if(data.length)
      return cb(null, data.shift())
    ;(function next () {
      it.next(function (err, block) {
        if(err) return cb(err)
        //this only happens when reverse: true
        if(!block && tail) {
          var t
          try { t = JSON.parse(tail) } catch (_) { }
          return cb(null, t) //end
        }
        if(!block) return cb() //end

        var lines = (reverse ? block + tail : tail + block).split('\n')
        tail = reverse ? lines.shift() : lines.pop()

        if(reverse) lines.reverse()

        lines.forEach(function (e) {
          try {
            data.push(JSON.parse(e))
          } catch (_) { }
        })

        if(data.length)
          return cb(null, data.shift())

        next()
      })
    })();
  })
}

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

module.exports.calcBlock = calcBlock

if(!module.parent) {
  var file = '/tmp/whatever-test.json.sst'
  fs.stat(file, function (err, stat) {
    fs.open(file, 'r', function (err, fd) {
      stat.fd = fd
      var fore, rev

      readIterator(blockIterator(stat), function (err, array) {
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
        require('assert').deepEqual(fore, rev.reverse())

        readIterator(jsonIterator(stat, {reverse: false}), function (err, fore) {
          readIterator(jsonIterator(stat, {reverse: true}), function (err, rev) {
            require('assert').deepEqual(fore, rev.reverse())
          })
        })
      }
    })
  })
}

