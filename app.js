var
    gameport        = process.env.PORT || 5555,

    io              = require('socket.io'),
    express         = require('express'),
    UUID            = require('uuid'),

    verbose         = false,
    http            = require('http'),
    app             = express(),
    server          = http.createServer(app);

//Tell the server to listen for incoming connections
server.listen(gameport)

//Log something so we know that it succeeded.
console.log('\t --- Listening on port ' + gameport );

//By default, we forward the / path to index.html automatically.
app.get( '/', function( req, res ){
    console.log('trying to load %s', __dirname + '/index.html');
    res.sendfile( 'src/client/index.html' , { root:__dirname });
});

app.get( '/*' , function( req, res, next ) {
    var file = req.params[0];
    if(verbose) console.log('\t :: Express :: file requested : ' + file);
    res.sendfile( __dirname + '/' + file );
}); //app.get *

/* Socket.IO server set up. */
//Create a socket.io instance using our express server
var sio = io.listen(server);

// sio.configure(function (){
//     sio.set('log level', 0);
//
//     sio.set('authorization', function (handshakeData, callback) {
//         callback(null, true); // error first callback style
//     });
// });

//Enter the game server code. The game server handles
//client connections looking for a game, creating games,
//leaving games, joining games and ending games when they leave.
game_server = require('./src/server/game.server.js');

sio.sockets.on('connection', function (client) {
    client.userid = UUID();

    //tell the player they connected, giving them their id
    client.emit('onconnected', { id: client.userid } );
    game_server.findGame(client);
    console.log('\t socket.io:: player ' + client.userid + ' connected');

    client.on('message', function(m) {
        game_server.onMessage(client, m);
    }); //client.on message

    client.on('disconnect', function () {
        console.log('\t socket.io:: client disconnected ' + client.userid + ' ' + client.game_id);

        if(client.game && client.game.id) {
            game_server.endGame(client.game.id, client.userid);
        } //client.game_id
    }); //client.on disconnect
}); //sio.sockets.on connection
