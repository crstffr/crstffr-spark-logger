var os = require('os');
var net = require('net');
var moment = require('moment');
var sparky = require('sparky');
var firebase = require('firebase');
var config = require('./config.js');
var spotimote = require('./spotimote.js');
var logs = new firebase('https://spark-logger.firebaseio.com/logs/');

var THIS_IS_THE_END = false;
var IP = getIP();
var PORT = 5000;

var core = new sparky({
    deviceId: config.cores[0],
    token: config.token,
    debug: false
})

var spotify = new spotimote({
    server: '192.168.0.114',
    debug: true
});





function triggerConnection() {
    if (THIS_IS_THE_END) { return; }
    core.run('connect', IP);
}

function triggerDisconnect() {
    core.run('disconnect');
}

log("Listening: " + IP + ":" + PORT);
triggerConnection();

var server = net.createServer(function (socket) {

    var STX = "\x02";
    var ETX = "\x03";
    var EOT = "\x04";
    var ENQ = "\x05";
    var ACK = "\x06";
    var SYN = "\x16";
    var buffer = '';

    log("Connection created: " + socket.remoteAddress + ":" + socket.remotePort);

    socket.setEncoding('utf8');

    socket.on('error', function (e) {
        log("Connection error: ");
        log(e);
        triggerConnection();
    });

    socket.on('close', function (had_error) {
        log("Connection closed (error: " + had_error + ")");
        triggerConnection();
    });

    socket.on('data', function(data) {

        var first = data[0];
        var last  = data[data.length-1];

        if (first === ENQ) {
            console.log(".");
            socket.write(ACK);
            return;
        }

        if (first === STX) {
            buffer = '';
        }

        buffer += data;

        if (last === EOT) {
            parse(buffer.replace(STX ,'').replace(EOT ,''));
            buffer = '';
        }

    });

    function parse(str) {

        var data = {};
        var parts = str.split(ETX);

        if (parts.length === 1) {
            data = {
                who: 'unidentified',
                what: str
            }
        } else {
            data = {
                who: parts[0],
                what: parts[1]
            }
        }

        send(data);

        switch(data.what) {
            case 'BTN1':
                spotify.playPause();
                break;
        }

    }

    function send(data) {
        data.when = moment().unix();
        //logs.push(data).setPriority(data.when);
        log(data.what);
    }

}).listen(PORT);

/*
// this just hangs on ctrl+c
process.on('SIGINT', function () {
    THIS_IS_THE_END = true;
    console.log("QUIT");
    triggerDisconnect();
});
*/





function log(message) {
    console.log(moment().format('hh:mm:ssA') + " - ", message);
}

function getIP() {
    var ip = null;
    var ifs = os.networkInterfaces();
    for (var ifName in ifs) {
        if (!ip) {
            ifs[ifName].forEach(function (iface) {
                if (!ip && !iface.internal && 'IPv4' === iface.family) {
                    ip = iface.address;
                }
            });
        }
    }
    return ip;
}


