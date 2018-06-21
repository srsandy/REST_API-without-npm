/*
  Libary to store and editing data
 */

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const lib = {};

lib.baseDir = path.join(__dirname, '../.data/');

//write data to file
lib.create = function(dir, file, data, callback) {
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {

      var stringData = JSON.stringify(data);

      fs.writeFile(fileDescriptor, stringData, err => {
        if (!err) {
          fs.close(fileDescriptor, err => {
            if (!err) {
              callback(false);
            } else {
              callback('Erorr closing the file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });

    } else {
      callback('Could not create a file, it may already exist');
    }
  });
}

lib.read = function(dir, file, callback) {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
}

lib.update = function(dir, file, data, callback) {
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {

    if (!err && fileDescriptor) {
      var stringData = JSON.stringify(data);

      fs.ftruncate(fileDescriptor, err => {
        if (!err) {
          fs.writeFile(fileDescriptor, stringData, err => {
            if (!err) {
              fs.close(fileDescriptor, err => {
                if (!err) {
                  callback(false);
                } else {
                  callback('Error closing existing file');
                }
              })
            } else {
              callback('Error writing the file');
            }
          });
        } else {
          callback('Err truncating file');
        }
      });
    } else {
      callback('Could not open the file for updating, it may not yet been created');
    }
  });
}

lib.delete = function(dir, file, callback) {
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', err => {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting file');
    }
  });
}

lib.list = function(dir, callback){
  fs.readdir(lib.baseDir+dir+'/', (err, data) => {
    if(!err && data && data.length > 0) {
      const trimmedFileNames = [];
      data.forEach( filename => {
        trimmedFileNames.push(filename.replace('.json', ''));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
}

module.exports = lib;

/*

The fileDescriptor will be used to reference the correct file stream by all file system related functions.
That second parameter represents a fileDescriptor, useful to access that opened file inside the callback.

 */
