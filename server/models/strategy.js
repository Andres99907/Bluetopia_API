'use strict';

var moment = require('moment-timezone');
var constants = require('./../helpers/constants');

var FilterStrategiesByGradeAndGroup = function(strategies, gradeId, groupId) {
    return strategies.filter(strategy => {
        let isValid = true;
        if(!!strategy.strategyGroup()) {
            if(!!gradeId && gradeId != '*') {
                if(strategy.strategyGroup().gradeId != gradeId) isValid = false;
            }
            if(!!groupId && groupId != '*') {
                if(strategy.strategyGroup().groupId != groupId) isValid = false;
            }
        }
        return isValid;
    });
}

module.exports = function(Strategy) {

    Strategy.observe('before save', (ctx, next) => {
        let instanceThatTriggered = !!ctx.instance ? ctx.instance : ctx.data;
        if(!!instanceThatTriggered) instanceThatTriggered.lastModified = moment().tz(constants.momentTimeZone).toISOString();
        next();
    });

    Strategy.CreateOne = function(strategy, callback) {
        if(strategy.hasOwnProperty('id')) delete strategy.id;
        Strategy.app.models.Grade.findOne({
            where: {
                name: {like: `%${strategy.grade}%`}
            }
        }, (err, grade) => {
            if(err) return callback(err);

            Strategy.app.models.Group.findOne({
                where: {
                    name: {like: `%${strategy.group}%`}
                }
            }, (err, group) => {
                if(err) return callback(err);

                Strategy.create(strategy, (err, newStrategy) => {
                    if(err) return callback(err);

                    if(!!grade && !!group) {
                        Strategy.app.models.StrategyGroup.create({
                            strategyId: newStrategy.id,
                            gradeId: grade.id,
                            groupId: group.id,
                        }, (err, newStrategyGroup) => {
                            if(err) return callback(err);
    
                            return callback(null, newStrategy);
                        });
                    }
                    else return callback(null, newStrategy);
                });
            });
        });
    }

    Strategy.prototype.CreateBasedOnAnother = function(ctx, callback) {
        let finalEvent = null;
        const userId = ctx.accessToken.userId;
        let strategy = this.toJSON();
        strategy.userId = userId;
        strategy.startDate = null;
        strategy.endDate = null;
        Strategy.CreateOne(strategy, (err, newStrategy) => {
            if(err) return callback(err);
            
            if(!!strategy.events && !!strategy.events.length) finalEvent = strategy.events.find(event => event.isFinal);
            if(!!finalEvent) {
                delete finalEvent.date;
                finalEvent.strategyId = newStrategy.id;
            }
            Strategy.app.models.Event.CreateOne(finalEvent, (err, newFinalEvent) => {
                if(err) return callback(err);

                if(!!strategy.parcialProducts && strategy.parcialProducts.length) {
                    let cont = 0, limit = strategy.parcialProducts.length;
                    strategy.parcialProducts.map(parcialProduct => {
                        parcialProduct.strategyId = newStrategy.id;
                        parcialProduct.eventId = null;
                        return parcialProduct;
                    }).forEach(parcialProduct => {
                        Strategy.app.models.ParcialProduct.CreateOne(parcialProduct, (err, newParcialProduct) => {
                            if(err) return callback(err);

                            if(++cont == limit) return callback(null, newStrategy);
                        });
                    });
                } else return callback(null, newStrategy);
            });
        });
    }

    Strategy.prototype.Update = function(strategy, onlyStrategy = false, callback) {
        if(!!strategy.dates && strategy.dates.length == 2) {
            strategy.endDate = strategy.dates.pop();
            strategy.startDate = strategy.dates.pop();
            delete strategy.dates;
        }
        if(onlyStrategy) {
            Strategy.upsert(strategy, (err, strategyUpdated) => {
                if(err) return callback(err);
                Strategy.GetData(this.id, (err, strategy) => {
                    if(err) return callback(err);
                    return callback(null, strategy);
                });
            });
        } else {
            let grade = strategy.grade ? strategy.grade.id : 0;
            let group = strategy.group ? strategy.group.id : 0;
            Strategy.app.models.StrategyGroup.UpdateStrategyGroup(strategy.id, strategy.schoolId, grade, group, (err, strategyGroup) => {
                if(err) return callback(err);
                if(strategyGroup.teamsDeleted) strategy.isByTeams = false;
                Strategy.upsert(strategy, (err, strategyUpdated) => {
                    if(err) return callback(err);
                    Strategy.GetData(this.id, (err, strategy) => {
                        if(err) return callback(err);
                        return callback(null, strategy);
                    });
                });
            });
        }
    }
    
    Strategy.GetData = function(strategyId, callback) {
        Strategy.findById(strategyId, {
            include: [
                {
                    'parcialProducts': [
                        'type',
                        'event',
                        'evaluationType',
                        {'resources': 'file'}
                    ]
                },
                'template',
                'customRoles',
                'user',
                {'events':'parcialProduct'},
                {'strategyGroup': ['grade', 'group']},
                {'teams': {'members': ['student', 'role']}}]
        }, (err, strategy) => {
            if(err) return callback(err);

            return callback(null, strategy);
        });
    }

    Strategy.prototype.GetActivities = function(callback) {
        Strategy.app.models.ParcialProduct.find({
            where: {
                strategyId: this.id,
                eventId: null
            }
        }, (err, parcialProjects) => {
            if(err) return callback(err);

            return callback(null, parcialProjects);
        });
    }

    Strategy.GetAllOfSchool = function(schoolId, gradeId, groupId, templateId, statuses, callback) {
        let where = {
            and: [
                {schoolId},
                {isDeleted: false},
            ]
        };
        if(!!templateId && templateId != '*') where.and.push({templateId});
        if(!!statuses && statuses.length) where.and.push({statusId: {inq: statuses}});
        Strategy.find({
            where,
            include: ['user', 'status', 'template', 'teams', {'strategyGroup': ['grade', 'group']}]
        }, (err, strategies) => {
            if(err) return callback(err);

            strategies = FilterStrategiesByGradeAndGroup(strategies, gradeId, groupId)
            return callback(null, strategies);
        });
    }

    Strategy.GetAllOfTeacher = function(ctx, gradeId, groupId, templateId, statuses, callback) {
        const userId = ctx.accessToken.userId;
        Strategy.app.models.Usuario.findById(userId, (err, teacherUser) => {
            if(err) return callback(err);

            let where = {
                and: [
                    {or: [ {userId}, {schoolId: teacherUser.schoolId} ] },
                    {isDeleted: false}
                ]
            }
            if(!!templateId && templateId != '*') where.and.push({templateId});
            if(!!statuses && statuses.length) where.and.push({statusId: {inq: statuses}});
            Strategy.find({
                where,
                include: ['user', 'status', 'template', 'teams', {'strategyGroup': ['grade', 'group']}]
            }, (err, strategies) => {
                if(err) return callback(err);

                strategies = FilterStrategiesByGradeAndGroup(strategies, gradeId, groupId)
    
                return callback(null, strategies);
            });
        });
    }

    Strategy.GetStudents = function (ctx, strategyId, callback) {
        const userId = ctx.accessToken.userId;
        Strategy.GetData(strategyId, (err, strategy) => {
            if (err) return callback(err);

            Strategy.app.models.RoleMapping.findOne({
                where: {
                    principalId: userId
                },
                include: 'role'
            }, (err, roleMapping) => {
                if (err) return callback(err);
    
                if (roleMapping.role().name == 'School') {
                    Strategy.app.models.Student.GetAllOfSchool(userId, (err, schoolStudents) => {
                        if(err) return callback(err);
                        let strategyStudents = schoolStudents.filter(student => {
                            return strategy.strategyGroup().gradeId == student.studentGroup().gradeId && strategy.strategyGroup().groupId == student.studentGroup().groupId;
                        });
                        return callback(null, strategyStudents);
                    });
                } else {
                    Strategy.app.models.Student.GetAllOfTeacher(userId, (err, teacherStudents) => {
                        if(err) return callback(err);
                        let strategyStudents = teacherStudents.filter(student => {
                            return strategy.strategyGroup().gradeId == student.studentGroup().gradeId && strategy.strategyGroup().groupId == student.studentGroup().groupId;
                        });
                        return callback(null, strategyStudents);
                    });
                }
            });
        });
    }

    Strategy.prototype.Delete = function(callback) {
        this.isDeleted = true;
        this.save((err, deleted) => {
            return callback(err, deleted);
        });
    }

    Strategy.GetSuggested = function(strategySubject, callback) {
        Strategy.find({}, (err, strategies) => {
            if(err) return callback(err);

            return callback(null, strategies);
        });
    }

    Strategy.ResetTeams = function(strategyId, callback) {
        Strategy.app.models.Team.find({
            where: {strategyId}
        }, (err, strategyTeams) => {
            if(err) return callback(err);

            let cont = 0, limit = strategyTeams.length;
            if(!limit) return callback(null, []);
            strategyTeams.forEach(team => {
                team.ResetMembers((err, updated) => {
                    if(err) return callback(err);

                    if(++cont == limit) return callback(null, strategyTeams);
                });
            });
        });
    }

    Strategy.GetAllOfStudent = function(ctx, callback) {
        const userId = ctx.accessToken.userId;
        Strategy.app.models.Student.findOne({where: {userId}, include: 'studentGroup'}, (err, student) => {
            if(err) return callback(err);

            Strategy.app.models.StrategyGroup.find({
                where: {
                    gradeId: student.studentGroup().gradeId,
                    groupId: student.studentGroup().groupId,
                    schoolId: student.studentGroup().schoolId,
                },
                include: 'strategy'
            }, (err, strategyGroups) => {
                if(err) return callback(err);

                let strategies = strategyGroups.map(strategyGroup => strategyGroup.strategy());

                return callback(null, strategies);
            });
        });
    }

};
