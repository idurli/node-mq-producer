/*globals require, module */
var amqp = require('amqp');
var rsvp = require('rsvp');
var consts = require('./MqConstants');

module.exports = (function () {
    'use strict';
    var Mq = function (config) {
        this.config = config;
        this.status = consts.Status.Disconnected;
        this.connection = null;
    };

    function getConnection(self) {
        return new rsvp.Promise(function (resolve, reject) {
            if (self.connection) {
                resolve(self.connection);
            } else {
                var connection = amqp.createConnection(self.config, {
                    reconnect: false
                });

                connection.on('connect', function () {
                    self.status = consts.Status.Connected;
                    console.info('Mq: connection: connect');
                });

                connection.on('close', function () {
                    self.status = consts.Status.Disconnected;
                    console.warn('Mq: connection: close');
                });

                connection.on('error', function (error) {
                    console.error('Mq: connection: error: ' + error.toString());
                    reject(error);
                });

                connection.on('ready', function () {
                    self.connection = connection;
                    self.status = consts.Status.Ready;
                    console.info('Mq: connection: ready');
                    resolve(self.connection);
                });
            }
        });
    }

    function getExchage(self, connection, exchangeName) {
        return connection.exchange(exchangeName, {
            type: 'topic',
            durable: true,
            autoDelete: false,
            confirm: true
        });
    }

    Mq.prototype.send = function (routingKey, exchangeName, message, callback) {
        var self = this;
        getConnection(this)
            .then(function(connection) {
                var exchange = getExchage(self, connection, exchangeName);
                exchange.on('open', function () {
                    console.info('Mq: Sending to \"' + exchangeName + '\" with key \"' + routingKey + '\" : ' + JSON.stringify(message));

                    exchange.publish(routingKey, message, { deliveryMode: 2 }, callback);
                });
            })
            .catch(function(connectionError){
                console.error('Failed to create MQ connection');
                //TODO: should this reject instead?
                callback(new Error('Failed to create MQ connection: ' + connectionError.toString()));
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