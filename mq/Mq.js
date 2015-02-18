/*globals require, module */
var amqp = require('amqp');
var consts = require('./MqConstants');

module.exports = (function () {
    'use strict';
    var Mq = function (config) {
        var self = this;
        this.connection = amqp.createConnection(config, {
            reconnect: false
            /*
            reconnect: true,
            reconnectBackoffStrategy: 'linear',
            reconnectExponentialLimit: 120000,
            reconnectBackoffTime: 1000
             */
        });
        this.status = 'disconnected';

        this.connection.on('connect', function () {
            self.status = consts.Status.Connected;
            console.info('mq.js: connection: connect');
        });
        this.connection.on('close', function () {
            self.status = consts.Status.Disconnected;
            console.warn('mq.js: connection: close');
        });
        this.connection.on('error', function (error) {
            console.error('mq.js: connection: error: ' + error.toString());
        });
        this.connection.on('ready', function () {
            self.status = consts.Status.Ready;
            console.info('mq.js: connection: ready');
        });
    };

    function getExchage(self, exchangeName) {
        return self.connection.exchange(exchangeName, {
            type: 'topic',
            durable: true,
            autoDelete: false,
            confirm: true
        });
    }

    Mq.prototype.send = function (routingKey, exchangeName, message, callback) {
        var exchange = getExchage(this, exchangeName);
        exchange.on('open', function () {
            console.info('mq.js: Sending to \"' + exchangeName + '\" with key \"' + routingKey + '\" : ' + JSON.stringify(message));

            exchange.publish(routingKey, message, { deliveryMode: 2 }, callback);
        });
    };

    Mq.prototype.close = function () {
        if (this.connection != null) {
            this.connection.disconnect();
        }

        this.connection = null;
    };

    return Mq;
}());