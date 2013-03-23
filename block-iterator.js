
var fs = require('fs')
//var Iterator = require('./pull-iterator') //require('async-iterator')


var pull = require('pull-stream')

var Iterator =
pull.pipeableSource(function (next, close) {
  var i = 0
  return function (end, cb) {
    if(end)
      close ? close(function (err) {
        cb(err || true)
      }) : cb && cb(end)
    else
      next(i++, function (err, data) {
        process.nextTick(function () {
          cb(err || data == null, data) //means end in an iterator.
        })
      })
  }
})

var shasum = require('shasum')

function calcBlock(stat, opts, i) {
  opts = opts || {}
  var blocks = Math.floor(stat.size / stat.blksize)
  var j = opts.reverse ? blocks - i : i
  var start = j * stat.blksize
  var limit = opts.limit ? opts.limit - 1 : blocks
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
      console.log('block')
      cb(err, block.toString())
    })
  })
}


module.exports.calcBlock = calcBlock

