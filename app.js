var Mq = require('./mq/Mq');
var async = require('async');

// required to keep the process alive
require('http').createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
}).listen(1337, '127.0.0.1');

var mq = new Mq({
    "host" : "cc-msgq-dev.sip.blogtalkradio.com",
    "port" : 5673,
    "login" : "guest",
    "password" : "guest",
    "ssl" : {
        "enabled" : false
    },
    "heartbeat" : 20
});


var indexes = Array.apply(null, { length: 100 }).map(Number.call, Number);

async.eachSeries(indexes, function (index, done) {
    mq.send('test-key', 'com.cinchcast.telephony.mq.exchange', { message: 'node test ' + index })
        .then(function () {
            done();
        })
        .catch(function(sendError) {
            console.error('app: failed to send message: ' + sendError.toString());
            done();
        })
}, function (eachSeriesError) {
    if (eachSeriesError) {
        console.error('done with errors: ' + eachSeriesError.toString());
    } else {
        console.info('done without errors');
    }

    mq.close();
});


