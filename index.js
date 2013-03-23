var EventEmitter = require('events').EventEmitter
var fs           = require('fs')
var u            = require('./util')

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
    u.open(file, function (err, _stat) {
      if(err) return cb(err)
      emitter._stat = stat
      emitter.opened = true
      cb()
    })
  }

  emitter.iterator = function (opts) {
    if(!emitter.opened)
      throw new Error('SST is not yet opened!')
    //first, just support iterating over the entire sst.    
    return BlockIterator(emitter._stat, opts)
      .pipe(u.json(opts.reverse))
  }

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

