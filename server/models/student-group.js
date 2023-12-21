'use strict';
const uuidV4 = require('uuid/v4');

module.exports = function(StudentGroup) {

    StudentGroup.CreateOne = function(studentGroup, callback) {
        if(!studentGroup.schoolId) return callback('schoolId not valid');
        StudentGroup.find({
            where: {
                schoolId: studentGroup.schoolId,
                gradeId: studentGroup.gradeId,
                groupId: studentGroup.groupId,
            },
            limit: 1
        }, (err, studentGroups) => {
            if(err) return callback(err);
            if(!!studentGroups.length) studentGroup.registerUid = studentGroups[0].registerUid;
            StudentGroup.create(studentGroup, (err, newStudentGroup) => {
                return callback(err, newStudentGroup);
            });
        });
    }

    StudentGroup.GenerateRegisterUid = function(schoolId, gradeId, groupId, callback) {
        let uid = uuidV4();
        StudentGroup.updateAll({schoolId, gradeId, groupId}, {registerUid: uid}, (err, studentsgroups) => {
            if(err) return callback(err);

            return callback(null, uid);
        });
    }

    StudentGroup.GetByRegisterUid = function(registerUid, callback) {
        StudentGroup.find({
            where: {registerUid},
            include: 'student'
        }, (err, studentGroups) => {
            if(err) return callback(err);
            if(!studentGroups.length) return callback('registerUid not valid!!');
            StudentGroup.GetMasterKey(registerUid,(err,masterKey)=>{
                if(err) return callback(err);
                return callback(null, {studentGroups,masterKey});
            });
        });
    }

    StudentGroup.GetMasterKey = function(registerUid,cb) {
        let filter = {
            where: {
               registerUid,
                wasPasswordSet: true
            }
        }
        StudentGroup.findOne(filter,(err,studentGroup)=>{
            if(err) return cb(err);
            if (studentGroup == null) return cb(null, studentGroup)
            StudentGroup.app.models.TeacherGroup.FindByGroup(studentGroup,(err,result)=>{
                if(err) return cb(err);
                if(!result) return cb(null,null);
                return cb(null, JSON.parse(JSON.stringify(result)).masterKey);
            });
        });
    }
    StudentGroup.FindByGroup = function(filterData,cb){
        let filter= {
            where: {
                gradeId: filterData.gradeId,
                groupId: filterData.groupId,
                schoolId: filterData.schoolId
            },
            include: 'student'
        };
        StudentGroup.find(filter,(err,teacherGroup)=>{
            if (err) return cb(err);
            return cb(null, teacherGroup);
        });
    }

    StudentGroup.SetMasterKeyAsSet = function(group,cb) {
        StudentGroup.FindByGroup(group,(err,studentsInGroup)=>{
            if (err) return cb(err);
            if(!studentsInGroup || studentsInGroup.length == 0) return cb(null,[]);
            studentsInGroup.forEach((studentInGroup,i) => {
                let studentInGroupJSON = JSON.parse(JSON.stringify(studentInGroup));
                studentInGroup.wasPasswordSet = true;
                studentInGroup.save((err,saved)=>{
                    if (err) return cb(err);
                    let newPassword = {
                        newPassword:group.new,
                        userId: studentInGroupJSON.student.userId
                    }
                    StudentGroup.app.models.Student.OverridePassword(newPassword,(err,result)=>{
                        if (err) return cb(err);
                        if(i == studentsInGroup.length-1) return cb(null,'passwordsChanged');
                    });
                });
            });
        });
    }
};
