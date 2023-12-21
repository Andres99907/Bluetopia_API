'use strict';

module.exports = function(Student) {

    Student.AddStudent = function(student, callback) {
        Student.app.models.Group.CreateBasedOnCSV([student], (err, groups) => {
            if (err) return callback(err);

            Student.app.models.Grade.CreateBasedOnCSV([student], (err, grades) => {
                if (err) return callback(err);

                Student.create(student, (err, newStudent) => {
                    if (err) return callback(err);

                    const studentGroup = {
                        studentId: newStudent.id,
                        schoolId: newStudent.schoolId,
                        gradeId: grades.find(g => g.name == student.grade.toLowerCase()) ? grades.find(g => g.name == student.grade.toLowerCase()).id : null,
                        groupId: groups.find(g => g.name == student.group.toLowerCase()) ? groups.find(g => g.name == student.group.toLowerCase()).id : null
                    }
                    Student.app.models.StudentGroup.CreateOne(studentGroup, (err, newStudentGroupInstance) => {
                        if (err) {
                            newStudent.destroy((err2, destroyed) => {
                                return callback(err);
                            });
                        }
                        if(student.teacherGroup) return callback(null, newStudent);
                        const teacherGroup = {
                            gradeId: grades.find(g => g.name == student.grade.toLowerCase()) ? grades.find(g => g.name == student.grade.toLowerCase()).id : null,
                            groupId: groups.find(g => g.name == student.group.toLowerCase()) ? groups.find(g => g.name == student.group.toLowerCase()).id : null,
                            teacherId: student.teacherId
                        }
                        Student.app.models.TeacherGroup.LinkGroupToTeacher(teacherGroup, (err, newGroupTeacher) => {
                            if (err) return callback(err);

                            return callback(null, newStudent);
                        });
                    });
                });
            });
        });
    }

    Student.AddStudents = function(students, callback) {
        if(!students.length) return callback(null, []);
        let newStudents = [];
        Student.app.models.Group.CreateBasedOnCSV(students, (err, groups) => {
            if (err) return callback(err);

            Student.app.models.Grade.CreateBasedOnCSV(students, (err, grades) => {
                if(err) return callback(err);
                var sortedStudents = Student.GroupStudents(students);
                if(sortedStudents.length == 0) return callback(null,[]);
                sortedStudents.forEach((group,i)=>{
                    Student.CreateByGroup(group,(err,studentsCreated)=>{
                        if(err) return callback(err);
                        newStudents.push(studentsCreated);
                        if(i == sortedStudents.length-1) return callback(null,newStudents);
                    });
                });
            });
        });
    }
//Previous method was creating a teacherGroup instance for every element on the array of students, this one creates just one for every group
    Student.CreateByGroup = function(students, cb) {
        if(students.length == 0) return cb(null,[]);
        let grade = students[0].grade;
        let group = students[0].group;
        let newStudents = [];
        Student.app.models.Grade.GetByName(grade,(err,gradeWithId)=>{
            if(err) return cb(err);
        Student.app.models.Group.GetByName(group,(err,groupWithId)=>{
            if(err) return cb(err);
            const teacherGroup = {
                gradeId: JSON.parse(JSON.stringify(gradeWithId)) ? JSON.parse(JSON.stringify(gradeWithId)).id : null,
                groupId: JSON.parse(JSON.stringify(groupWithId)) ? JSON.parse(JSON.stringify(groupWithId)).id : null,
                teacherId: students[0].teacherId
            }
            Student.app.models.TeacherGroup.LinkGroupToTeacher(teacherGroup,(err,newGroupTeacher)=>{
                if(err) return cb(err);
    
               students.forEach((student,i)=>{
                student.teacherGroup = newGroupTeacher;
                Student.AddStudent(student,(err,newStudent)=>{
                    if(err) return cb(err);
                    newStudents.push(newStudent);
                    if(i== students.length-1) return cb(null,newStudents);
                });
               });
            });
        });
        });
    }

    Student.GetStudentByUser = function(userId, callback) {
        Student.findOne({
            where: { userId },
            include: { 'studentGroup': ['group', 'grade'] }
        }, (err, student) => {
            if (err) return callback(err);
            return callback(null, student);
        });
    }

    Student.GroupStudents = function(students,cb) {
        var sortedData = Object.values(students.reduce((result, item) => {
            const key = item.group + item.grade;
            if (!result[key]) {
              result[key] = [];
            }
            result[key].push(item);
            return result;
          }, {}));;
         return sortedData;
    }

    Student.GetAllOfSchool = function(schoolId, gradeId, groupId, searchText, callback) {
        let where = {
            and: [
                {schoolId},
            ]
        };
        if(!!searchText && searchText != '*') {
            where.and.push({or: [
                {name: {like: `%${searchText}%`}},
                {fatherLastname: {like: `%${searchText}%`}},
                {motherLastname: {like: `%${searchText}%`}},
                {registerNumber: {like: `%${searchText}%`}},
            ]});
        }
        Student.find({
            where,
            include: { 'studentGroup': ['group', 'grade'] }
        }, (err, schoolStudents) => {
            if (err) return callback(err);

            if (!!gradeId && gradeId != 0) schoolStudents = schoolStudents.filter(student => student.studentGroup().gradeId == gradeId);
            if (!!groupId && groupId != 0) schoolStudents = schoolStudents.filter(student => student.studentGroup().groupId == groupId);
            return callback(null, schoolStudents);
        });
    }

    Student.GetAllOfTeacher = function(teacherUserId, gradeId, groupId, searchText, callback) {
        Student.app.models.Teacher.findOne({
            where: {
                userId: teacherUserId
            },
            include: 'teacherGroups'
        }, (err, teacher) => {
            if (err) return callback(err);

            if (!teacher) return callback('Teacher not found!!');
            Student.app.models.StudentGroup.find({
                where: {
                    gradeId: { inq: teacher.teacherGroups().map(tg => tg.gradeId) },
                    groupId: { inq: teacher.teacherGroups().map(tg => tg.groupId) },
                },
                include: 'student',
            }, (err, studentGroups) => {
                if (err) return callback(err);

                let where = {
                    and: [
                        {id: { inq: studentGroups.map(sg => sg.studentId) }},
                        {schoolId: teacher.schoolId},
                    ]
                }
                if(!!searchText && searchText != '*') where.and.push({or: [
                    {name: {like: `%${searchText}%`}},
                    {fatherLastname: {like: `%${searchText}%`}},
                    {motherLastname: {like: `%${searchText}%`}},
                    {registerNumber: {like: `%${searchText}%`}},
                ]});
                Student.find({
                    where,
                    include: {'studentGroup': ['group', 'grade']},
                    oder:['fatherLastname ASC','motherLastname ASC'],
                }, (err, students) => {
                    if (err) return callback(err);

                    if(!!gradeId && gradeId != 0) students = students.filter(student => student.studentGroup().gradeId == gradeId);
                    if(!!groupId && groupId != 0) students = students.filter(student => student.studentGroup().groupId == groupId);
                    return callback(null, Student.SortInAlphabeticalOrder(students));
                });
            });
        });
    }

    Student.SortInAlphabeticalOrder = function(students) {
        let mergedData = students.map((item) => ({
            ...JSON.parse(JSON.stringify(item)),
            fullName: `${item.fatherLastname} ${item.motherLastname}`,
          }));
          let sortedData = mergedData.sort((a, b) => {
            return a.fullName.localeCompare(b.fullName);
          });
         return sortedData;
    }

    Student.UpdateSchoolId = function(teacherId, schoolId, callback) {
        if (!teacherId || !schoolId) return callback(null, { count: 0 });
        Student.updateAll({
            teacherUserId: teacherId
        }, { schoolId, teacherUserId: null }, (err, studentsUpdated) => {
            if (err) return callback(err);

            return callback(null, studentsUpdated);
        });
    }

    Student.prototype.GetData = function(callback) {
        Student.findById(this.id, {
            include: [
                'school',
                'evaluations',
                { 'studentGroup': ['group', 'grade'] }
            ]
        }, (err, student) => {
            return callback(err, student);
        });
    }

    Student.prototype.EditStudent = function(newStudent, callback) {
        Student.findOne({ where: { id: this.id } }, (err, student) => {
            if (err) return callback(err);
            if (!student) return callback(null, null);
            Student.upsert(newStudent, (err, updateStudent) => {
                if (err) return callback(err);
                return callback(null, updateStudent);
            });
        });
    }

    Student.prototype.GetDataWithEvaluations = function(parcialProductId, callback) {
        Student.findById(this.id, {
            include: [
                'school',
                { 'studentGroup': ['group', 'grade'] },
                {
                    relation: 'evaluations',
                    scope: {
                        include: 'studentFiles',
                        where: parcialProductId ? {
                            parcialProductId
                        } : null
                    }
                },
            ]
        }, (err, student) => {
            return callback(err, student);
        });
    }

    Student.GetDataWithEvaluationsOfStrategy = function(studentUserId, strategyId, callback) {
        Student.app.models.Strategy.findById(strategyId, {include: 'parcialProducts'}, (err, strategy) => {
            if(err) return callback(err);

            if(!strategy) return callback('Strategy not found!!!');

            Student.findOne({
                where: {userId: studentUserId},
                include: [
                    'school',
                    { 'studentGroup': ['group', 'grade'] },
                    {
                        relation: 'evaluations',
                        scope: {
                            include: 'studentFiles',
                            where: strategy.parcialProducts().length ? {
                                parcialProductId: {inq: strategy.parcialProducts().map(product => product.id)}
                            } : null
                        }
                    },
                ]
            }, (err, student) => {
                return callback(err, student);
            });
        });
    }

    Student.prototype.EvaluateParcialProduct = function(evaluation, callback) {
        evaluation.studentId = this.id;
        Student.app.models.Evaluation.Update(evaluation, (err, evaluationSaved) => {
            if (err) return callback(err);

            return callback(null, evaluationSaved);
        });
    }

    Student.GetEvents = function(studentUserId, callback) {
        Student.findOne({
            where: { userId: studentUserId },
            include: 'studentGroup'
        }, (err, student) => {
            if (err) return callback(err);

            if (!student) return callback('Student not found!!');
            if (!student.studentGroup()) return callback('Student not in group!!');
            Student.app.models.StrategyGroup.find({
                where: {
                    schoolId: student.studentGroup().schoolId,
                    gradeId: student.studentGroup().gradeId,
                    groupId: student.studentGroup().groupId,
                }
            }, (err, strategyGroups) => {
                if (err) return callback(err);

                Student.app.models.Event.find({
                    where: {
                        strategyId: { inq: strategyGroups.map(strategyGroup => strategyGroup.strategyId) }
                    },
                    include: ['type', 'parcialProduct', 'strategy']
                }, (err, events) => {
                    if (err) return callback(err);

                    return callback(null, events);
                });
            });
        });
    }

    Student.OverridePassword = function(passwordObj,cb) {
        if(!passwordObj.userId) return cb(null,'no user found');
            Student.app.models.Usuario.setPassword(passwordObj.userId, passwordObj.newPassword,function(err) {
                if (err) return cb(err);
        
                cb(null, 'success');
              });
    };
};
