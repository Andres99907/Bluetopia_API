'use strict';

module.exports = function(TemplateType) {

    TemplateType.CreateOne = function(templateType, callback) {
        TemplateType.findOne({
            where: {name: {like: `%${templateType.name}%`}}
        }, (err, templateTypeFound) => {
            if(err) return callback(err);

            if(!!templateTypeFound) return callback(null, templateTypeFound);
            
            TemplateType.create(templateType, (err, newTemplateType) => {
                if(err) return callback(err);

                return callback(null, newTemplateType);
            });
        });
    }

    TemplateType.GetAll = function(callback) {

    }

    TemplateType.GetAllWithTemplates = function(callback) {
        TemplateType.find({
            include: 'templates'
        }, (err, templateTypes) => {
            if(err) return callback(err);

            return callback(null, templateTypes);
        });
    }
    
    TemplateType.GetOne = function(templateTypeId, callback) {
        TemplateType.findById(templateTypeId, {
            include: 'templates'
        }, (err, templateType) => {
            if(err) return callback(err);
    
            return callback(null, templateType);
        });
    }

};
