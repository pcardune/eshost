'use strict';

const fs = require('fs');
const inception = require('../inception');
const runtimePath = require('../runtimePath');
const ConsoleAgent = require('../ConsoleAgent');
const ErrorParser = require('../parseError.js');

const errorRe = /^(.*?):(\d+): ((\w+): (.*))[\w\W]*\3((:?\s+at.*\r?\n)*)$/m;

const runtimeStr = inception(
  fs.readFileSync(runtimePath.for('js-interpreter'), 'utf8')
);

class JSInterpreterAgent extends ConsoleAgent {
  compile(code) {
    return super.compile(code);
  }
}
JSInterpreterAgent.runtime = runtimeStr;

module.exports = JSInterpreterAgent;
