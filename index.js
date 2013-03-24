var EventEmitter = require('events').EventEmitter
var fs           = require('fs')
var u            = require('./util')
var pullRange    = require('pull-stream-range')
var BlockIterator = require('./block-iterator')

var open = function (file, cb) {
  fs.stat(file, function (err, stat) {
    if(err) return cb(err)
    fs.open(file, 'r', function (err, fd) {
      if(err) return cb(err)
      stat.blklength = 512
      stat.length = Math.ceil(stat.size / stat.blksize)
      stat.fd = fd
      cb(null, stat)
    })
  })
}


var exports = module.exports = function (file) {
  //if(!cb) cb = it, it = null
  var fd, blockSize, blockCount

  //if iterator is null, just open the file.

  var emitter = new EventEmitter()

/*
Hmm, so the default case should be an iterator,
and get is just a special-case - it's just an iterator
where start = end. Finding the block that an given key starts in
is the same for an iterator as for a get.
*/

  emitter.open = function (cb) {
    open(file, function (err, stat) {
      if(err) return cb(err)
      emitter._stat = stat
      emitter.opened = true
      cb()
    })
  }

  emitter.all = function (opts) {
    return BlockIterator(emitter._stat, opts)
      .pipe(u.json(opts.reverse))
  }

  emitter.iterator = function (opts) {
    opts = opts || {}
    if(!emitter.opened)
      throw new Error('SST is not yet opened!')
    
    var range = [opts.start, opts.end]
    if(opts.start && opts.end) range.sort()
    if(opts.reverse) range.reverse()

    opts.start = range[0] || null
    opts.end   = range[1] || null

    //first, just support iterating over the entire sst.    
    function getStream(i) {
      var _opts = u.merge({offset: i}, opts)
      if(isNaN(_opts.offset))
        throw new Error('i is not numeb')
      return BlockIterator(emitter._stat, _opts)
        .pipe(u.json(opts.reverse))

    }
    var blockCount = Math.ceil(emitter._stat.size / emitter._stat.blksize)

    function compare (a, b) {
      if(!a || !b) {
        console.log(a, b)
        throw new Error('nully')
      }
      var mult = opts.reverse ? -1 : 1
      return ( a.key < b.key ? -1 
             : a.key > b.key ?  1 
             :                  0 ) * mult
    }
    var start, end

    if(opts.start) start = {key: opts.start}
    if(opts.end) end = {key: opts.end}

    //console.log('START END', start, end, compare(start, end))

    return pullRange(getStream, compare, 
      blockCount, 
      start, end)
  }

  emitter.get = function (key, cb) {
    var read = emitter.iterator({start: key, end: key})
    read(null, function (err, data) {
      //close stream if it's not already closing.
      if(!err) read(true, function () {})
      cb(err, data && data.value)
    })
  }

  return emitter
}


exports.createSST = function (file, it, cb) {
  ws = fs.createWriteStream(file)
  cb = u.once(cb)
  var meta = {items: 0, length: 0, meta: true}
  ;(function next () {
    it.next(function (err, data) {
      if(err)
        return cb(err)
      if(data) {
        var json = JSON.stringify(data) + '\n'
        meta.items ++
        meta.length += json.length
        if(true === ws.write(json)) next()
        else ws.once('drain', next)
      } else {
        ws.end()
      }
    })
  })()

  ws.on('error', cb)
  ws.on('close', cb)
  
}

