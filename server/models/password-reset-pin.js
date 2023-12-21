'use strict';
var moment = require('moment');
var path = require('path');
var loopback = require('loopback');

module.exports = function(PasswordResetPin) {
  /**
   *
   * @param {obj} email An object that only contains user's email
   * @param {*} callback
   */
  PasswordResetPin.createAndSend = function(emailObj, callback) {
    var email = emailObj.email;
    var pin = '';
    var pinObj = {};

    var sendEmail = () => {
      // Genera una cadena con 4 digitos aleatorios
      for (let i = 0; i < 4; i++) {
        let char = Math.floor(Math.random() * 10);
        pin += char;
      }

      pinObj.pin = pin;
      pinObj.email = email;
      pinObj.expDate = moment(new Date()).add(2, 'days').toString();

      // Se crea una instancia del PIN para la base de datos y se le envia un email al usuario
      PasswordResetPin.create(pinObj, function(err, newPinModel) {
        if (err) throw err;
        var msg = {};
        msg.pin = pinObj.pin;
        msg.expDate = pinObj.expDate;

        var renderer = loopback.template(path.resolve(__dirname, '../emails/user-reset-pin.ejs'));
        var html_body = renderer(msg);

        PasswordResetPin.app.models.adminMail.CheckDomainAvailability(pinObj.email.split('@')[1], (err, domainValid) => {
          if (err) return callback(err);
          if (domainValid) {
            PasswordResetPin.app.models.adminMail.send({
              to: pinObj.email,
              from: 'testmail@jarabesoft.com',
              subject: 'Confirmacion de reinicio de contraseña',
              html: html_body,
            }, function(err, res) {
              if (err) return callback(err);

              return callback(null, {msg: 'success'});
            });
          } else {
            return callback('Dominio no valido');
          }
        });
      });
    };

    PasswordResetPin.app.models.Usuario.find({
      where: {
        email: emailObj.email,
      },
    }, function(err, resp) {
      if (resp.length == 0)
        return callback(null, {msg: 'notRegistered'});
      else
        sendEmail();
    });
  };

  PasswordResetPin.consume = function(pinToTry, callback) {
    // Se buscan el pin en la DB
    PasswordResetPin.find({
      where: {
        and: [
          {pin: pinToTry.pin},
          {email: pinToTry.email},
        ],
      },
    }, function(err, userPins) {
      if (err) return callback(err);
      // Si encontro algun PIN
      if (userPins.length > 0) {
        // Compara coincidencia
        if (pinToTry.pin == userPins[0].pin) {
          // Y si aun no expira el PIN
          if (new Date(userPins[0].expDate) > new Date()) {
            callback(null, {msg: 'Pin correcto'});
          } else {
            callback(null, {msg: 'Pin expirado'});
          }
        }
      } else {
        callback(null, {msg: 'Pin incorrecto'});
      }
    });
  };

  PasswordResetPin.resetPassword = function(credentials, callback) {
    var Usuario = PasswordResetPin.app.models.Usuario;
    // Busca al usuario correspondiente
    Usuario.findOne({where: {email: credentials.email}}, function(err, actualUser) {
      if (err) return callback(err);
      actualUser.password = credentials.password;
      actualUser.emailVerified = true;

      // Se actualiza este usuario con la nueva contraseña
      Usuario.upsert(actualUser, function(err, updatedUser) {
        if (err) return callback(err);

        callback(null, {msg: 'usuario actualizado', usr: updatedUser});
      });
    });
  };
};
