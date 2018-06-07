const handlers = {};

handlers.users = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];

  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
}

//Users sub methods
handlers._users = {};

handlers._users.post =  (data, callback) => {

}

handlers._users.get =  (data, callback) => {

}

handlers._users.put =  (data, callback) => {

}

handlers._users.delete =  (data, callback) => {

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
