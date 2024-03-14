'use strict';

module.exports = function(School) {

    School.CreateOne = function(school, callback) {
        if (!school) return callback(null, {});
        School.findOrCreate({
            where: {
                name: {
                    regexp: `${school.name}`,
                    options: 'i'
                }
            }
        }, school, (err, newSchool) => {
 
            let Entry1 = {entry:"Insuficiente", entryDescription: "El alumno no cumplió con el rubro.", entryLevel: 1,schoolId: newSchool.id};
            let Entry2 = {entry:"Suficiente", entryDescription: "El alumno cumplió con el rubro al mínimo.", entryLevel: 2, schoolId: newSchool.id};
            let Entry3 = {entry:"Bueno", entryDescription: "El alumno cumplió con el rubro casi en su totalidad.", entryLevel: 3, schoolId: newSchool.id};
            let Entry4 = {entry:"Excelente", entryDescription: "El alumno cumplió con el rubro en su totalidad.", entryLevel: 4, schoolId: newSchool.id};
            School.app.models.Entry.CreateOneWithoutRepeat(Entry1);
            School.app.models.Entry.CreateOneWithoutRepeat(Entry2);
            School.app.models.Entry.CreateOneWithoutRepeat(Entry3);
            School.app.models.Entry.CreateOneWithoutRepeat(Entry4);
            if (err) return callback(err);

            return callback(null, newSchool);
        });
    }

    School.Update = function(school, callback) {
        if (!school) return callback(null, {});

        School.upsert(school, (err, school) => {
            if (err) return callback(err);

            return callback(null, school);
        });
    }

    School.prototype.UpdateData = function(school, callback) {
        if (!school) return callback(null, false);
        School.upsert(school.school, (err, schoolupdated) => {
            if (err) return callback(err);
            School.app.models.UserData.Update(school.data, (err, updated) => {
                if (err) return callback(err);
                School.app.models.Usuario.findOne({ where: { id: school.data.userId } }, (err, user) => {
                    if (err) return callback(err);
                    user.__data.username = school.name;
                    // user.__data.email = school.email;
                    user.save(user, (err, updated) => {
                        if (err) return callback(err);
                        return callback(null, school);
                    });
                });
            });
        });
    }

    School.EnableRubrics = function(schoolId, tf, callback) {     
        // Buscar por su id
        School.findById(schoolId, (err, foundSchool) => {
            if (err) {
                return callback(err);
            }
            
            // Verificar si la asignatura existe
            if (!foundSchool) {
                return callback('SCHOOL_NOT_FOUND');
            }
            
            // Actualizar el campo active a false
            foundSchool.updateAttributes({ rubricEvaluations: tf }, (err) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, 'SCHOOL_UPDATED_SUCCESSFULLY');
            });
        });
    };

};
