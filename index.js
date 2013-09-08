/* jshint node: true */
'use strict';

var fs    = require('fs'),
    _     = require('lodash'),
    async = require('async');

function isDef(data) {
  return typeof data !== "undefined" && data !== null;
}

function Taily(file, options) {
  this.file    = file;
  this.options = _.merge({}, this._default_options, options);

  // Add default handlers
  this._handlers = _.merge({}, this._default_handlers);

  this._fd      = null;
  this._watcher = null;
  this._started = false;
  this._bytes   = null;
}

Taily.prototype._default_handlers = {
  open   : [],
  end    : [],
  data   : [],
  change : [],
  error  : []
};

// Default properties
Taily.prototype._default_options = {
  chunksize : 512,
  encoding  : 'utf8',
  debug     : true,
  interval  : 500
};

Taily.prototype.on = function(event, callback) {
  if (!this._handlers.hasOwnProperty(event)) {
    throw new Error('Event not supported');
  } else if (typeof callback !== "function") {
    throw new Error('No callback defined');
  }

  var specificHandler = this._handlers[event];

  // If the callback is not in the list, add it
  if (!~specificHandler.indexOf(callback)) {
    specificHandler.push(callback);
  }

  return this;
};

Taily.prototype.off = function(event, callback) {
  if (!isDef(event) && !isDef(callback)) {
    this._handlers = _.merge({}, this._default_handlers);
  } else if (!isDef(callback)) {
    this._handlers[event] = [];
  } else {
    this._handlers[event] = this._handlers[event].filter(function(handler) {
      return handler !== callback;
    });
  }

  return this;
};

Taily.prototype.isOpen = function() {
  return this._started && isDef(this._fd);
};

Taily.prototype.open = function() {
  var self = this;

  // Do not restart the stream
  // if its already open.
  // Deal this situation as normal.
  if (!this._started) {
    this._started = true;

    this._open(function() {
      // stat the file first and get its size
      // we need it to calculate how much we have to read from the change
      self._stat(function(stat) {
        self._bytes = stat.size;
        self._watchFileChanges(self._prepareForReading.bind(self));
      });
    });
  }

  return this;
};

Taily.prototype._prepareForReading = function() {
  var self = this;
  this._stat(function(stat) {
    // It seems that something has been removed from the file
    // lets change our "initial file size" accordingly
    if (self._bytes > stat.size) {
      self._bytes = stat.size;
    }

    self._read(stat.size);
  });
};

Taily.prototype._open = function(callback) {
  var self = this;

  fs.open(this.file, 'r', function(err, fd) {
    if (err) {
      self._trigger('error', err);
      self.close();
      return;
    }
    self._trigger('open', self.file);
    self._fd = fd;

    callback();
  });
};

Taily.prototype._close = function(callback) {
  var self = this;
  fs.close(this._fd, function(err) {
    if (err) {
      self._trigger('error', err);
    }

    callback();
  });
};

Taily.prototype.close = function() {
  var self = this;

  // Do not throw when one is trying to close a already open taily
  // consider this normal behaviour
  if (this._started) {
    this._started = false;

    // Unwatch the file
    if (this._watcher) {
      fs.unwatchFile(this.file, this._watcher);
      this._watcher = null;
    }

    // If its open then lets close it.
    if (this._fd) {
        this._close(function() {
          self._trigger('end');
          self._fd      = null;
        });
    } else {
      self._trigger('end');
    }
  }
};

Taily.prototype._trigger = function(event, payload) {
  var self = this;

  this._handlers[event].forEach(function(callback) {
    callback.apply(self, [].concat(payload));
  });
};

Taily.prototype._watchFileChanges = function(callback) {
  var self = this;

  // Save the watcher instance
  this._watcher = function() {
    self._trigger('change');
    callback();
  };

  fs.watchFile(this.file, {
    persistent : true,
    interval   : this.options.interval
  }, this._watcher);
};

Taily.prototype._stat = function(callback) {
  var self = this;

  // If for some reason the taily was closed then lets close the file
  if (!self._started) {
    self.close();
    return;
  }

  fs.fstat(this._fd, function(err, stat) {
    if (err) {
      self._trigger('error', err);
      self.close();
      return;
    }

    callback(stat);
  });
};

Taily.prototype._readCb =  function (err, bytesRead, buffer) {
  if (err) {
    this._trigger('error', err);
    this.close();
    return;
  }

  this._bytes += bytesRead;
  this._trigger('data', [ buffer.toString(this.options.encoding), bytesRead ]);
};

Taily.prototype._getChunkSize = function(toRead) {
  var maxChunk = this.options.chunksize;
  return maxChunk >= toRead ? toRead : maxChunk;
};

Taily.prototype._read = function(size) {
  var readsize  = size - this._bytes,
      bytesRead = 0;

  while (readsize > bytesRead) {
    var chunksize = this._getChunkSize(readsize - bytesRead),
        buffer    = new Buffer(chunksize);

    fs.read(this._fd, buffer, 0, chunksize, this._bytes + bytesRead, this._readCb.bind(this));
    bytesRead += chunksize;
  }
};

exports.create = function(file, options) {
  if (!isDef(file)) {
    throw new Error('No file defined');
  }

  return new Taily(file, options);
};
