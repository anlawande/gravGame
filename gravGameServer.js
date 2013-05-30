var app = require('http').createServer(handler),
		io = require('socket.io').listen(app),
		fs = require('fs'),
    url = require('url');

app.listen(80);

function handler (req, res) {
  var getJs = /game-script\.js$/;
  var urlpath = url.parse(req.url).pathname;
  var errFunc = function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  };
  if(getJs.test(urlpath)){
    res.writeHead(200, {"Content-Type": "text/javascript"});
    fs.readFile(__dirname + '/game-script.js', errFunc);
  }
  else{
    res.writeHead(200, {"Content-Type": "text/html"});
    fs.readFile(__dirname + '/gravGame.html', errFunc);
  }
}
var games = {};
var testGame = 'test';
function Game(){
  this.players = [];
  this.sockets = [];
}
games[testGame] = new Game();

io.sockets.on('connection', function (socket) {
  var currentGame = games[testGame];
  var user = "Player" + (currentGame.players.length + 1);
  currentGame.players.push(user);
  console.log(currentGame.players);
  currentGame.sockets.push(socket);

  socket.on('move', function (data) {
    //console.log(data);
    io.sockets.emit('move', data);
    //socket.emit('news', { hello: 'world' });
  });

  socket.emit('con_status', { msg: 'Connection Established' });
  for(var i in currentGame.sockets){
    currentGame.sockets[i].emit("user_status", {msg : 'connected', 'user': user});
  }
});