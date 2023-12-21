'use strict';

module.exports = function(Skill) {

    Skill.CreateOne = function(skill, callback) {
        Skill.findOne({
            where: {name: skill.name}
        }, (err, skillFound) => {
            if(err) return callback(err);

            if(!!skillFound) {
                if(skillFound.name === skill.name) return callback(null, skillFound);
                else {
                    skillFound.name = skill.name;
                    skillFound.save((err, skillSaved) => {
                        if(err) return callback(err);
                        return callback(null, skillSaved);
                    });
                }
            } else {
                Skill.create(skill, (err, newSkill) => {
                    if(err) return callback(err);
    
                    return callback(null, newSkill);
                });
            }
        });
    }

    Skill.GetAll = function(callback) {
        Skill.find((err, skills) => {
            if(err) return callback(err);

            return callback(null, skills);
        });
    }

};
