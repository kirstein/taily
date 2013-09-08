/* jshint expr:true */
var path  = require('path'),
    fs    = require('fs'),
    sinon = require('sinon'),
    _     = require('lodash');

var taily = require("../../");

describe ('#isOpen', function() {
  var res;

  beforeEach(function() {
    res = taily.create('filename');
  });

  it ('should contain isOpen function', function() {
    res.isOpen.should.be.instanceOf(Function);
  });

  it ('should return true if started and fd is available', function() {
    res._started = true;
    res._fd      = 'something';

    res.isOpen().should.eql(true);
  });
});

