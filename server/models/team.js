'use strict';

module.exports = function(Team) {

    Team.observe('before delete', (ctx, next) => {
        let instanceThatTriggered = ctx.instance || ctx.data;
        if(!!instanceThatTriggered) {
            Team.app.models.TeamStudent.destroyAll({teamId: instanceThatTriggered.relatedModelId}, (err, destroyed) => {
                if(err) return next(err);
                next();
            });
        }
        else next();
    });

    Team.CreateOne = function(team, callback) {
        let teamInstance = {
            name: team.name,
            strategyId: team.strategyId
        }
        Team.create(teamInstance, (err, newTeam) => {
            if(err) return callback(err);

            let cont = 0, limit = team.members.length;
            if(!limit) return callback(null, newTeam);
            team.members.forEach(member => {
                let teamStudent = {
                    teamId: newTeam.id,
                    studentId: member.id,
                    roleId: member.roleId
                }
                Team.app.models.TeamStudent.create(teamStudent, (err) => {
                    if(err) return callback(err);
                    if(++cont == limit) return callback(null, newTeam);
                });
            });
        });
    }

    Team.AddTeams = function(teams, strategyId, callback) {
        let cont = 0, limit = teams.length;
        if(!limit) return callback(null, []);
        teams.forEach(team => {
            team.strategyId = strategyId;
            Team.CreateOne(team, (err, newTeam) => {
                if(err) return callback(err);

                if(++cont == limit) return callback(null, teams);
            });
        });
    }

    Team.UpsertStrategyTeams = function(teams, strategyId, callback) {
        Team.DeleteTeamsOfStrategy(strategyId, (err, strategyTeams) => {
            if(err) return callback(err);

            teams.forEach((team, idx) => {
                team.name = `Equipo ${idx + 1}`;
            });
            Team.AddTeams(teams, strategyId, (err, teamsCreated) => {
                if(err) return callback(err);
                return callback(null, teamsCreated);
            });
        });
    }

    Team.DeleteTeamsOfStrategy = function(strategyId, callback) {
        Team.find({strategyId}, (err, strategyTeams) => {
            if(err) return callback(err);

            let cont = 0, limit = strategyTeams.length;
            if(!limit) return callback(null, []);
            else {
                strategyTeams.forEach(team => {
                    team.destroy((err, destroyed) => {
                        if(err) return callback(err);

                        if(++cont == limit) return callback(null, []);
                    });
                });
            }
        });
    }

    Team.UpdateMembersRoles = function(team, callback) {
        let cont = 0, limit = team.members.length;
        if(!limit) return callback(null, team);
        team.members.forEach(member => {
            Team.app.models.TeamStudent.upsert(member, (err, updated) => {
                if(err) return callback(err);
    
                if(++cont == limit) return callback(null, team);
            });
        });
    }

    Team.UpdateTeamsMembersRoles = function(teams, callback) {
        let cont = 0, limit = teams.length;
        if(!limit) return callback(null, teams);
        teams.forEach(team => {
            Team.UpdateMembersRoles(team, (err, updated) => {
                if(err) return callback(err);

                if(++cont == limit) return callback(null, teams);
            });
        });
    }

    Team.prototype.ResetMembers = function(callback) {
        Team.app.models.TeamStudent.updateAll({teamId: this.id}, {roleId: null}, (err, updated) => {
            if(err) return callback(err);

            return callback(null, updated);
        });
    }

    Team.prototype.GetData = function(parcialProductId, callback) {
        Team.findById(this.id, {
            include: [{
                relation: 'comments',
                scope: {
                    where: !!parcialProductId ? {
                        parcialProductId
                    } : null
                }
            }, {'members': [
                'role',
                {'student': {
                    relation: 'evaluations',
                    scope: {
                        include: 'studentFiles',
                        where: !!parcialProductId ? {
                            parcialProductId
                        } : null
                    }
                }}]}]
        }, (err, team) => {
            return callback(err, team);
        });
    }

    Team.prototype.EvaluateParcialProduct = function(evaluation, callback) {
        Team.app.models.TeamStudent.find({
            where: {teamId: this.id}
        }, (err, teamStudents) => {
            if(err) return callback(err);

            let teamComment = {
                teamId: this.id,
                parcialProductId: evaluation.parcialProductId,
                comment: evaluation.comment
            }
            Team.app.models.TeamComment.Update(teamComment, (err, teamCommentUpdated) => {
                if(err) return callback(err);

                let cont = 0, limit = teamStudents.length;
                if(!limit) return callback(null, evaluation);
                teamStudents.forEach(teamStudent => {
                    let evaluationCopy = Object.assign({}, evaluation);
                    evaluationCopy.studentId = teamStudent.studentId;
                    if(!!evaluationCopy.members && evaluationCopy.members.length) {
                        let member = evaluationCopy.members.find(member => member.studentId == teamStudent.studentId);
                        evaluationCopy.comment = !!member && !!member.comment ? member.comment : null;
                    }
                    Team.app.models.Evaluation.Update(evaluationCopy, (err, newEvaluation) => {
                        if(err) return callback(err);
    
                        if(++cont == limit) return callback(null, evaluation);
                    });
                });
            });
        });
    }

};
