var EventEmitter = require('events').EventEmitter
var fs           = require('fs')
var JsonIterator = require('./json-iterator')

function once (fun) {
  var called = false
  return function () {
    if(called) return
    called = true
    return fun.apply(this, arguments)
  }
}


function open(file, cb) {
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
  if(it) {
    createSST(file, it, function (err) {
      if(err) return cb(err)
      open(file, function (err, _stat) {
        emitter.stat = _stat
        cb(null, emitter)
      })
    })
  } else {
    //open the file and read the footer.
    open(file, function (err, _stat) {
      emitter.stat = _stat
      cb(null, emitter)
    })
  }
  */

/*
Hmm, so the default case should be an iterator,
and get is just a special-case - it's just an iterator
where start = end. Finding the block that an given key starts in
is the same for an iterator as for a get.
*/

  emitter.open = function (cb) {
    open(file, function (err, _stat) {
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
    return JsonIterator(emitter._stat, opts)
  }

/*
  emitter.get = function (key, cb) {
    //what is the total number of blocks?
    ;(function read(left, right) {
      var middle = Math.round((left + right)/2) //read center block
      console.log('READ', left, right, '->', middle)
      readBlock(middle, function (err, data) {
        var _key = data.body[0].key
        var key_ = data.body[data.body.length - 1].key
        if(_key <= key && key <= key_) {
          return cb(null, data)
        }
        if(_key < key)
          read(middle, right)
        else if(key < _key)
          read(left, middle)
      })
    })(0, blockCount) 
  }
*/

}

exports.createSST = function (file, it, cb) {
  ws = fs.createWriteStream(file)
  cb = once(cb)
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

