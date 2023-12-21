'use strict';

module.exports = function(TeacherSubject) {

    TeacherSubject.UpdateTeacherSubjects = function(teacherId, teacherSubjects, callback) {
        if(!teacherId || !teacherSubjects) return callback(null, []);
        let where = {
            teacherId,
            subjectId: {
                nin: teacherSubjects.map(teacherSubject => teacherSubject.id).filter(id => id)
            }
        };
        TeacherSubject.destroyAll(where, (err, destroyed) => {
            if(err) return callback(err);

            let cont = 0, limit = teacherSubjects.length;
            if(!limit) return callback(null, teacherSubjects);
            teacherSubjects.forEach(subject => {
                const teacherSubjectInstance = {
                    teacherId,
                    subjectId: subject.id
                }
                
                TeacherSubject.findOrCreate({
                    where: {
                        teacherId,
                        subjectId: subject.id
                    }
                }, teacherSubjectInstance, (err, newTeacherSubject) => {
                    if(err) return callback(err);

                    if(++cont == limit) return callback(null, teacherSubjects);
                });
            });
        });
    }

};
