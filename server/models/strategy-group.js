'use strict';

module.exports = function(StrategyGroup) {

    StrategyGroup.UpdateStrategyGroup = function(strategyId, schoolId, gradeId, groupId, callback) {
        if(!strategyId && !gradeId && !groupId) return callback(null, {});
        let instance = {
            strategyId,
            gradeId,
            groupId,
            schoolId
        }
        StrategyGroup.findOrCreate({where: {strategyId}}, instance, async (err, strategyGroup) => {
            if(err) return callback(err);

            if(!!strategyGroup && (strategyGroup.gradeId != gradeId || strategyGroup.groupId != groupId)) {
                StrategyGroup.app.models.Team.DeleteTeamsOfStrategy(strategyId, (err, deleted) => {
                    if(err) return callback(err);

                    StrategyGroup.updateAll({strategyId}, {gradeId, groupId, schoolId}, (err, updated) => {
                        if(err) return callback(err);

                        updated.teamsDeleted = true;
                        return callback(null, updated);
                    });
                });
            } else {
                StrategyGroup.updateAll({strategyId}, {gradeId, groupId, schoolId}, (err, updated) => {
                    if(err) return callback(err);

                    return callback(null, updated);
                });
            }
        });
    }

};
