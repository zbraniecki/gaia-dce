
var utils = require('./utils');
var path = require('path');

function App(dce, appName) {
  this.name = appName;
  this.path = path.join(dce.gaiaPath, 'apps', appName);
  this.dce = dce;

  this.htmlFiles = new Set();
  this.jsFiles = new Set();

  this.skipDirs = [
    'test',
    'build'
  ];

  this.manifest = null;
}

App.prototype.readManifest = function() {
  var manifestPath = path.join(this.path, 'manifest.webapp');

  return utils.getFileContent(manifestPath).then(function(source) {
    this.manifest = JSON.parse(source);
  }.bind(this));
}

App.prototype.collectHTMLFiles = function() {
  this.htmlFiles = utils.ls(this.path, true, /\.html$/);
}

App.prototype.collectJSFiles = function() {
  this.jsFiles = utils.ls(this.path, true, /\.js$/);
}

App.prototype.analyze = function() {
  var launchPath = this.manifest['launch_path'];
  var fullLaunchPath = path.join(this.path, launchPath);

  this.htmlFiles.delete(fullLaunchPath);

  this.analyzeHTMLFile(fullLaunchPath).then(this.printSummary.bind(this));
}

App.prototype.printSummary = function() {
  var skipDirs = this.skipDirs.map(d => path.join(this.path, d), this);

  console.log('-----');
  console.log('Unused HTML files:');
  this.htmlFiles.forEach(function(f) {
    if (skipDirs.every(d => !f.startsWith(d))) {
      console.log(f);
    }
  });
  console.log('Unused JS files:');
  this.jsFiles.forEach(function(f) {
    if (skipDirs.every(d => !f.startsWith(d))) {
      console.log(f);
    }
  });
  console.log('-----');
}

App.prototype.analyzeHTMLFile = function(filePath) {
  return utils.getFileContent(filePath).then(utils.getDocument).then(function($) {
    var scripts = new Set();
    var query = $('script');
    for (var i = 0; i < query.length; i++) {
      var src = query[i].attribs.src;
      scripts.add(this.getFullPath(src));
    }

    scripts.forEach(function(f) {
      this.jsFiles.delete(f);
    }, this);
  }.bind(this));
}

App.prototype.getFullPath = function(filePath) {
  if (filePath.startsWith('/shared') ||
      filePath.startsWith('shared')) {
    return path.join(this.dce.gaiaPath, filePath);
  }
  return path.join(this.path, filePath);
}

exports.App = App;
