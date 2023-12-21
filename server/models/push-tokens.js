'use strict';

const request = require('request');
const oneSignalURL = 'https://onesignal.com/api/v1/notifications';
const app_id = '540412ae-b99e-4c4c-843f-f05dabbb6a25';
const mobileKey = 'Basic NTYzMWM4MzktODNmMi00M2EyLWIzN2YtNzc2MTdhMzI0Nzdk';

// var desktopKey = "key=AIzaSyB14fCDhNGsNrExghdGRZYZLWrnAHdWI-M"

module.exports = function(PushTokens) {
  PushTokens.sendMobilePushNotification = function(pushTokens, notification, callback) {
    if (!pushTokens || pushTokens.length <= 0) {
      return callback(null, 'No tokens');
    }

    let headers = {
      'Content-Type': 'application/json',
      'Authorization': mobileKey,
    };

    let notificationBody = {
      app_id: app_id,
      data: notification.data,
      contents: {en: notification.content, es: notification.content},
      headings: {en: notification.heading, es: notification.heading},
      include_player_ids: [],
      // "image": "https://scontent.fgdl4-1.fna.fbcdn.net/v/t1.0-9/50728512_2110076052393262_3123088630382329856_o.png?_nc_cat=103&_nc_ht=scontent.fgdl4-1.fna&oh=045b806a600cd3dc959b54ae1e739d73&oe=5D2B7633"
    };
    pushTokens.forEach(token => {
      notificationBody.include_player_ids.push(token.id);
    });

    request.post(oneSignalURL, {
      body: JSON.stringify(notificationBody),
      headers: headers,
    }, function(err, response, body) {
      if (err) return callback(err);
      return callback(null, true);
    });
  };
};
