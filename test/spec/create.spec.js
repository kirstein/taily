/* jshint expr:true */
var path  = require('path'),
    fs    = require('fs'),
    sinon = require('sinon'),
    _     = require('lodash');

var taily = require("../../");

describe ('#create', function() {
  it ('should be a function', function() {
    taily.create.should.be.instanceOf(Function);
  });

  it ('should throw when no filename is passed', function() {
    (function() {
      taily.create();
    }).should.throw('No file defined');
  });

  it ('should return an object with the defined filename', function() {
    var result = taily.create('filename');
    result.should.be.instanceOf(Object);
    result.file.should.equal('filename');
  });

  it ('should use default options as options', function() {
    var result = taily.create('filename');
    result.options.should.eql(result._default_options);
  });

  it ('should extend default options with given options', function() {
    var result = taily.create('filename', { debug: false, interval: 1 });
    result.options.should.eql({
      chunksize : 512,
      debug     : false,
      encoding  : 'utf8',
      interval  : 1
    });
  });
});

