'use strict';
var loopback = require('loopback');
var path = require('path');

const EMAIL_FROM = `testmail@jarabesoft.com`;

module.exports = function (Mail) {

    Mail.SenMail = function (emailTemplateToUse, emailData, callback) {
        if(!emailData.emailTo) return callback('not email destination');
        var renderer = loopback.template(path.resolve(__dirname, `../emails/${emailTemplateToUse}`));
        var html_body = renderer(emailData);

        Mail.app.models.adminMail.send({
            to: emailData.emailTo,
            from: EMAIL_FROM,
            subject: emailData.subject ? emailData.subject : '',
            html: html_body,
        }, function (err, res) {
            if (err) console.error("Error sending email", err);

            return callback(null, `mail sent to: ${emailData.emailTo}`);
        });
    }

};
