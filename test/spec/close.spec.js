/* jshint expr:true */
var path  = require('path'),
    fs    = require('fs'),
    sinon = require('sinon'),
    _     = require('lodash');

var taily = require("../../");

describe ('#close', function() {
  var res;

  beforeEach(function() {
    res = taily.create('filename');
  });


  it ('should have close function', function() {
    res.close.should.be.instanceOf(Function);
  });

  it ('should not send end event if closed', sinon.test(function() {
    res._stared = false;
    this.stub(res, '_trigger');

    res.close();
    res._trigger.called.should.be.not.ok;
  }));

});

