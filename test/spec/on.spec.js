/* jshint expr:true */
var path  = require('path'),
    fs    = require('fs'),
    sinon = require('sinon'),
    _     = require('lodash');

var taily = require("../../");

describe ('#on', function() {
  var res;

  beforeEach(function() {
    res = taily.create('filename');
  });

  it ('should have on function', function() {
    res.on.should.be.instanceOf(Function);
  });

  it ('should return back the same chainable instance', function() {
    res.on('open', function() {}).should.eql(res);
  });

  it ('should not add duplicate event handlers for the same event', function() {
    var defined = sinon.spy();

    res.on('open', defined);
    res.on('open', defined);

    res._handlers.open.length.should.equal(1);
  });

  it ('should throw when the event is not supported', function() {
    (function() {
      res.on('not supported', function() {});
    }).should.throw('Event not supported');
  });

  it ('should throw when the callback is not a function', function() {
    (function() {
      res.on('open', null);
    }).should.throw('No callback defined');
  });

  // TODO: Refactor this?
  it ('should trigger the callback if its defined on an event', function(done) {
    res.on('open', function(one, two, three) {
      one.should.equal('one');
      two.should.equal('two');
      three.should.equal('three');
      done();
    });

    res._trigger('open', [ 'one', 'two', 'three' ]);
  });
});
