'use strict';
var dns = require('dns');
var sys = require('sys');

module.exports = function(Adminmail) {
  Adminmail.CheckDomainAvailability = function(domain, callback) {
    dns.resolve4(domain, (err, validated) => {
      if (err) return callback(null, false);
      return callback(null, true);
    });
  };
};
