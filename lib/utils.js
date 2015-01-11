'use strict';

var fs = require('fs');
var Path = require('path');
var cheerio = require('cheerio');

exports.ls = function ls(dir, recursive, pattern) {
  var results = new Set();
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = Path.join(dir, file);
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (recursive) {
        ls(file, recursive, pattern).forEach(function(r) {
          results.add(r);
        });
      }
    } else {
      if (!pattern || pattern.test(file)) {
        results.add(file);
      }
    }
  });
  return results;
};


exports.readFile = function(path, type) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, {encoding: type}, function(err, data) {
      return err ? reject(err) :  resolve(data);
    });
  });
};

exports.getFileContent = function(path, type) {
  return exports.readFile(path, type || 'utf-8');
};

exports.getDocument = function(content) {
  return new Promise(function(resolve, reject) {
    var $ = cheerio.load(content);
    resolve($);
  });
};

exports.fileExists = function(path) {
  var stat;
  try {
    stat = fs.statSync(path);
  } catch(e) {
  }
  return !!stat;
};
