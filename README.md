Example Spark Logger
=====

Spark firmware example of using TCPClient + Node.js TCPServer for communicating with Spark Core.  

Maintains a persistent connection using KeepAlive bits and automatically reopening closed sockets.  

Server will echo out statements to the console sent from the Spark Core, replacing the need to be connected to a PC serial monitor.  **Note:** TCP messages are not nearly as fast as serial, don't try to log from inside the main loop().

## Instructions

Copy config.dist.js to config.js and supply your own credentials.

Copy contents of firmware.cpp onto your Spark Core and flash it.

Install dependencies, run

    npm install

Make sure Spark Core is breathing cyan, then run

    node server.js

If everything is setup correctly, you should see something like

    SERVER Listening on 192.168.0.148:5000
    SERVER Connection from 192.168.0.88:1937

Every 10 seconds a KeepAlive bit is sent back and forth

    CORE   ENQ
    SERVER ACK

Connecting pin D6 to 3.3v (button switch) will result in

    CORE   BTN1PRESSED
    SERVER Handle a BTN1 Press


## Web Logging

The ./public folder can be placed on an AMP stack server to provide a publicly viewable log. In order to use this feature, you must have a valid Firebase path set in the config.  There are two places in server.js that you will need to uncomment, just search for "Firebase".  **Note:** using Firebase for web logging does add a bit of latency to the logger calls.
