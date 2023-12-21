'use strict';
var pubsub = require('../helpers/pubsub.js');
var hostURL = require('../helpers/constants').hostURL;

module.exports = function(Notification) {
  Notification.setSeen = function(ctx, id, callback) {
    Notification.upsert({id, seen: new Date()}, (err, res) => {
      if (err) return callback(err, 'Error al marcar como visto');
      return callback(null, res);
    });
  };

  Notification.setCero = function(num) {
    return num < 10 ? '0' + num : num;
  };

  Notification.getById = function(ctx, limit, lastId, callback) {
    var user_id = ctx.accessToken.userId;
    let filter = {
      limit: limit,
      order: 'id DESC',
      where: {
        usuarioId: user_id,
      },
    };
    if (lastId) {
      filter.where.id = {
        lt: lastId,
      };
    }
    Notification.find(filter, function(err, notifications) {
      if (err) return callback(err);

      return callback(null, notifications);
    });
  };

  Notification.setSingleNotification = function(userId, notification, callback) {
    let Usuario = Notification.app.models.Usuario;
    let PushTokens = Notification.app.models.PushTokens;

    notification.usuarioId = userId;
    // notification.link = hostURL + notification.link;

    Notification.create(notification, function(err, notification) {
      if (err) return callback(err);
      var socket = Notification.app.io;
      pubsub.publish(socket, {
        model: 'notifications',
        id: id,
        data: notification,
        method: 'getNew',
      });
      let filter = {
        where: {id: userId},
        fields: {id: true},
        include: 'pushTokens',
      };
      Usuario.findOne(filter, (err, user) => {
        if (err) return callback(err);
        user = JSON.parse(JSON.stringify(user));
        PushTokens.sendMobilePushNotification(user.pushTokens, notification, function(err, res) {
          if (err) return callback(err);
        });
      });
    });
  };

  Notification.setSomeNotification = function(ids = [], notification) {
    var user = Notification.app.models.Usuario;
    user.find({where: {id: {inq: ids}}, include: 'pushTokens'}, function(err, users) {
      if (err) return err;
      var DBpushTokens = [];
      users.forEach(u => {
        Notification.setSingleNotification(u.id, notification);
        DBpushTokens = DBpushTokens.concat(u.toJSON().pushTokens);
      });
      var PushTokens = Notification.app.models.PushTokens;
      PushTokens.sendPushNotification(DBpushTokens, notification, function(err, res) {
        if (err) return err;
      });
      return users;
    });
  };

  Notification.setByRoleNotification = function(Role, notification) {
    var Usuario = Notification.app.models.Usuario;

    Usuario.findByRole(Role, ['pushTokens'], function(err, users) {
      if (err) return err;

      users.forEach(user => {
        Notification.setSingleNotification(user.id, notification);
      });

      return users;
    });
  };
};
