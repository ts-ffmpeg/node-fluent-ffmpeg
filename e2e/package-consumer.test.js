'use strict';

var assert = require('assert');
var childProcess = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');

describe('packed package consumer', function() {
  var repositoryRoot = path.join(__dirname, '..');
  var packageMetadata = require('../package.json');
  var tempDir;

  beforeEach(function() {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fluent-ffmpeg-consumer-'));
  });

  afterEach(function() {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('installs and loads the npm tarball from a clean project', function() {
    var packOutput = childProcess.execFileSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', tempDir],
      { cwd: repositoryRoot, encoding: 'utf8' }
    );
    var packResult = JSON.parse(packOutput)[0];
    var tarball = path.join(tempDir, packResult.filename);
    var consumerDir = path.join(tempDir, 'consumer');
    var packedPaths = packResult.files.map(function(file) { return file.path; });

    assert.ok(packedPaths.indexOf('index.js') !== -1, 'Package entry point must be published');
    assert.ok(packedPaths.indexOf('lib/fluent-ffmpeg.js') !== -1, 'Runtime library must be published');
    ['.docs/', '.plans/', 'coverage/', 'e2e/', 'site/', 'test/', 'tmp/'].forEach(function(prefix) {
      assert.strictEqual(
        packedPaths.some(function(file) { return file.indexOf(prefix) === 0; }),
        false,
        prefix + ' must not be published'
      );
    });

    fs.mkdirSync(consumerDir);
    fs.writeFileSync(
      path.join(consumerDir, 'package.json'),
      JSON.stringify({ name: 'fluent-ffmpeg-e2e-consumer', private: true }, null, 2)
    );

    childProcess.execFileSync(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        tarball
      ],
      { cwd: consumerDir, encoding: 'utf8', stdio: 'pipe' }
    );

    var loaded = childProcess.execFileSync(
      process.execPath,
      [
        '-e',
        "const ffmpeg = require('@ts-ffmpeg/fluent-ffmpeg'); " +
          "const pkg = require('@ts-ffmpeg/fluent-ffmpeg/package.json'); " +
          "if (typeof ffmpeg !== 'function') process.exit(2); " +
          "process.stdout.write(pkg.name + '@' + pkg.version);"
      ],
      { cwd: consumerDir, encoding: 'utf8' }
    );

    assert.strictEqual(loaded, packageMetadata.name + '@' + packageMetadata.version);
  });
});
