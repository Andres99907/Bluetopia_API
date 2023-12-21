'use strict';

module.exports = function(GradeSubject) {

    GradeSubject.UpdateGradeTeacherSubjects = function(teacherId, gradeId, gradeSubjects, callback) {
        if(!teacherId || !gradeId || !gradeSubjects) return callback(null, []);
        let where = {
            teacherId,
            gradeId,
            id: {
                nin: gradeSubjects.filter(gradeSubject => !!gradeSubject.subjectId).map(gradeSubject => gradeSubject.id).filter(id => !!id)
            }
        };

        GradeSubject.destroyAll(where, (err, destroyed) => {
            if(err) return callback(null, err);

            let groupsToAdd = gradeSubjects.filter(gradeSubject => !gradeSubject.id || !gradeSubject.subjectId);
            let cont = 0, limit = groupsToAdd.length;

            if(!limit) return callback(null, gradeSubjects);
            groupsToAdd.forEach(gradeSubject => {
                const subjectInstance = {
                    gradeId,
                    teacherId,
                    subjectId: !!gradeSubject.subjectId ? gradeSubject.subjectId : gradeSubject.id,
                }

                GradeSubject.findOrCreate({
                    where: {
                        gradeId,
                        teacherId,
                        subjectId: !!gradeSubject.subjectId ? gradeSubject.subjectId : gradeSubject.id,
                    }
                }, subjectInstance, (err, newGradeSubject) => {
                    if(err) return callback(err);

                    if(++cont == limit) return callback(null, gradeSubjects);
                });
            });
        });
    }

};
