var Giza = require('giza').Giza;
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

var giza = new Giza();

giza.save('/hotel1');

giza.addTrigger('/hotel1', 'vacancies', function(event, source, type, oldVal){
  var root = giza.get('/hotel1');
  var vacancies = 0;
  if (root && root.vacancies){
    vacancies = root.vacancies;
  }
  if (event === 'create' && type === 'room'){
    var room = source.obj;
    if (!room.occupied){
      // A new room was created and it's empty.
      return vacancies+1;
    } else{
      // A room was created, but it's initially occupied
      return vacancies;
    }
  } else if (event === 'update' && type === 'room'){
    if (source.obj.occupied === true && oldVal.occupied === false){
      return vacancies-1;
    } else if (oldVal.occupied === true && source.obj.occupied === false){
      return vacancies+1;
    } else{
      // return unaltered.
      return vacancies;
    }
  }
  // Not interested in this event, just return the incoming data.
  return vacancies;
});

// Seed Giza with some initial data.
for (var floor = 1; floor < 4; floor++){
  // Not necessary as it would be created automatically. But as an example...
  giza.save('/hotel1/' + floor);
  for (var room = 10; room <= 15; room++){
    giza.save('/hotel1/' + floor + '/' + room, {
      commonNumber: floor + '' + room, // Floor 4, room 15 = "415".
      occupied: false
    }, 'room');
  }
}

setInterval(function(){
  var full = false;
  var rooms = giza.find({types: 'room'});
  var random = _.random(0, _.size(rooms)-1);
  rooms[_.keys(rooms)[random]].occupied = true;
  giza.save(_.keys(rooms)[random], rooms[_.keys(rooms)[random]], 'room');
}, 500);


// Some code modeled after helpful post at 
// http://stackoverflow.com/questions/18990494

app.listen(3000);

function handler (req, res) {
  fs.readFile(__dirname + '/../index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  socket.on('get', function (path) {
    var data = giza.get(path, {
      recursive: true,
      callback: function(eventName, source, type, oldObj){
        if (eventName === 'update' || eventName === 'vacancies'){
          // Only interested in update or trigger events right now
          socket.emit(path, eventName, source, type, oldObj);
        }
      }
    });
    socket.emit(path, data);
  });
});