'use strict';

module.exports = function(TeamRole) {

    TeamRole.CreateOne = function(role, callback) {
        TeamRole.create(role, (err, newTeamRole) => {
            if(err) return callback(err);
            return callback(null, newTeamRole);
        });
    }

    TeamRole.GetAll = function(callback) {
        TeamRole.find({
            where: {strategyId: null}
        }, (err, teamRoles) => {
            if(err) return callback(err);
            return callback(null, teamRoles);
        });
    }

};
