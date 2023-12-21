'use strict';

module.exports = function(Subject) {

    Subject.CreateOneWithoutRepeat = function(subject, callback) {
        Subject.GetLast((err,lastSubject)=>{
            if(err) return callback(err);
            if(!subject.id) subject.id = lastSubject.id + 1;
            let filter= {
                where: {}
            };
            if(subject.id) filter.where['id'] = subject.id;
            else filter.where['name'] = subject.name;
            Subject.findOrCreate(filter, subject, (err,instance)=>{
                if(err) return callback(err);
                return callback(null,instance);
            });
        });
    }
    Subject.GetLast = function (cb) {
        Subject.findOne({order:'id DESC'},(err,last)=>{
            if(err) return cb(err);
            return cb(null,last);
        });
    }

    Subject.GetAll = function(callback) {
        Subject.find((err, subjects) => {
            if(err) return callback(err);

            return callback(null, subjects);
        });
    }

};
