var Mq = require('./mq/Mq');
var async = require('async');

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


var indexes = Array.apply(null, { length: 10 }).map(Number.call, Number);

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


