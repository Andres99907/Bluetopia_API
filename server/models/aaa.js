'use strict';

module.exports = function(Aaa) {

   
    Aaa.Heartbeat = function() {
        console.log('HEARTBEAT NOTIFICATION');
        cb(null, 'DEFAULT_HEARTBEAT');
      };

};
