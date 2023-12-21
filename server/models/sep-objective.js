'use strict';

module.exports = function(SepObjective) {

    SepObjective.CreateOne = function(sepObjective, callback) {
        let filter = {
            where: {
                name: sepObjective.name
            }
        }

        SepObjective.findOrCreate(filter, sepObjective, (err,instance,wasCreated)=>{
            if(err) return callback(err);
            return callback(null,instance);
        });
    }

    SepObjective.GetAll = function(callback) {
        SepObjective.find((err, sepObjectives) => {
            if(err) return callback(err);

            return callback(null, sepObjectives);
        });
    }

};
