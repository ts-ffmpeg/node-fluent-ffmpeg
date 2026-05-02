# Fluent FFmpeg-API with types for node.js

[![License: MIT](https://img.shields.io/npm/l/%40ts-ffmpeg%2Ffluent-ffmpeg
)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/%40ts-ffmpeg%2Ffluent-ffmpeg)](https://www.npmjs.com/package/@ts-ffmpeg/fluent-ffmpeg)
[![npm downloads](https://img.shields.io/npm/dt/%40ts-ffmpeg%2Ffluent-ffmpeg)](https://www.npmjs.com/package/@ts-ffmpeg/fluent-ffmpeg)
[![Coverage Status](https://coveralls.io/repos/github/ts-ffmpeg/node-fluent-ffmpeg/badge.svg?branch=activationBytes)](https://coveralls.io/github/ts-ffmpeg/node-fluent-ffmpeg?branch=activationBytes)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fts-ffmpeg%2Fnode-fluent-ffmpeg.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Fts-ffmpeg%2Fnode-fluent-ffmpeg?ref=badge_shield&issueType=security)

## Current migration plan of `@ts-ffmpeg/flucnet-ffmpeg`
I will merge types from [@types/fluent-ffmpeg](https://www.npmjs.com/package/@types/fluent-ffmpeg) into this repo, put types and code ready at one place. \
And later I'm planing to fix [issues from previous repo](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues) and [merge PRs](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/pulls).

## Installation

Via npm:

```sh
# this lib starts from v2.2.0, which is the same code with `fluent-ffmpeg@2.1`. I just reduce the useless code in npm lib.
$ npm install @ts-ffmpeg/fluent-ffmpeg
```


### Creating an FFmpeg command

The fluent-ffmpeg module returns a constructor that you can use to instanciate FFmpeg commands.

```ts
// ts
import ffmpeg from '@ts-ffmpeg/fluent-ffmpeg'
const command = ffmpeg();
```

You may pass an input file name or readable stream, a configuration object, or both to the constructor.

```js
const command = ffmpeg('/path/to/file.avi');
const command = ffmpeg(fs.createReadStream('/path/to/file.avi'));
const command = ffmpeg({ option: "value", ... });
const command = ffmpeg('/path/to/file.avi', { option: "value", ... });
```

The following options are available:
* `source`: input file name or readable stream (ignored if an input file is passed to the constructor)
* `timeout`: ffmpeg timeout in seconds (defaults to no timeout)
* `preset` or `presets`: directory to load module presets from (defaults to the `lib/presets` directory in fluent-ffmpeg tree)
* `niceness` or `priority`: ffmpeg niceness value, between -20 and 20; ignored on Windows platforms (defaults to 0)
* `logger`: logger object with `debug()`, `info()`, `warn()` and `error()` methods (defaults to no logging)
* `stdoutLines`: maximum number of lines from ffmpeg stdout/stderr to keep in memory (defaults to 100, use 0 for unlimited storage)


### Specifying inputs

You can add any number of inputs to an Ffmpeg command.  An input can be:
* a file name (eg. `/path/to/file.avi`);
* an image pattern (eg. `/path/to/frame%03d.png`);
* a readable stream; only one input stream may be used for a command, but you can use both an input stream and one or several file names.

```js
// Note that all fluent-ffmpeg methods are chainable
ffmpeg('/path/to/input1.avi')
  .input('/path/to/input2.avi')
  .input(fs.createReadStream('/path/to/input3.avi'));

// Passing an input to the constructor is the same as calling .input()
ffmpeg()
  .input('/path/to/input1.avi')
  .input('/path/to/input2.avi');

// Most methods have several aliases, here you may use addInput or mergeAdd instead
ffmpeg()
  .addInput('/path/to/frame%02d.png')
  .addInput('/path/to/soundtrack.mp3');

ffmpeg()
  .mergeAdd('/path/to/input1.avi')
  .mergeAdd('/path/to/input2.avi');
```

### More
This lib is currently written in js for code, and a standalone `index.d.ts` for typing. So you can easily import lib by require or import. 

For more examples, you can explore the [legacy doc](./doc/Legacy-README.md). They are all the same with the lib `fluent-ffmpeg`.

## Credits 
### Main contributors from [fluent-ffmpeg/node-fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) project

* [enobrev](http://github.com/enobrev)
* [njoyard](http://github.com/njoyard)
* [sadikzzz](http://github.com/sadikzzz)
* [smremde](http://github.com/smremde)
* [spruce](http://github.com/spruce)
* [tagedieb](http://github.com/tagedieb)
* [tommadema](http://github.com/tommadema)
* [Weltschmerz](http://github.com/Weltschmerz)
* [Jonham Chen](http://github.com/jonham)

[and more others](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/graphs/contributors)


### TS types authors from [@types/fluent-ffmpeg](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/fluent-ffmpeg)
These definitions were written by
- [KIM Jaesuck a.k.a. gim tcaesvk](http://github.com/tcaesvk)
- [DingWeizhe](http://github.com/DingWeizhe)
- [Mounir Abid](http://github.com/mabidina)
- [Doyoung Ha](http://github.com/hados99)
- [Prasad Nayak](http://github.com/buzzertech)
- [Jonham Chen](http://github.com/jonham)


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fts-ffmpeg%2Fnode-fluent-ffmpeg.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fts-ffmpeg%2Fnode-fluent-ffmpeg?ref=badge_shield&issueType=license)

(The MIT License)

Copyright (c) 2011-2024 Stefan Schaermeli &lt;schaermu@gmail.com&gt;  
Copyright (c) 2025-2026 Jonham Chen &lt;jonhamchen@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
