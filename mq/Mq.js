/*globals require, module */
var amqp = require('amqp');
var rsvp = require('rsvp');
var consts = require('./MqConstants');

module.exports = (function () {
    'use strict';
    var Mq = function (config) {
        this.operationTimeout = 1000;
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
        return new rsvp.Promise(function (resolve, reject) {
            var resolved = false;

            setTimeout(function() {
                if (!resolved) {
                    reject(new Error('Mq: Unable to access exchange'));
                }
            }, self.operationTimeout);

            connection.exchange(exchangeName, {
                type: 'topic',
                durable: true,
                autoDelete: false,
                confirm: true
            }, function (exchange) {
                resolved = true;
                resolve(exchange);
            });
        });
    }

    Mq.prototype.send = function (routingKey, exchangeName, message) {
        var self = this;
        return new rsvp.Promise(function(resolve, reject){
            getConnection(self)
                .then(function(connection) {
                    return getExchage(self, connection, exchangeName);
                })
                .then(function(exchange) {
                    console.info('Mq: Sending to \"' + exchangeName + '\" with key \"' + routingKey + '\" : ' + JSON.stringify(message));

                    exchange.publish(routingKey, message, { deliveryMode: 2 }, function (sendError) {
                        if (sendError) {
                            reject(sendError);
                        } else {
                            resolve();
                        }
                    });
                })
                .catch(function(error){
                    console.error('Mq: Failed to send message: ' + error.toString());
                    reject(error);
                });
        });
    };

    Mq.prototype.close = function () {
        try {
            if (this.connection != null) {
                this.connection.disconnect();
            }
        } catch (error) {
            console.error('Mq: failed to disconnect Mq: ' + error.toString());
        }

        this.connection = null;
    };

    return Mq;
}());