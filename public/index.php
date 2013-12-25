<?php

require("php/Toro.php");
require("php/Firebase.php");

define('FIREBASE_URL', 'https://spark-logger.firebaseio.com/');

Toro::serve(array(
    "/" => "ListHandler",
    "/log/:alpha" => "LogHandler"
));

class ListHandler {
    function get() {
        include("views/index.html");
    }
}

class LogHandler {

    function get($who) {
        $this->send($who);
    }

    function post($who) {
        $this->send($who);
    }

    function send($who) {
        if (isset($_REQUEST['what'])) {
            $what = trim($_REQUEST['what']);
        } else {
            $what = "nothing";
        }
        $firebase = new Firebase(FIREBASE_URL);
        $firebase->push('logs', array(
            'who' => $who,
            'what' => $what,
            'when' => time(),
            '.priority' => time()
        ));
        echo "OK";
    }

}

