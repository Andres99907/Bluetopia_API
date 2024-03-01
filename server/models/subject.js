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

    Subject.GetAllOfSchool = function(schoolId, callback) {
        // Definir el filtro para buscar los objetos Subject con el schoolId proporcionado o con schoolId igual a 0
        var filter = {
            where: {
                or: [
                    { schoolId: schoolId },
                    { schoolId: 0 }
                ]
            }
        };
    
        Subject.find(filter, (err, subjects) => {
            if(err) return callback(err);
    
            return callback(null, subjects);
        });
    };

    Subject.CreateOneWithoutRepeat2 = function(subject, callback) {
        if(subject.schoolId == 0)
        {return cb('CREATE_SUBJECT_FOR_SCHOOL_ID_0_NOT_PERMITED')}
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

    Subject.DeleteOne = function(subjectId, callback) {
        // Verificar que el id de la asignatura no sea 0
        if (subjectId === 0) {
            return callback('CANNOT_DELETE_SUBJECT_WITH_ID_0');
        }
        
        // Buscar la asignatura por su id
        Subject.findById(subjectId, (err, foundSubject) => {
            if (err) {
                return callback(err);
            }
            
            // Verificar si la asignatura existe
            if (!foundSubject) {
                return callback('SUBJECT_NOT_FOUND');
            }
            
            // Borrar la asignatura
            foundSubject.destroy((err) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, 'SUBJECT_DELETED_SUCCESSFULLY');
            });
        });
    };
    
    
};
