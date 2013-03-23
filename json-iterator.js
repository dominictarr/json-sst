var Iterator = require('async-iterator')
var BlockIterator = require('./block-iterator')

module.exports = function (stat, opts) {
  opts = opts || {}
  var it = BlockIterator(stat, opts)
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
          tail == null
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
