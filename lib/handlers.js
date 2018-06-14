const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

const handlers = {};

handlers.users = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405, { note: 'Method not allowed' });
  }
}

//Users sub methods
handlers._users = {};

// Req Data: firstName, lastName, phone, password, tosAggrement
handlers._users.post = (data, callback) => {
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAggrement = typeof(data.payload.tosAggrement) == 'boolean' && data.payload.tosAggrement == true ? true : false;

  if (firstName && lastName && phone && password && tosAggrement) {

    _data.read('users', phone, (err, data) => {
      if (err) {
        var hashedPassword = helpers.hash(password);

        if (hashedPassword) {

          var userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAggrement
          };

          _data.create('users', phone, userObject, (err) => {
            if (!err) {
              callback(200, { note: 'User added' });
            } else {
              console.log(err);
              callback(500, { err: 'Could not add the user' });
            }
          });
        } else {
          callback(500, { err: 'Could not hash the password.' });
        }
      } else {
        callback(400, { err: 'A users with that phone no already exist' });
      }
    });
  } else {
    callback(400, { err: 'Missing required fields' });
  }
}

handlers._users.get = (data, callback) => {
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {

    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {

        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404, { err: 'Phone number not Found' });
          }
        });

      } else {
        callback(403, { err: 'Missing required token header or token is invalid' });
      }
    });
  } else {
    callback(400, { err: 'Missing Data' });
  }
}

handlers._users.put = (data, callback) => {
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  console.log(firstName, lastName, password)
  if (phone) {
    if (firstName || lastName || password) {

      const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

      handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
        if (tokenIsValid) {

          _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = firstName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);;
              }

              _data.update('users', phone, userData, (err) => {
                if (!err) {
                  callback(200, { note: 'Record Updated' });
                } else {
                  console.log(err)
                  callback(500, { err: 'Could not update the user' });
                }
              });
            } else {
              callback(404, { err: 'Record not found' })
            }
          });

        } else {
          callback(403, { err: 'Missing required token header or token is invalid' });
        }
      });

    } else {
      callback(400, { err: 'Missing fields to update' });
    }
  } else {
    callback(400, { err: 'Missing required fields' });
  }

}

handlers._users.delete = (data, callback) => {
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

  if (phone) {

    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        _data.read('users', phone, (err, userData) => {
          if (!err && userData) {
            _data.delete('users', phone, err => {
              if (!err) {
                const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks: [];
                const checksToDelete = userChecks.length;

                if(checksToDelete > 0) {
                  let checksDeleted = 0;
                  let deletionErrors = false;

                  userChecks.forEach(checkId => {
                    _data.delete('checks', checkId, err => {
                      if(err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;

                      if(checksDeleted == checksToDelete) {
                        if(!deletionErrors) {
                          callback(200);
                        }else {
                          callback(500, {err: 'Error encounter while deleting all the user checks. All the checks for this user may not have been deleted succesfully'});
                        }
                      }
                    });
                  });
                }else {
                  callback(200);
                }
              } else {
                callback(500, { err: 'Could not Delete the record' })
              }
            });
          } else {
            callback(400, { err: 'No record found' })
          }
        });

      } else {
        callback(403, { err: 'Missing required token header or token is invalid' });
      }
    });

  } else {
    callback(404, { err: 'Missing required field' });
  }
}

handlers.tokens = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405, { note: 'Method not allowed' });
  }
}

handlers._tokens = {};

handlers._tokens.get = (data, callback) => {
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    })
  } else {
    callback(400, { err: 'Missing Data' });
  }
}

handlers._tokens.post = (data, callback) => {
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (phone && password) {
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;

          const tokenObject = {
            phone,
            expires,
            id: tokenId,
          };

          _data.create('tokens', tokenId, tokenObject, err => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { err: 'Could not create the token' });
            }
          });

        } else {
          callback(400, { err: 'Incorrect Password' });
        }
      } else {
        callback(400, { err: 'record not found' });
      }
    });
  } else {
    callback(400, { err: 'Missing required fields' });
  }
}

handlers._tokens.put = (data, callback) => {
  const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

  if (id && extend) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          _data.update('tokens', id, tokenData, err => {
            if (!err) {
              callback(200, { note: 'Token extended' });
            } else {
              callback(500, { err: 'Could not update the token expiration' });
            }
          });
        } else {
          callback(400, { err: 'token has been expired and cannot be expanded' });
        }
      } else {
        callback(400, { err: 'Token does not exist' });
      }
    });
  } else {
    callback(400, { err: 'Missing required fields or invalid' });
  }
}

