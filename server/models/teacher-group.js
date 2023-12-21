'use strict';

module.exports = function(TeacherGroup) {

    TeacherGroup.UpdateTeacherGroups = function(teacherId, teacherGroups, callback) {
        if (!teacherId || !teacherGroups) return callback(null, []);
        let where = {
            teacherId,
            id: {
                nin: teacherGroups.map(teacherGroup => teacherGroup.id).filter(id => id)
            }
        };
        TeacherGroup.destroyAll(where, (err, destroyed) => {
            if (err) return callback(null, err);

            let groupsToAdd = teacherGroups.filter(teacherGroup => !teacherGroup.id);
            let cont = 0,
                limit = groupsToAdd.length;

            if (!limit) return callback(null, teacherGroups);
            TeacherGroup.app.models.Grade.CreateBasedOnCSV(groupsToAdd, (err, grades) => {
                if (err) return callback(null, err);

                TeacherGroup.app.models.Group.CreateBasedOnCSV(groupsToAdd, (err, groups) => {
                    if (err) return callback(null, err);


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
                            if (err) return callback(err);

                            if (++cont == limit) return callback(null, teacherGroups);
                        });
                    });
                });
            });
        });
    }

    TeacherGroup.AddGroupToTeacher = function(gradeId, groupId, teacherId, callback) {
        TeacherGroup.create({
            gradeId,
            groupId,
            teacherId
        }, (err, newTeacherGroup) => {
            if (err) return callback(err);

            return callback(null, newTeacherGroup);
        });
    }

    TeacherGroup.LinkGroupToTeacher = function(tGroupObject, callback) {
        let filter = {
            where: {
                gradeId: tGroupObject.gradeId,
                groupId: tGroupObject.groupId,
                teacherId: tGroupObject.teacherId,
            }
        }
        TeacherGroup.findOne(filter, (err, teacherGroup) => {
            if (err) return callback(err);
            if (teacherGroup != null) return callback(null, teacherGroup);
            TeacherGroup.create(tGroupObject, (err, created) => {
                if (err) return callback(err);
                return callback(null, created);
            });
        });

    };

    TeacherGroup.GetGroupsByTeacher = function(teacher, cb) {
        let filter = {
            where: {
                teacherId: teacher,
            },
            include: [{
                    relation: "grade",
                    scope: {
                        order: "name",
                    },
                },
                "group",
            ],
        };
        TeacherGroup.find(filter, (err, teacherGroups) => {
            if (err) return cb(err);
            return cb(null, teacherGroups);
        });
    };

    TeacherGroup.FindByGroup = function(filterData, cb) {
        let filter = {
            where: {
                gradeId: filterData.gradeId,
                groupId: filterData.groupId,
                schoolId: filterData.schoolId
            }
        };
        if (filterData.teacherId) filter.where.teacherId = filterData.teacherId;
        TeacherGroup.findOne(filter, (err, teacherGroup) => {
            if (err) return cb(err);
            return cb(null, teacherGroup);
        });
    }

    TeacherGroup.FindMasterKey = function(teacherGroup, callback) {
        TeacherGroup.FindByGroup(teacherGroup, (err, group) => {
            if (err) return callback(err);
            let masterKey = group.masterKey ? group.masterKey : '';
            return callback(null, masterKey);

        });
    }

    TeacherGroup.SetMasterKey = function(newPassword, cb) {
        TeacherGroup.FindByGroup(newPassword, (err, teacherGroup) => {
            if (err) return cb(err);
            if (!teacherGroup)
                return cb("No se encontró el grupo al que intentas modificar");
            teacherGroup.masterKey = newPassword.new;
            teacherGroup.wasPasswordSet = true;
            teacherGroup.save((err, saved) => {
                if (err) return cb(err);
                TeacherGroup.app.models.StudentGroup.SetMasterKeyAsSet(
                    newPassword,
                    (err, result) => {
                        if (err) return cb(err);
                        return cb(null, teacherGroup);
                    }
                );
            });
        });
    };
};