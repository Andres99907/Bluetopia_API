'use strict';

module.exports = function(Template) {

    Template.CreateOne = function(template, callback) {
        Template.findOrCreate({
            where: {
                name: {like: `%${template.name}%`}
            }
        }, template, (err, newTemplate) => {
            if(err) return callback(err);

            return callback(null, newTemplate);
        });
    }

    Template.GetAll = function(callback) {
        Template.find({}, (err, templates) => {
            if(err) return callback(err);

            return callback(null, templates);
        });
    }

    Template.GetOne = function(id, callback) {
        Template.findById(id, {include: 'type'}, (err, template) => {
            if(err) return callback(err);

            return callback(null, template);
        });
    }

};
