# ftp-reap

[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

Delete files over ftp based on last modified date.

## Usage

```js
var Reaper = require('ftp-reap');
var reaper = new Reaper();

reaper.maxAge('2 weeks'); // delete files older then two weeks

reaper.watch({
    host: 'my.awesome.bucket',
    user: 'user',
    password: 'password'
});

reaper
    .run()
    .then(function () {
        // do something good
    })
    .catch(function (err) {
        // do something with error
    });
```

## API

Note: API intentionally are the same as that of the [fs-reap][fs-reap-url].

### var reaper = new Reaper()

```js
var Reaper = require('ftp-reap');
var reaper = new Reaper();
```

### reaper.watch(dir)

A FTP connection to reap.

For more details about possible connection properties, look at [ftp#connect() API][ftp-url].

```js
reaper.watch({
    connection: 'n.n.n.n',
    port: 42,
    path: '/path/to/my/files'
});
reaper.watch({
    connection: 'other_host',
    port: 21,
    path: '/path/to/my/other/files'
});

// or

reaper.watch(
    {
        connection: 'n.n.n.n',
        port: 42,
        path: '/path/to/my/files'
    },
    {
        connection: 'other_host',
        port: 21,
        path: '/path/to/my/other/files'
    }
);
```

### reaper.maxAge(ms)

Set the max age based on last modified time for deletion, defaulting to `Infinity`.

You may use `Integer` to specify milliseconds, or human-readable string format like `3 days` or `2 months`.
For more details look at [ms][ms-url] API.

### reaper.run().then( => ).catch(err =>)

Recursively iterate through directories and delete old files.
Directories structure are safe. Folders and symlinks (UNIX systems only) are ignored.

FTP connections runs in parallel, so you shouldn't see significant perfomance loss.

## LICENSE

The MIT License (MIT)

Copyright (c) 2015 [Alexander Ulizko][ulizko-url] [alexander@ulizko.com][mail-link]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

[fs-reap-url]: https://www.npmjs.com/package/fs-reap
[ms-url]: https://www.npmjs.com/package/ms
[ftp-url]: https://www.npmjs.com/package/ftp#methods
[ulizko-url]: http://ulizko.com
[mail-link]: mailto:alexander@ulizko.com
[travis-image]: https://img.shields.io/travis/aulizko/ftp-reap.svg?style=flat-square
[travis-url]: https://travis-ci.org/aulizko/ftp-reap
[coveralls-image]: https://img.shields.io/coveralls/aulizko/ftp-reap.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/aulizko/ftp-reap
