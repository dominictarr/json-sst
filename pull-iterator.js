
var pull = require('pull-stream')

var pullIterator = module.exports = 
pull.pipeableSource(function (it) {
  return function (end, cb) {
    if(end)
      return it.end(cb)
    it.next(cb)
  }

})
