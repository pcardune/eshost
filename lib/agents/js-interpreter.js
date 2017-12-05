'use strict';

const Agent = require('../Agent.js');
const fs = require('fs');
const writeFile = promisify(fs.writeFile);
const cp = require('child_process');
const temp = require('temp');
const ErrorParser = require('../parseError.js');

const inception = require('../inception');
const runtimePath = require('../runtimePath');
const errorRe = /^(.*?):(\d+): ((\w+): (.*))[\w\W]*\3((:?\s+at.*\r?\n)*)$/m;

const runtimeStr = inception(
  fs.readFileSync(runtimePath.for('js-interpreter'), 'utf8')
);

class JSInterpreterAgent extends Agent {
  constructor(options) {
    super(options);
    this.printCommand = 'print';
  }

  createChildProcess(args) {
    args = args || [];
    args = args.concat(this.args);
    return cp.fork(this.hostPath, args);
  }

  evalScript(code) {
    this._deferred = deferred();
    this._stdout = '';
    this._stderr = '';
    if (!this._cp) {
      this._cp = this.createChildProcess(['--forked']);
      this._cp.on('message', ({ status, message }) => {
        message = message || '';
        if (status === 'log') {
          this._stdout += message;
          return;
        }
        if (status === 'error') {
          this._stderr += message;
        }
        const result = {
          stderr: this._stderr,
          stdout: this._stdout,
        };

        result.error = this.parseError(result.stderr);
        this._deferred.resolve(result);
      });
      this._cp.on('close', () => {
        this._cp = null;

        const result = {
          stderr: this._stderr,
          stdout: this._stdout,
        };

        result.error = this.parseError(result.stderr);
        this._deferred.resolve(result);
      });
    }
    code = this.compile(code);
    this._cp.send(code);
    return this._deferred.promise;
  }

  stop() {
    if (this._cp) {
      this._cp.kill('SIGKILL');
    }
    // killing is fast, don't bother waiting for it
    return Promise.resolve();
  }

  // console agents need to kill the process before exiting.
  destroy() {
    return this.stop();
  }

  compile(code, options) {
    code = super.compile(code, options);
    const runtime = this.constructor.runtime;
    if (!runtime) {
      return code;
    } else {
      const prologue = code.match(
        /^("[^\r\n"]*"|'[^\r\n']*'|[\s\r\n;]*|\/\*[\w\W]*?\*\/|\/\/[^\n]*\n)*/
      );

      if (prologue) {
        return prologue[0] + runtime + code.slice(prologue[0].length);
      } else {
        return runtime + code;
      }
    }
  }

  finalize() {
    return Promise.resolve();
  }

  parseError(str) {
    return ErrorParser.parse(str);
  }
}
JSInterpreterAgent.runtime = runtimeStr;

module.exports = JSInterpreterAgent;

function deferred() {
  let res, rej;
  const p = new Promise(function(resolve, reject) {
    res = resolve;
    rej = reject;
  });

  return { promise: p, resolve: res, reject: rej };
}

function promisify(api) {
  return function() {
    let args = Array.prototype.slice.call(arguments);
    return new Promise(function(res, rej) {
      args.push(function(err, result) {
        if (err) {
          return rej(err);
        }
        return res(result);
      });

      api.apply(null, args);
    });
  };
}
