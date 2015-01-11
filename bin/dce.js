#!/usr/bin/env node

'use strict';

var program = require('commander');

var DCE = require('../lib/dce').DCE;

function main(gaiaPath) {
  var dce = new DCE(gaiaPath);
  dce.analyze();
}

program
  .version('0.0.1')
  .usage('[options] gaia-path')
  .parse(process.argv);

main(program.args[0]);
