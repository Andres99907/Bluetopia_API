'use strict';

module.exports = function(TeamComment) {

    TeamComment.Update = function(teamComment, callback) {
        TeamComment.findOne({
            where: {
                teamId: teamComment.teamId,
                parcialProductId: teamComment.parcialProductId,
            }
        }, (err, teamCommentFound) => {
            if(err) return callback(err);

            if(!!teamCommentFound) teamComment.id = teamCommentFound.id;
            TeamComment.upsert(teamComment, (err, newTeamComment) => {
                if(err) return callback(err);
    
                return callback(null, newTeamComment);
            });
        });
    }

};
