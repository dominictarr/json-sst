var test = require('tape')
var calcBlock = require('../block-iterator').calcBlock

function size (a) {
  return a.reduce(function (acc, it) {
    return acc + it.length
  }, 0)
}

function blocks(stat, reverse) {
  var i = 0, dim, array = []
  do {
    dim = calcBlock(stat, reverse, i++)
    dim && array.push(dim)
  } while(dim)
  return array
}

test('forward = reverse.reverse', function (t) {

  var stat = { dev: 16777217,
    blksize: 4096,
    size: 27109,
  }

  var a = blocks(stat, {reverse: false})
  var b = blocks(stat, {reverse: true})

  t.deepEqual(a, b.reverse())
  t.equal(size(a), stat.size)
  t.equal(size(b), stat.size)

  t.end()
})


test('forward = reverse.reverse 2', function (t) {

  var stat = {
    blksize: 512,
    size: 2712,
  }

  var a = blocks(stat, {reverse: false})
  var b = blocks(stat, {reverse: true})

  t.deepEqual(a, b.reverse())
  t.equal(size(a), stat.size)
  t.equal(size(b), stat.size)

  console.log(a)

  t.end()
})


test('forward = reverse.reverse 3', function (t) {

  var stat = {
    blksize: 512,
    size: 271,
  }

  var a = blocks(stat, {reverse: false})
  var b = blocks(stat, {reverse: true})

  t.deepEqual(a, b.reverse())
  t.equal(size(a), stat.size)
  t.equal(size(b), stat.size)

  t.end()
})


//when reversing, should the start block still count from the start?
//or should it count from the end?

test('forward, limit: 1', function (t) {

  var stat = {
    blksize: 512,
    size: 2710,
  }

  var a = blocks(stat, {reverse: false, limit: 1})
  var b = blocks(stat, {reverse: false})

  t.deepEqual(a, b.slice(0, 1))

  console.log(a)
  console.log(b.slice(0, 1))

  t.end()

})
