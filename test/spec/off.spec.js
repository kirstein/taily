/* jshint expr:true */
var path  = require('path'),
    fs    = require('fs'),
    sinon = require('sinon'),
    _     = require('lodash');

var taily = require("../../");

describe ('#off', function() {
  var res;

  beforeEach(function() {
    res = taily.create('filename');
  });

  it ('should contain off function', function() {
    res.off.should.be.instanceOf(Function);
  });

  it ('should return instance of res', function() {
    res.off().should.eql(res);
  });

  it ('should remove all defined events if called with no arguments', function() {
    res._handlers.open.push(function() {}, function() {});
    res._handlers.end.push(function() {}, function() {});
    res.off();
    res._handlers.open.should.eql([]);
    res._handlers.end.should.eql([]);
  });

  it ('should remove all defined events if only event is defined', function() {
    res._handlers.open.push(function() {}, function() {});
    res._handlers.end.push(function() {}, function() {});
    res.off('open');
    res._handlers.open.should.eql([]);
    res._handlers.end.should.not.eql([]);
  });

  it ('should remove defined callback', function() {
    var defined = function () {};
    var notATarget = function() {};
    res._handlers.open.push(defined, notATarget);
    res.off('open', defined);
    res._handlers.open.should.eql([ notATarget ]);
  });
});
