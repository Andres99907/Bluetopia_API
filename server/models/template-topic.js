'use strict';

module.exports = function(TemplateTopic) {

    TemplateTopic.CreateOne = function(templateTopic, callback) {
        TemplateTopic.findOrCreate({
            where: {
                name: templateTopic.name
            }
        }, templateTopic, (err, newTemplateTopic) => {
            if(err) return callback(err);
            
            return callback(null, newTemplateTopic);
        });
    }
    
    TemplateTopic.CreateOneOfTeacher = function(topic, userId, callback) {
        TemplateTopic.app.models.Usuario.findById(userId, {}, (err, user) => {
            if(err) return callback(err);

            const templateTopic = {
                name: topic,
                userId,
                schoolId: user.schoolId
            }
            TemplateTopic.findOrCreate({
                where: {
                    name: {like: `%${templateTopic.name}%`},
                    userId,
                }
            }, templateTopic, (err, newTemplateTopic) => {
                if(err) return callback(err);
                
                return callback(null, newTemplateTopic);
            });
        });
    }
    
    TemplateTopic.GetAll = function(ctx, schoolId = null, callback) {
        const userId = ctx.accessToken.userId;
        TemplateTopic.find({
            where: {
                or: [
                    {userId},
                    {schoolId},
                    {userId: null}
                ]
            },
            order: 'name ASC'
        }, (err, templateTopics) => {
            if(err) return callback(err);
            
            return callback(null, templateTopics);
        });
    }

};
