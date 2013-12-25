var os = require('os');
var net = require('net');
var moment = require('moment');
var sparky = require('sparky');
var firebase = require('firebase');
var config = require('./config.js');

// I use Firebase to write some log information so that I can
// have a web based log viewer if I need to work collaboratively
// with others, they can see the output on their screens as well.

// Supply your own Firebase data store URI if you use this.
var logs = new firebase('https://spark-logger.firebaseio.com/logs/');

var IP = getIP();
var PORT = 5000;
var core = new sparky({
    deviceId: config.core,
    token: config.token,
    debug: false
});

// Show what IP address and Port our
// server is currently listening on.
log('Listening on ' + IP + ':' + PORT);

// Tell the Core to connect right away.
connect();

var server = net.createServer(function (socket) {

    // Here you will see the local IP and Port number the Core
    // uses to connect to your TCPServer.  The port changes
    // every time the socket closes and reconnects.

    log('Connection from ' + socket.remoteAddress + ':' + socket.remotePort);

    // Set encoding so we get text strings back
    // instead of binary buffer data.

    socket.setEncoding('utf8');

    // These are control codes that I use for
    // various parts of the communication.

    var STX = '\x02';
    var ETX = '\x03';
    var EOT = '\x04';
    var ENQ = '\x05';
    var ACK = '\x06';
    var SYN = '\x16';

    // When the socket connection naturally closes, after
    // about 60 seconds or so, go ahead and trigger the
    // Core to reconnect.  This keeps the TCP session
    // alive much better than actual KeepAlive bits.

    socket.on('close', function (had_error) {
        log('Connection closed (error: ' + had_error + ')');
        connect();
    });

    socket.on('error', function (e) {
        log('Connection error');
        log(e);
    });

    // Use buffer to hold incoming data until the entire
    // message is received.  Messages start with STX and
    // end with EOT.  The Device ID is separated from
    // the rest of the message with an ETX.

    var buffer = '';

    socket.on('data', function(data) {

        var first = data[0];
        var last  = data[data.length-1];

        // KeepAlive bit, respond with ACK
        // and return out to avoid parsing.
        if (first === ENQ) {
            log('ACK');
            socket.write(ACK);
            buffer = '';
            return;
        }

        // New message, reset buffer.
        if (first === STX) {
            buffer = '';
        }

        // Append data to our buffer.
        buffer += data;

        // Strip out our control codes and parse
        // the message if this is the end.
        if (last === EOT) {
            parse(buffer.replace(STX ,'').replace(EOT ,''));
        }

    });

    /**
     * Split the incoming data into usable pieces, the
     * WHO (deviceID) and the WHAT of the message.
     * @param str
     */
    function parse(str) {
        var data;
        var parts = str.split(ETX);

        if (parts.length === 1) {
            data = {
                what: str,
                who: 'unidentified',
                when: moment().unix()
            }
        } else {
            data = {
                who: parts[0],
                what: parts[1],
                when: moment().unix()
            }
        }

        // Send the information to Firebase
        logs.push(data).setPriority(data.when);

        // Send the information to Node console
        logCore(data.what);

        // Now handle the messages independently
        switch(data.what) {
            case 'BTN1PRESSED':
                log('Handle a BTN1 Press');
                break;
        }

    }

}).listen(PORT);

/**
 * Issue Cloud command to connect the core to the TCPServer.
 */
function connect() {
    core.run('connect', IP);
}

/**
 * Issue Cloud command to disconnect core from TCPServer.
 */
function disconnect() {
    core.run('disconnect');
}

/**
 * Utility to print messages to console with time stamp.
 * @param message
 */
function log(msg) {
    console.log(moment().format('hh:mm:ssA') + ' - SERVER', msg);
};

function logCore(msg) {
    console.log(moment().format('hh:mm:ssA') + ' - CORE  ', msg);
}

/**
 * Returns the IP address of the current server.
 * @return {*}
 */
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