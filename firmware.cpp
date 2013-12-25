int btn1 = D6;
int btn1Val = LOW;
bool btn1Down = false;

// ******************************
// Core Setup
// ******************************

void setup()
{
    Serial.begin(9600);
    pinMode(btn1, INPUT_PULLDOWN);
    Spark.function("connect", tcpConnect);
    Spark.function("disconnect", tcpDisconnect);
}

// ******************************
// Main Loop
// ******************************

void loop()
{

    btn1Val = digitalRead(btn1);

    if (!btn1Down && btn1Val == HIGH) {
        btn1Down = true;
        tcpLog("BTN1PRESSED");
    } else if (btn1Val == LOW) {
        btn1Down = false;
    }

    // If you want to try KeepAlive
    tcpKeepAlive();
}

// ******************************
// TCP Connection & Communication
// ******************************

TCPClient tcp;

int  tcpPort = 5000;

char STX = '\x02';
char ETX = '\x03';
char EOT = '\x04';
char ENQ = '\x05';
char ACK = '\x06';

unsigned long kaReset = 10; // secs between keep alive
unsigned long kaTimer = 0;
unsigned long kaWait  = 0;
bool kaWaiting = false;

int tcpConnect(String ip) {
    byte address[4];
    ipArrayFromString(address, ip);
    if (tcp.connect(address, tcpPort)) {
        tcpKeepAliveReset();
        return 1;
    } else {
        return -1;
    }
}

int tcpDisconnect(String param) {
    tcp.flush();
    tcp.stop();
    return 1;
}

int tcpLog(String message) {
    if (tcp.connected()) {
        tcp.print(STX + Spark.deviceID() + ETX + message + EOT);
        delay(250); // try not to flood socket with too many writes
        return 1;
    } else {
        return -1;
    }
}

// ******************************
// TCP Keep Alive
// ******************************

void tcpKeepAlive() {
    unsigned long now = millis();
    if (tcp.connected()) {
        if (now > kaTimer) {
            tcp.flush();
            tcpLog("ENQ"); // For logger view 
            tcp.print(ENQ); // Heartbeat signal
            kaWait = now + 500;
            kaWaiting = true;
            tcpKeepAliveReset();
        }
        if (kaWaiting && (kaWait > now)) {
            if (tcp.available()) {
                char read = tcp.read();
                if (read == ACK) {
                    // tcpLog("ACK");
                    kaWaiting = false;
                }
            }
        } else if (kaWaiting && kaWait < now) {
            tcpLog("Timed out");
            kaWaiting = false;
            tcp.flush();
            tcp.stop();
        }
    }
}

void tcpKeepAliveReset() {
    kaTimer = millis() + (kaReset * 1000);
}

// ******************************
// Utility Methods
// ******************************

void ipArrayFromString(byte ipArray[], String ipString) {
  int dot1   = ipString.indexOf('.');
  ipArray[0] = ipString.substring(0, dot1).toInt();
  int dot2   = ipString.indexOf('.', dot1 + 1);
  ipArray[1] = ipString.substring(dot1 + 1, dot2).toInt();
  dot1       = ipString.indexOf('.', dot2 + 1);
  ipArray[2] = ipString.substring(dot2 + 1, dot1).toInt();
  ipArray[3] = ipString.substring(dot1 + 1).toInt();
}
