'use strict';

module.exports = function(StrategyStatus) {

    StrategyStatus.CreateOne = function(status, callback) {
        StrategyStatus.findOrCreate({
            where: {name: {like: `%${status.name}%`}}
        }, status, (err, newStatus) => {
            if(err) return callback(err);
            
            if(status.name !== newStatus.name) {
                newStatus.name = status.name;
                newStatus.save((err, saved) => {
                    if(err) return callback(err);

                    return callback(null, saved);
                });
            } else return callback(null, newStatus);
        });
    }

    StrategyStatus.GetAll = function(callback) {
        StrategyStatus.find({
            order: 'name ASC'
        }, (err, statuses) => {
            if(err) return callback(err);

            return callback(null, statuses);
        });
    }

};
