const _data = require('./data');
const helpers = require('./helpers');

const handlers = {};

handlers.users = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
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
              callback(200);
            } else {
              console.log(err);
              callback(500, { err: 'Could not add the user'});
            }
          });
        } else {
          callback(500, { err: 'Could not hash the password.'});
        }
      } else {
        callback(400, { err: 'A users with that phone no already exist'});
      }
    });
  } else {
    callback(400, { err: 'Missing required fields'});
  }
}

handlers._users.get = (data, callback) => {
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone) {
    _data.read('users', phone, (err, data) => {
      if(!err && data){
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404, {err: 'Phone number not Found'});
      }
    })
  } else {
    callback(400, {err: 'Missing Data'});
  }
}

handlers._users.put = (data, callback) => {
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  console.log(firstName, lastName, password)
  if(phone) {

    if(firstName || lastName || password) {
      _data.read('users', phone, (err, userData) => {
        if(!err && userData) {
          if(firstName) {
            userData.firstName = firstName;
          }
          if(lastName) {
            userData.lastName = firstName;
          }
          if(password) {
            userData.hashedPassword = helpers.hash(password);;
          }

          _data.update('users', phone, userData, (err) => {
            if(!err) {
              callback(200, {note: 'Record Updated'});
            } else {
              console.log(err)
              callback(500,{err: 'Could not update the user'});
            }
          });
        } else {
          callback(404, {err: 'Record not found'})
        }
      });
    } else {
      callback(400, {err: 'Missing fields to update'});
    }
  } else {
    callback(400, {err: 'Missing required fields'});
  }

}

handlers._users.delete = (data, callback) => {
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

  if(phone) {
    _data.read('users', phone, (err, data) => {
      if(!err && data) {
        _data.delete('users', phone, err => {
          if(!err) {
            callback(200, {err: 'User Deleted'});
          } else {
            callback(500, {err: 'Could not Delete the record'})
          }
        });
      } else {
        callback(400, {err: 'No record found'})
      }
    });
  }else {
    callback(404,{err: 'Missing required field'});
  }
}


handlers.ping = (data, callback) => {
  //Callback a http status code and a payload object
  callback(200);
};

//not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
