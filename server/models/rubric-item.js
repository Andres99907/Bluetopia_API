'use strict';

module.exports = function(RubricItem) {

    RubricItem.GetAllOfSchool = function(schoolId, callback) {
        // Definir el filtro para buscar los objetos Subject con el schoolId proporcionado o con schoolId igual a 0
        var filter = {
            where: {
            schoolId 
            }
        };
    
        RubricItem.find(filter, (err, items) => {
            if(err) return callback(err);
    
            return callback(null, items);
        });
    };

};
