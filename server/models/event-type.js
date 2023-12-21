'use strict';

module.exports = function(EventType) {

    EventType.CreateOne = function(eventType, callback) {
        EventType.findOne({
            where: {name: eventType.name}
        }, (err, eventTypeFound) => {
            if(err) return callback(err);

            if(!!eventTypeFound) return callback(null, eventTypeFound);
            
            EventType.create(eventType, (err, newEventType) => {
                if(err) return callback(err);

                return callback(null, newEventType);
            });
        });
    }

    EventType.GetAll = function(callback) {
        EventType.find({}, (err, types) => {
            if(err) return callback(err);

            return callback(null, types);
        });
    }

};
