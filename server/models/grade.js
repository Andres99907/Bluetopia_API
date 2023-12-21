'use strict';

module.exports = function(Grade) {

    Grade.CreateGradeOrGroup = function(body, callback) {
        let grade = {
            name: body.grade
        };
        let group = {
            name: body.group
        };
        Grade.CreateOne(grade, (err, newGrade) => {
            if(err) return callback(err);
            
            Grade.app.models.Group.CreateOne(group, (err, newGroup) => {
                if(err) return callback(err);
                
                if(body.teacherId) {
                    Grade.app.models.TeacherGroup.AddGroupToTeacher(newGrade.id, newGroup.id, body.teacherId, (err, newTeacherGroup) => {
                        if(err) return callback(err);

                        return callback(null, {grade:newGrade, group:newGroup});
                    })
                }
                else return callback(null, {grade:newGrade, group:newGroup});
            });
        });
    }

    Grade.CreateOne = function(grade, callback) {
        if(!grade || !grade.name || !grade.name.length) return callback(null, null);
        grade.name = grade.name.toLowerCase();
        Grade.findOrCreate({
            where: {
                name: grade.name
            }
        }, grade, (err, newGrade) => {
            return callback(err, newGrade);
        });
    }

    Grade.CreateBasedOnCSV = function(students, callback) {
        let grades = [], newGrades = [];
        students.forEach(student => {
            if(!grades.includes(student.grade)) grades.push(student.grade);
        });

        let cont = 0, limit = grades.length;
        if(!limit) return callback(null, newGrades);
        grades.forEach(grade => {
            const newGrade = {
                name: grade
            }

            Grade.CreateOne(newGrade, (err, newGrade) => {
                if(err) return callback(err);

                newGrades.push(newGrade);
                if(++cont == limit) return callback(null, newGrades);
            });
        });
    }

    Grade.GetAll = function(callback) {
        Grade.find({
            order: 'name ASC'
        }, (err, grades) => {
            return callback(err, grades);
        });
    }

    Grade.prototype.UpdateGroups = function(teacherId, teacherGroups, callback) {
        if(!teacherId || !teacherGroups) return callback(null, []);
        let where = {
            teacherId,
            gradeId: this.id,
            id: {
                nin: teacherGroups.map(teacherGroup => teacherGroup.id).filter(id => !!id)
            }
        };
        let TeacherGroup = Grade.app.models.TeacherGroup;
        TeacherGroup.destroyAll(where, (err, destroyed) => {
            if(err) return callback(null, err);

            let groupsToAdd = teacherGroups.filter(teacherGroup => !teacherGroup.id);
            let cont = 0, limit = groupsToAdd.length;

            if(!limit) return callback(null, teacherGroups);
            TeacherGroup.app.models.Grade.CreateBasedOnCSV(groupsToAdd, (err, grades) => {
                if(err) return callback(null, err);

                TeacherGroup.app.models.Group.CreateBasedOnCSV(groupsToAdd, (err, groups) => {
                    if(err) return callback(null, err);

                    
                    groupsToAdd.forEach(teacherGroup => {
                        const gradeId = grades.find(g => g.name == teacherGroup.grade.toLowerCase()) ? grades.find(g => g.name == teacherGroup.grade.toLowerCase()).id : null;
                        const groupId = groups.find(g => g.name == teacherGroup.group.toLowerCase()) ? groups.find(g => g.name == teacherGroup.group.toLowerCase()).id : null;
                        const teacherGroupInstance = {
                            teacherId,
                            gradeId,
                            groupId,
                        }

                        TeacherGroup.findOrCreate({
                            where: {
                                groupId,
                                gradeId,
                                teacherId
                            }
                        }, teacherGroupInstance, (err, newTeacherGroup) => {
                            if(err) return callback(err);

                            if(++cont == limit) return callback(null, teacherGroups);
                        });
                    });
                });
            });
        });
    }

    Grade.GetByName = function(gradeName,cb) {
        let filter= {
            where:{
                name: {like:`${gradeName}`}
            }
        }
        Grade.findOne(filter,(err,grade)=>{
            if(err) return cb(err);
            return cb(null,grade);
        });
    }
};
