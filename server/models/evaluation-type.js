'use strict';

module.exports = function(EvaluationType) {

    EvaluationType.CreateOne = function(evaluationType, callback) {
        EvaluationType.findOrCreate({
            where: {name: {like: `%${evaluationType.name}%`}},
        }, evaluationType, (err, newEvaluationType) => {
            if(err) return callback(err);
            
            return callback(null, newEvaluationType);
        });
    }
    
    EvaluationType.GetAll = function(ctx, callback) {
        const userId = ctx.accessToken.userId;
        EvaluationType.find({
            where: {
                // or: [{userId: null}, {userId: userId}]
            },
            order: 'name ASC'
        }, (err, evaluationTypes) => {
            if(err) return callback(err);

            return callback(null, evaluationTypes);
        });
    }

    EvaluationType.GetIdByTypeName = function(evaluationType,callback) {
        let filter = {
            where:{
                type:{like:evaluationType}
            },
            fields:'id'
        }
        EvaluationType.findOne(filter,(err,evaluationTypeId)=>{
            if(err) return callback(err);
            return callback(null,evaluationTypeId);
        });
    }

};