handlers._tokens.delete = (data, callback) => {
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

  if (id) {
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        _data.delete('tokens', id, err => {
          if (!err) {
            callback(200, { err: 'Token Deleted' });
          } else {
            callback(500, { err: 'Could not Delete the token' })
          }
        });
      } else {
        callback(400, { err: 'No token found' })
      }
    });
  } else {
    callback(404, { err: 'Missing required field' });
  }
}

handlers._tokens.verifyToken = (id, phone, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }

  });
}

handlers.checks = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405, { err: 'Method not allowed' });
  }
}

handlers._checks = {};

handlers._checks.post = (data, callback) => {
  const protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeOutSeconds = typeof(data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 == 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= 5 ? data.payload.timeOutSeconds : false;

  if(protocol && url && method && successCodes && timeOutSeconds) {
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    _data.read('tokens', token, (err, tokenData) => {
      if(!err && tokenData) {
        const userPhone = tokenData.phone;

        _data.read('users', userPhone, (err, userData) =>{
          if(!err && userData) {
            const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks: [];

            if(userChecks.length < config.maxChecks) {
              const checkId = helpers.createRandomString(20);
              const checkObject = {
                id: checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeOutSeconds
              };

              _data.create('checks', checkId, checkObject, err => {
                if(!err) {
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  _data.update('users', userPhone, userData, err => {
                    if(!err) {
                      callback(200, checkObject);
                    }else {
                      callback(500, {err: 'Could not update the user with the new check'})
                    }
                  });
                }else {
                  callback(500, {err: 'Could not create a new Check'});
                }
              });
            }else {
              callback(400, { err: 'User allready have maximum number of checks ('+config.maxChecks+')' });
            }
          }else {
            callback(403,{err: "user not found"});
          }
        });
      }else {
        callback(403,{err: "token not found"});
      }
    });

  } else {
    callback(400, { err: 'Missing required input or inputs are invalid' });
  }
}

handlers._checks.get = (data, callback) => {
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('checks', id, (err, checkData) => {
      if(!err && checkData) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
          if (tokenIsValid) {
            callback(200, checkData);
          } else {
            callback(403, {err: 'Missing required token header or token is invalid'});
          }
       });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { err: 'Missing Data' });
  }
}

handlers._checks.put = (data, callback) => {
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

  const protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeOutSeconds = typeof(data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 == 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= 5 ? data.payload.timeOutSeconds : false;

  if(id) {

    if(protocol || url || method || successCodes || timeOutSeconds) {
      _data.read('checks', id, (err, checkData) => {
        if(!err && checkData) {
          const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

          handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
            if (tokenIsValid) {
              if(protocol) {
                checkData.protocol  = protocol;
              }
              if(url) {
                checkData.url  = url;
              }
              if(method) {
                checkData.method  = method;
              }
              if(successCodes) {
                checkData.successCodes  = successCodes;
              }
              if(timeOutSeconds) {
                checkData.timeOutSeconds  = timeOutSeconds;
              }

              _data.update('checks', id, checkData, err => {
                if(!err) {
                  callback(200);
                }else {
                  callback(500, {err: 'Not able to update the check'});
                }
              })
            } else {
              callback(403, {err: 'Missing required token header or token is invalid'});
            }
          });

        }else {
          callback(400, {err: 'Check ID did not exist'});
        }
      });
    }else {
      callback(400, {err: 'Missing fields to update'});
    }
  }else {
    callback(400, {err: 'Missing required field'});
  }
}

handlers._checks.delete = (data, callback) => {
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

  if (id) {
    _data.read('checks', id, (err, checkData) => {
        if(!err && checkData) {
          const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

          handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
            if (tokenIsValid) {
              _data.delete('checks', id, err => {
                if(!err) {
                  _data.read('users', checkData.userPhone, (err, userData) => {
                    if (!err && userData) {

                      const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks: [];
                      const checkPosition = userChecks.indexOf(id);

                      if(checkPosition > -1) {
                        userChecks.splice(checkPosition,1);
                        _data.update('users', checkData.userPhone, userData, err => {
                          if (!err) {
                            callback(200, { err: 'User Updated' });
                          } else {
                            callback(500, { err: 'Could not Update the user' });
                          }
                        });
                      }else {
                        callback(500, {err : "Could not the found the check on the users check list so was not able to remove it"});
                      }
                    } else {
                    callback(500, { err: 'Could not able to find record about this check\'s user' })
                    }
                  });

                }else {
                  callback(500, {err: 'Were not able to delete the check'})
                }
              })
            } else {
              callback(403, {err: 'Missing required token header or token is invalid'});
            }
          });

        }else {
          callback(400, {err: 'Check ID did not exist'});
        }
      });

  } else {
    callback(404, { err: 'Missing required field' });
  }
}

handlers.ping = (data, callback) => {
  callback(200);
};

//not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
