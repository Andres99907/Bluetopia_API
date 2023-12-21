'use strict';

module.exports = function(ParcialProductType) {

    ParcialProductType.CreateOne = function(parcialProductType, callback) {
        ParcialProductType.findOne({
            where: {name: parcialProductType.name}
        }, (err, parcialProductTypeFound) => {
            if(err) return callback(err);

            if(!!parcialProductTypeFound) return callback(null, parcialProductTypeFound);
            
            ParcialProductType.create(parcialProductType, (err, newParcialProductType) => {
                if(err) return callback(err);

                return callback(null, newParcialProductType);
            });
        });
    }

    ParcialProductType.GetOrCreateOne = function(parcialProductTypeId, parcialProductType, callback) {
        ParcialProductType.findOrCreate({
            where: {id: parcialProductTypeId}
        }, parcialProductType, (err, parcialProductType) => {
            if(err) return callback(err);

            return callback(null, parcialProductType);
        });
    }
    
    ParcialProductType.GetAll = function(ctx, callback) {
        const userId = ctx.accessToken.userId;
        ParcialProductType.find({
            where: {
                or: [{userId: null}, {userId: userId}]
            },
            order: 'name ASC'
        }, (err, parcialProductTypes) => {
            if(err) return callback(err);

            return callback(null, parcialProductTypes);
        });
    }

};
