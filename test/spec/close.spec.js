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

  it ('should not send end event if closed', function() {
    var spy = sinon.spy();
    res.open().close();

    res.on('end', spy);
    res.close();
    spy.called.should.be.not.ok;
  });

  it ('should close the file if the file was opened at the same exact time', sinon.test(function() {
    this.stub(fs, 'close');
    this.stub(fs, 'fstat');
    this.stub(fs, 'open', function(file, flag, cb) {
      cb(null, 'fd');
    });
    res.open().close();
    fs.close.called.should.be.ok;
  }));

  it ('should close the file if it has been opened and the fd is defined', sinon.test(function() {
    res._fd = 'fd sample';
    res._started = true;

    this.stub(fs, 'close');

    res.close();
    res._started.should.be.not.ok;
    fs.close.called.should.be.ok;
  }));

  it ('should trigger the error event if closing fails', sinon.test(function() {
    var spy = sinon.spy();

    res._fd = 'fd example';
    res._started = true;

    this.stub(fs, 'close', function(fd, callback) {
      callback('error');
    });

    res.on('error', spy);

    res.close();
    spy.called.should.be.ok;
  }));

  it ('should not fstat the file if the taily was instantly closed after opening', sinon.test(function() {
    this.stub(fs, 'open', function(file, options, callback) {
      // Lets emulate async
      setTimeout(function() {
        callback(null, 'fd');
      }, 10);
    });

    this.stub(fs, 'fstat');
    this.stub(fs, 'close');

    res.open().close();

    fs.fstat.called.should.be.not.ok;
  }));

  it ('should remove watcher if closed', sinon.test(function() {
    this.stub(fs, 'unwatchFile', function(file, handler) {
      file.should.be.ok;
      handler.should.be.ok;
    });

    this.stub(fs, 'close');

    res._watcher = function() {};
    res._started = true;
    res._fd      = true;

    res.close();

    fs.unwatchFile.called.should.be.ok;
  }));

  it ('should not trigger end event twice if the stream was instantly closed after opening', sinon.test(function() {
    var spy = sinon.spy();

    this.stub(fs, 'open', function(file, options, callback) {
      // Lets emulate async
      setTimeout(function() {
        callback(null, 'fd');
      }, 10);
    });

    this.stub(fs, 'close', function(file, callback) {
      callback(null);
    });

    res.on('end', spy);
    res.open().close();

    spy.callCount.should.eql(1);
  }));

  it ('should not trigger end event twice if the stream opening returned an error', sinon.test(function() {
    var spy = sinon.spy();

    this.stub(fs, 'open', function(file, options, callback) {
      callback('some error');
    });

    this.stub(fs, 'close', function(file, callback) {
      callback(null);
    });

    res.on('end', spy);
    res.open();

    spy.callCount.should.eql(1);
  }));

});

