/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var child_process = require('child_process');
var async = require('async');
var path = require('path');
var os = require('os');
var utils = require('./utils');

/**
 * @module denymount
 */

var EXECUTABLE_PATH = path.join(__dirname, '..', 'bin', 'denymount');

/**
 * @summary Prevent automatic mounting of an OS X disk
 * @name denymount
 * @function
 * @public
 *
 * @param {String} disk - disk
 * @param {Function} handler - handler (callback)
 * @param {Object} [options] - options
 * @param {Boolean} [options.autoMountOnSuccess=false] - auto-mount on success
 * @param {Function} callback - callback (error)
 *
 * @example
 * denymount('/dev/disk2', function(callback) {
 *   console.log('While this code runs, /dev/disk2 is ensured to not be auto-mounted');
 *   return callback(null, 'foo');
 * }, {
 *   autoMountOnSuccess: true
 * }, function(error, message) {
 *   if (error) {
 *     throw error;
 *   }
 *
 *   console.log(message);
 * });
 */
module.exports = function(disk, handler, options, callback) {

  if (!callback) {
    callback = options;
    options = {};
  }

  // For convenience, instead of declaring the module's platform to `darwin`,
  // we call the handler without executing the child process so the module
  // can be transparently used without issues in non darwin platforms.
  if (os.platform() !== 'darwin') {
    return handler(callback);
  }

  var child = child_process.execFile(EXECUTABLE_PATH, [
    utils.getDeviceBSDName(disk)
  ], function(error) {

    // We send SIGTERM to kill the child process once we're
    // done, so no need to throw an error if the process is
    // terminated with this signal.
    if (error && error.signal !== 'SIGTERM') {
      return callback(error);
    }

  });

  async.waterfall([
    function(callback) {

      // Wait until the Child Process object returned from
      // `execFile` has a `pid`, which is a good indicator
      // that the process is running.
      async.whilst(function() {
        return !child || !child.pid;
      }, function(callback) {
        setTimeout(callback, 100);
      }, callback);

    },
    function(callback) {

      // There is no easy way to ensure the CLI tool
      // is already interceping mount requests by the time
      // the handler is called.
      // As a good enough solution for now, we wait for an
      // empirically derived amount of time.
      setTimeout(function() {
        handler(callback);
      }, 1000);

    }
  ], function(error) {
    if (child) {
      child.kill();
    }

    if (error) {
      return callback(error);
    }

    var args = arguments;

    async.waterfall([
      function(callback) {
        if (options.autoMountOnSuccess) {
          var macmount = require('macmount');
          return macmount.mount(disk, callback);
        }

        return callback();
      }
    ], function(error) {
      if (error) {
        return callback(error);
      }

      return callback.apply(null, args);
    });
  });
};
