var pull = require('pull-stream')
var split = require('pull-split')

exports.iteratorReader = function (read, cb) {
  var array = []
  ;(function next () {
    read(null, function  (err, range) {
      console.log('read', range)
      if(range)
        return array.push(range), next()

      else cb(null, array)
    })
  })();
}


exports.json = function (reverse) {
  return split(null, null, reverse)
    .pipe(pull.map(function (data) {
    if(!data) return
    try { return JSON.parse(data) }
    catch (err) {console.error([err, data])}
   }))
  .pipe(pull.filter())
}

exports.once = function (fun) {
  var called = false
  return function () {
    if(called) return
    called = true
    return fun.apply(this, arguments)
  }
}

exports.open = function (file, cb) {
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

