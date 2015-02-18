var Mq = require('./mq/Mq');
var u = require('underscore');
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

mq.connection.on('ready', function() {
    var indexes = Array.apply(null, { length: 50 }).map(Number.call, Number);

    async.eachSeries(indexes, function (index, done) {
        mq.send('test-key', 'com.cinchcast.telephony.mq.exchange', { message: 'node test ' + index }, function (mqSendError) {
            if (mqSendError) {
                console.error('error sending mq msg: ' + mqSendError.toString());
            }

            done();
        });
    }, function (eachSeriesError) {
        if (eachSeriesError) {
            console.error('done with errors: ' + eachSeriesError.toString());
        } else {
            console.info('done without errors');
        }
    });
});

