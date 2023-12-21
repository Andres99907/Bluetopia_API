'use strict';

module.exports = function(Group) {

    Group.CreateOne = function(group, callback) {
        if(!group || !group.name || !group.name.length) return callback(null, null);
        group.name = group.name.toLowerCase();
        Group.findOrCreate({
            where: {
                name: group.name
            }
        }, group, (err, newGroup) => {
            return callback(err, newGroup);
        });
    }

    Group.CreateBasedOnCSV = function(students, callback) {
        let groups = [], newGroups = [];
        students.forEach(student => {
            if(!groups.includes(student.group)) groups.push(student.group);
        });

        let cont = 0, limit = groups.length;
        if(!limit) return callback(null, newGroups);
        groups.forEach(group => {
            const newGroup = {
                name: group
            }

            Group.CreateOne(newGroup, (err, newGroup) => {
                if(err) return callback(err);

                newGroups.push(newGroup);
                if(++cont == limit) return callback(null, newGroups);
            });
        });
    }

    Group.GetAll = function(callback) {
        Group.find({
            order: 'name ASC'
        }, (err, groups) => {
            return callback(err, groups);
        });
    }

    Group.GetByName = function(groupName,cb) {
        let filter= {
            where:{
                name: {like:`${groupName.toLowerCase()}`}
            }
        }
        Group.findOne(filter,(err,group)=>{
            if(err) return cb(err);
            return cb(null,group);
        });
    }

};
