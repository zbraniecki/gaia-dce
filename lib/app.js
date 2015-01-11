
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

  var usedPaths = new Set();

  if (this.manifest.messages) {
    this.manifest.messages.forEach(function(kvp) {
      for (var key in kvp) {
        usedPaths.add(this.getFullPath(kvp[key]));
      }
    }, this);
  }

  if (this.manifest.activities) {
    for (var key in this.manifest.activities) {
      usedPaths.add(this.getFullPath(this.manifest.activities[key].href));
    }
  }

  if (this.manifest.launch_path) {
    var launchPath = this.manifest['launch_path'];
    usedPaths.add(this.getFullPath(launchPath));
  }

  var analyzeHTMLFiles = [];

  usedPaths.forEach(function(p) {
    this.htmlFiles.delete(p);
    analyzeHTMLFiles.push(this.analyzeHTMLFile(p));
  }, this);

  Promise.all(analyzeHTMLFiles).then(this.printSummary.bind(this));
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
  if (!utils.fileExists(filePath)) {
    console.log('file does not exist: ' + filePath);
    return Promise.resolve();
  }
  return utils.getFileContent(filePath).then(utils.getDocument).then(function($) {
    return new Promise(function(resolve, reject) {
      try {
      var scripts = new Set();
      var query = $('script');
      for (var i = 0; i < query.length; i++) {
        var src = query[i].attribs.src;
        scripts.add(this.getFullPath(src));
      }

      if (scripts.size) {
        var analyzeJSFiles = [];
        scripts.forEach(function(f) {
          this.jsFiles.delete(f);
          analyzeJSFiles.push(this.analyzeJSFile(f));
        }, this);

        Promise.all(analyzeJSFiles).then(function() {
          resolve();
        });
      } else {
        resolve();
      }
      } catch (e){console.log(e);}
    }.bind(this));
  }.bind(this));
}

App.prototype.analyzeJSFile = function(filePath) {
  return utils.getFileContent(filePath).then(function(content) {
    return new Promise(function(resolve, reject) {
      try {
      var myRe = /[a-z]*\.html/ig;
      
      var matchesArray = content.match(myRe);
      if (matchesArray) {
        var analyzeHTMLFiles = [];
        matchesArray.forEach(function(f) {
          this.htmlFiles.delete(this.getFullPath(f));
          analyzeHTMLFiles.push(this.analyzeHTMLFile(this.getFullPath(f)));
        }, this);

        Promise.all(analyzeHTMLFiles).then(function() {
          resolve();
        });
      } else {
        resolve();
      }
      } catch (e) {console.log(e);}
    }.bind(this));
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
