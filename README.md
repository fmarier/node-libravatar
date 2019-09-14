# node-libravatar

A library built for easy integration with the federated [Libravatar](http://www.libravatar.org)
avatar hosting service from within your Node.js applications. The project was inspired by a 
[Gravatar library](https://github.com/emerleite/node-gravatar) from [Emerson Macedo](http://codificando.com/).

See the [project page](https://github.com/coloradocolby/node-libravatar) for the issue tracker and downloads.

[![Build Status](https://travis-ci.org/coloradocolby/node-libravatar.png)](https://travis-ci.org/coloradocolby/node-libravatar)
[![Dependencies Status](https://david-dm.org/coloradocolby/node-libravatar.png)](https://david-dm.org/coloradocolby/node-libravatar)
[![Dev Dependencies Status](https://david-dm.org/coloradocolby/node-libravatar/dev-status.png)](https://david-dm.org/coloradocolby/node-libravatar#info=devDependencies)
[![MIT liscense](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/coloradocolby/node-libravatar/blob/master/LICENSE.md)

## Installation

To install using npm:

    $ npm install libravatar

[![NPM](https://nodei.co/npm/libravatar.png)](https://nodei.co/npm/libravatar/)

## Usage

To generate the correct avatar URL based on someone's email address, use the
following:

    const libravatar = require('libravatar')
    ...
    const getLibravatar = async () => {
      const avatar_url = await libravatar.get_avatar_url({ email: 'person@example.com', size: 96, default: 'mm', https: false })
    }

See the [Libravatar documentation](http://wiki.libravatar.org/api) for more
information on the special values for the "default" parameter.
