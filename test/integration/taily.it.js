/* jshint expr:true */
var path  = require('path'),
    _     = require('lodash'),
    fs    = require('fs'),
    sinon = require('sinon');

var taily = require("../../");

var FIXTURE = process.cwd() + "/test/integration/fixture";

function append(data) {
  var stream = fs.createWriteStream(FIXTURE, {
    flags: "a"
  });
  stream.end(data);
  return stream;
}

beforeEach(function() {
  fs.writeFileSync(FIXTURE, '');
});

describe ('reading it', function() {
  var res;

  beforeEach(function() {
    res = taily.create(FIXTURE);
  });

  afterEach(function(done) {
    if (res.isOpen()) {
      res.on('end', done).close();
    } else {
      done();
    }
  });

  it ('should open the file', function(done) {
    res.on('open', function() {
      done();
    });

    res.on('error', function(error) {
      done(error);
    });

    res.open();
  });

  it ('should return the new data after files change', function(done) {
    var changeSpy = sinon.spy();
    res.on('error', function(error) {
      done(error);
    });

    res.on('change', changeSpy);

    res.on('data', function(data, bytes) {
      changeSpy.called.should.be.ok;

      data.should.eql('data');
      done();
    });

    res.open();

    append('data');
  });

  it ('should figure out if the contents some of file has been removed', function(done) {
    this.timeout(3000);
    res.on('error', function(error) {
      done(error);
    });

    res.open();

    append('data to append').on('finish', function() {
      fs.writeFileSync(FIXTURE, '');

      res.on('data', function(data) {
        data.should.eql('yolo');
        done();
      });

      append('yolo').on('finish', function() {
        console.log('wrote to file');
      });
    });
  });
});

