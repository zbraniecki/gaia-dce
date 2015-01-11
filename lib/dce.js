
var utils = require('./utils');
var path = require('path');

var App = require('./app').App;

function DCE(gaiaPath) {
  this.gaiaPath = gaiaPath;
  this.app = new App(this, 'bluetooth');
}

DCE.prototype.analyze = function() {
  this.app.collectHTMLFiles();
  this.app.collectJSFiles();

  this.app.readManifest().then(function() {
    this.app.analyze();
  }.bind(this));
}

exports.DCE = DCE;
