/* jshint expr:true */
var path  = require('path'),
    fs    = require('fs'),
    sinon = require('sinon'),
    _     = require('lodash');

var taily = require("../../");

describe ('#open', function() {
  var res;

  beforeEach(function() {
    res = taily.create('filename');
  });

  it ('should have open function', function() {
    res.open.should.be.instanceOf(Function);
  });

  it ('should return back the same chainable instance', function() {
    res.open().should.eql(res);
  });

  it ('should not open the file defined for reading when first started', sinon.test(function() {
    this.spy(fs, 'open', function(file, flag, callback) {
      callback();
    });
    this.stub(fs, 'stat', function(file, callback) {
      callback(null, { size : 123 });
    });
    this.stub(fs, 'read');

    res.open();
    fs.read.called.should.not.be.ok;
  }));

  it ('should not open the file defined for reading if its already open', sinon.test(function() {
    this.stub(fs, 'open', function(path, flag, callback) {
      path.should.equal('filename');
      flag.should.equal('r');

      callback(null, 'fs mock');
    });

    this.stub(fs, 'fstat', function(fd, callback) {
      callback(null, {});
    });

    res.open();
    res.open();
    fs.open.calledOnce.should.be.ok;
  }));

  it ('should trigger a error event if open receives an error', sinon.test(function() {
    this.stub(fs, 'open', function(path, flag, callback) {
      callback('test error', null);
    });

    this.stub(res, '_trigger');

    res.open();
    res._trigger.firstCall.args.should.eql(['error', 'test error']);
  }));


  it ('should trigger a end event if open receives an error', sinon.test(function() {
    this.stub(fs, 'open', function(path, flag, callback) {
      callback('test error', null);
    });

    this.stub(fs, 'close', function(fd, callback) {
      callback();
    });

    var spy = sinon.spy();

    res.on('end', spy);

    res.open();
    spy.called.should.be.ok;
  }));

  it ('should trigger the open event if open was successful', sinon.test(function() {
    var spy = sinon.spy();
    this.stub(fs, 'open', function(path, flag, callback) {
      callback(null, 'fd');
    });

    this.stub(fs, 'fstat');
    res.on('open', spy);
    res.open();

    spy.called.should.be.ok;
  }));

  it ('should trigger the open event if open was successful and pass in the filename', sinon.test(function() {
    this.stub(fs, 'open', function(path, flag, callback) {
      callback(null, 'fd');
    });

    this.stub(fs, 'fstat');
    res.on('open', function(filename) {
      filename.should.eql(res.file);
    });

    res.open();
  }));

  it ('should open watching the files with defined interval param', sinon.test(function() {
    this.stub(fs, 'open', function(path, flag, callback) {
      callback(null, 'fd');
    });

    this.stub(fs, 'fstat', function(file, callback) {
      callback(null, {});
    });

    this.stub(fs, 'watchFile');

    res.open();

    fs.watchFile.firstCall.args[1].interval.should.equal(res.options.interval);
  }));

  it ('should send change event if watchFile triggered', sinon.test(function() {
    var spy = sinon.spy();

    this.stub(fs, 'watchFile', function(filename, params, callback) {
      callback();
    });

    this.stub(fs, 'fstat', function(file, callback) {
      callback(null, { size: 123 });
    });

    this.stub(fs, 'open', function(filename, flag, callback) {
      callback(null, 'fd');
    });

    this.stub(fs, 'read');

    res.on('change', spy);
    res.open();
    spy.called.should.be.ok;
  }));

  it ('should stat a file if its watchFile is triggered with a change', sinon.test(function() {
    this.stub(fs, 'watchFile', function(filename, params, callback) {
      callback();
    });

    this.stub(fs, 'open', function(filename, flag, callback) {
      callback(null, 'fd');
    });

    this.stub(fs, 'fstat');

    res.open();
    fs.fstat.calledOnce.should.be.ok;
  }));

  it ('should write the new length if the stated length is smaller than the previous one', sinon.test(function() {
    res._started = true;
    res._bytes = 500;
    this.stub(fs, 'fstat', function(fd, cb) {
      cb(null, { size: 200 });
    });

    res._prepareForReading();
    res._bytes.should.eql(200);
  }));

  it ('should trigger error event if the stating fails', sinon.test(function() {
    this.stub(fs, 'watchFile', function(filename, params, callback) {
      callback();
    });

    this.stub(fs, 'open', function(filename, flag, callback) {
      callback(null, 'fd');
    });

    this.stub(res, 'close');

    this.stub(fs, 'fstat', function(fd, callback) {
      callback('fstat error');
    });

    res.on('error', function(error) {
      error.should.eql('fstat error');
    });

    res.open();
  }));

  it ('should trigger end event if the stating fails', sinon.test(function() {
    var spy = sinon.spy();

    this.stub(fs, 'watchFile', function(filename, params, callback) {
      callback();
    });

    this.stub(fs, 'open', function(filename, flag, callback) {
      callback(null, 'fd');
    });

    this.stub(fs, 'close', function(fd, callback) {
      callback(null);
    });

    this.stub(fs, 'fstat', function(fd, callback) {
      callback('fstat error');
    });

    res.on('error', spy);

    res.open();
    spy.called.should.be.ok;
  }));

  it ('should trigger data event if the reading was successful', sinon.test(function() {
    var buffer;

    this.stub(fs, 'read', function(fd, buf, offset, length, position, cb) {
      buffer = new Buffer('data something!');
      cb(null, buffer.length, buffer);
    });

    this.spy(res, '_trigger');

    res._read(123);
    res._trigger.called.should.be.ok;
    res._trigger.args[0][0].should.eql('data');
    res._trigger.args[0][1].should.eql([buffer.toString('utf8'), buffer.length]);
  }));

  it ('should trigger error event if reading was unsuccessful', sinon.test(function() {

    this.stub(fs, 'read', function(fd, buf, offset, length, position, cb) {
      cb('reading error');
    });

    this.spy(res, '_trigger');

    res._read(123);
    res._trigger.called.should.be.ok;
    res._trigger.args[0].should.eql(['error', 'reading error']);
  }));

  it ('should close it the reading fails', sinon.test(function() {

    this.stub(fs, 'read', function(fd, buf, offset, length, position, cb) {
      cb('reading error');
    });

    this.spy(res, 'close');

    res._read(123);
    res.close.called.should.be.ok;
  }));

  it ('should read two times if the change length is 2xhigher than the buffer', sinon.test(function() {
    this.stub(fs, 'read', function(fd, buf, offset, length, position, cb) {
      cb(null, length, 'data');
    });

    var chunksize = res.options.chunksize = 123;

    // random byte count that has been read so far
    res._bytes = 12125;

    res._read(12125 + 2*chunksize);
    fs.read.callCount.should.eql(2);
  }));

  it ('should read three times if the change length is 3xhigher than the buffer', sinon.test(function() {
    this.stub(fs, 'read', function(fd, buf, offset, length, position, cb) {
      cb(null, length, 'data');
    });

    var chunksize = res.options.chunksize = 123;

    // random byte count that has been read so far
    res._bytes = 12125;

    res._read(12125 + 3*chunksize);
    fs.read.callCount.should.eql(3);
  }));

  it ('should not exceed the buffer length on reading larger set of data', sinon.test(function() {
    this.stub(fs, 'read', function(fd, buf, offset, length, position, cb) {
      buf.length.should.not.be.above(length);
      cb(null, length, 'data');
    });

    var chunksize = res.options.chunksize = 100;
    res._read(1000);
  }));

  it ('should read only the newly changed parts of the file and write add the bytes to res._bytes', sinon.test(function() {
    this.stub(fs, 'read', function(fd, buf, offset, length, position, cb) {
      buf.length.should.eql(100);
      offset.should.eql(0);
      length.should.eql(100);
      position.should.eql(12125);
      cb(null, length, 'data');
    });

    // random byte count that has been read so far
    res._bytes = 12125;

    res._read(12125 + 100);
    res._bytes.should.eql(12125 + 100);
  }));
});

