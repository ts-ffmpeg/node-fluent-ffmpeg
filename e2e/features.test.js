'use strict';

var assert = require('assert');
var childProcess = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');
var Ffmpeg = require('../index');

function executablePath(name) {
  var locator = process.platform === 'win32' ? 'where' : 'which';
  return childProcess.execFileSync(locator, [name], { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
}

function getFfmpegPath() {
  return new Promise(function(resolve, reject) {
    var command = new Ffmpeg();
    command._forgetPaths();
    command._getFfmpegPath(function(err, resolvedPath) {
      if (err) {
        reject(err);
      } else {
        resolve(resolvedPath);
      }
    });
  });
}

function getFfprobePath() {
  return new Promise(function(resolve, reject) {
    var command = new Ffmpeg();
    command._forgetPaths();
    command._getFfprobePath(function(err, resolvedPath) {
      if (err) {
        reject(err);
      } else {
        resolve(resolvedPath);
      }
    });
  });
}

function probe(input) {
  return new Promise(function(resolve, reject) {
    Ffmpeg.ffprobe(input, function(err, metadata) {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
}

function save(command, output) {
  return new Promise(function(resolve, reject) {
    var events = {
      start: 0,
      progress: 0,
      stderr: 0,
      error: 0,
      end: 0,
      commandLine: null
    };

    command
      .on('start', function(commandLine) {
        events.start++;
        events.commandLine = commandLine;
      })
      .on('progress', function() {
        events.progress++;
      })
      .on('stderr', function() {
        events.stderr++;
      })
      .on('error', function(err, stdout, stderr) {
        events.error++;
        err.ffmpegStdout = stdout;
        err.ffmpegStderr = stderr;
        reject(err);
      })
      .on('end', function(stdout, stderr) {
        events.end++;
        resolve({ events: events, stdout: stdout, stderr: stderr });
      })
      .save(output);
  });
}

function screenshots(command, config, folder) {
  return new Promise(function(resolve, reject) {
    var filenames;

    command
      .on('filenames', function(value) {
        filenames = value;
      })
      .on('error', reject)
      .on('end', function() {
        resolve(filenames);
      })
      .screenshots(config, folder);
  });
}

function videoStream(metadata) {
  return metadata.streams.find(function(stream) {
    return stream.codec_type === 'video';
  });
}

describe('fluent-ffmpeg end-to-end features', function() {
  var fixture = path.join(__dirname, '..', 'test', 'assets', 'testvideo-43.avi');
  var tempDir;
  var originalFfmpegPath;
  var originalFfprobePath;

  before(function() {
    executablePath('ffmpeg');
    executablePath('ffprobe');
    assert.ok(fs.existsSync(fixture), 'E2E input fixture must exist');
  });

  beforeEach(function() {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fluent-ffmpeg-e2e-'));
    originalFfmpegPath = process.env.FFMPEG_PATH;
    originalFfprobePath = process.env.FFPROBE_PATH;
    delete process.env.FFMPEG_PATH;
    delete process.env.FFPROBE_PATH;
    new Ffmpeg()._forgetPaths();
  });

  afterEach(function() {
    if (originalFfmpegPath === undefined) {
      delete process.env.FFMPEG_PATH;
    } else {
      process.env.FFMPEG_PATH = originalFfmpegPath;
    }

    if (originalFfprobePath === undefined) {
      delete process.env.FFPROBE_PATH;
    } else {
      process.env.FFPROBE_PATH = originalFfprobePath;
    }

    new Ffmpeg()._forgetPaths();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('discovers ffmpeg and ffprobe through PATH', async function() {
    assert.strictEqual(await getFfmpegPath(), executablePath('ffmpeg'));
    assert.strictEqual(await getFfprobePath(), executablePath('ffprobe'));
  });

  it('honors valid executable environment variables', async function() {
    process.env.FFMPEG_PATH = executablePath('ffmpeg');
    process.env.FFPROBE_PATH = executablePath('ffprobe');

    assert.strictEqual(await getFfmpegPath(), process.env.FFMPEG_PATH);
    assert.strictEqual(await getFfprobePath(), process.env.FFPROBE_PATH);
  });

  it('falls back to PATH when executable environment variables are invalid', async function() {
    process.env.FFMPEG_PATH = path.join(tempDir, 'missing-ffmpeg');
    process.env.FFPROBE_PATH = path.join(tempDir, 'missing-ffprobe');

    assert.strictEqual(await getFfmpegPath(), executablePath('ffmpeg'));
    assert.strictEqual(await getFfprobePath(), executablePath('ffprobe'));
  });

  it('probes the fixture and validates semantic metadata', async function() {
    var metadata = await probe(fixture);
    var stream = videoStream(metadata);

    assert.ok(metadata.format);
    assert.ok(Number(metadata.format.duration) > 1.5);
    assert.ok(Number(metadata.format.duration) < 2.5);
    assert.ok(stream, 'Expected a video stream');
    assert.strictEqual(stream.codec_type, 'video');
    assert.strictEqual(Number(stream.width), 1024);
    assert.strictEqual(Number(stream.height), 768);
  });

  it('transcodes a file and emits the expected lifecycle events', async function() {
    var output = path.join(tempDir, 'transcoded.mp4');
    var result = await save(
      Ffmpeg(fixture)
        .videoCodec('mpeg4')
        .size('160x120')
        .noAudio(),
      output
    );
    var metadata = await probe(output);
    var stream = videoStream(metadata);

    assert.ok(fs.statSync(output).size > 0);
    assert.ok(stream, 'Expected a transcoded video stream');
    assert.strictEqual(stream.codec_name, 'mpeg4');
    assert.strictEqual(Number(stream.width), 160);
    assert.strictEqual(Number(stream.height), 120);
    assert.strictEqual(result.events.start, 1);
    assert.ok(result.events.progress >= 1, 'Expected at least one progress event');
    assert.ok(result.events.stderr >= 1, 'Expected FFmpeg stderr output');
    assert.strictEqual(result.events.error, 0);
    assert.strictEqual(result.events.end, 1);
    assert.ok(result.events.commandLine.indexOf('ffmpeg ') === 0);
  });

  it('transcodes stream input to a file', async function() {
    var output = path.join(tempDir, 'stream-input.avi');
    var input = fs.createReadStream(fixture);
    var result = await save(
      Ffmpeg(input)
        .inputFormat('avi')
        .videoCodec('mpeg4')
        .size('128x96')
        .noAudio()
        .format('avi'),
      output
    );
    var metadata = await probe(output);
    var stream = videoStream(metadata);

    assert.ok(fs.statSync(output).size > 0);
    assert.ok(stream, 'Expected a video stream from stream input');
    assert.strictEqual(Number(stream.width), 128);
    assert.strictEqual(Number(stream.height), 96);
    assert.strictEqual(result.events.start, 1);
    assert.strictEqual(result.events.error, 0);
    assert.strictEqual(result.events.end, 1);
  });

  it('creates screenshots from fixed and percentage timemarks', async function() {
    var fixedDir = path.join(tempDir, 'fixed');
    var percentageDir = path.join(tempDir, 'percentage');
    var fixedNames = await screenshots(
      Ffmpeg(fixture),
      { timemarks: [0.5], filename: 'fixed.png', size: '160x120' },
      fixedDir
    );
    var percentageNames = await screenshots(
      Ffmpeg(fixture),
      { timemarks: ['50%'], filename: 'percentage.png', size: '160x120' },
      percentageDir
    );

    assert.deepStrictEqual(fixedNames, ['fixed.png']);
    assert.deepStrictEqual(percentageNames, ['percentage.png']);

    await Promise.all([
      path.join(fixedDir, fixedNames[0]),
      path.join(percentageDir, percentageNames[0])
    ].map(async function(file) {
      var metadata = await probe(file);
      var stream = videoStream(metadata);
      assert.ok(fs.statSync(file).size > 0);
      assert.ok(stream, 'Expected screenshot to contain a video stream');
      assert.strictEqual(stream.codec_name, 'png');
      assert.strictEqual(Number(stream.width), 160);
      assert.strictEqual(Number(stream.height), 120);
    }));
  });

  it('reports an unavailable codec exactly once without emitting end', async function() {
    var output = path.join(tempDir, 'invalid-codec.mp4');
    var errorEvents = 0;
    var endEvents = 0;

    await new Promise(function(resolve, reject) {
      Ffmpeg(fixture)
        .videoCodec('fluent_ffmpeg_missing_codec')
        .on('error', function(err) {
          errorEvents++;
          try {
            assert.match(err.message, /Video codec .* is not available/);
            setImmediate(resolve);
          } catch (assertionError) {
            reject(assertionError);
          }
        })
        .on('end', function() {
          endEvents++;
        })
        .save(output);
    });

    assert.strictEqual(errorEvents, 1);
    assert.strictEqual(endEvents, 0);
    assert.strictEqual(fs.existsSync(output), false);
  });
});
