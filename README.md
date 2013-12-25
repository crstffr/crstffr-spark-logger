Spark Logger
=====

Node.js TCPServer for communicating with Spark Core.

Copy config.dist.js to config.js and supply your own credentials.

Copy contents of firmware.cpp onto your Spark Core and flash it.

Public folder can be placed on an *AMP stack server to provide a public viewable log.
In order to use this feature, you must have a valid Firebase path set in the config.

Install dependencies, run

    node install

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
