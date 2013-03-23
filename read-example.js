var SST = require('./')
var randomName = require('random-name')

SST('/tmp/whatever-test.json.sst', function (err, sst) {
  var target 
  var it = sst.iterator()

  ;(function next() {
    it.next(function(err, data) {
      if(err) throw err
      if(data) console.log(data), next()
      else console.log('END')
    })
  })()

})
