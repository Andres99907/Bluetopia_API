'use strict';

module.exports = function(UserData) {

    UserData.Update = function(data, callback) {
        if(!data) return callback(null, {});

        UserData.upsert(data, (err, userData) => {
            if(err) return callback(err);

            return callback(null, userData);
        });
    }

};
