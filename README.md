# node-libravatar

Here is an easy way to make use of the federated [Libravatar](http://www.libravatar.org)
avatar hosting service from within your node.js applications. It is inspired by
[Emerson Macedo](http://codificando.com/)'s [Gravatar library](https://github.com/emerleite/node-gravatar).

See the [project page](https://github.com/fmarier/node-libravatar) for the issue tracker and downloads.

[![Build Status](https://travis-ci.org/fmarier/node-libravatar.png)](https://travis-ci.org/fmarier/node-libravatar)

## Instalation

To install using npm, simply do this:

    $ npm install libravatar

[![NPM](https://nodei.co/npm/libravatar.png)](https://nodei.co/npm/libravatar/)

## Usage

To generate the correct avatar URL based on someone's email address, use the
following:

    var libravatar = require('libravatar');
    libravatar.url({ email: 'person@example.com', size: 96, default: 'mm', https: false },
      function (error, avatar_url) {
        console.log('<img src="' + avatar_url + '">');
      });

See the [Libravatar documentation](http://wiki.libravatar.org/api) for more
information on the special values for the "default" parameter.

## License

Copyright (C) 2011, 2012 Francois Marier <francois@libravatar.org>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
