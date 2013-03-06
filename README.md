# json-sst

Newline Separated JSON, Sorted String Tables.

This module is currently _README only_, just writing up these ideas,
hopefully to implement them soon, and use them to build a  
[leveldown](https://github.com/rvagg/node-leveldown) clone in pure js.

# Stability

Experimental: Expect the unexpected. Please provide feedback on api and you use-case

## API

### openSST(file, cb)

Open at SST.

### createSST(file, [iterator1, iterator2,...], cb)

Create a new SST from two or more iterators. Once the table is completely written it cannot be altered.

It is not possible to alter a SST once it's written.

### createIterator (opts)

Create an iterator with the same api as [levelDOWN#iterator](https://github.com/rvagg/node-leveldown#leveldowniteratoroptions)

### get(key, function cb (err, value))

Retrive a value. This will probably be implemented via a binary search.

## Implementation Ideas.

An SST will be persisted as sorted `{key: key, value: value}` json pairs, then a footer.
The footer will can have meta information, such as the size of the file,
and a bit of information about the keys in the SST, such as a partial table of key locations,
which could be used to improve the performance of the binary search.

This could be combined with a module for a JSONLog which would have `createIterator` and `get`
but also, `put', `batch` and `delete`.

These two modules could be combined to make a simple leveldb clone in pure JS!

## License

MIT

