'use strict';

module.exports = function(School) {

    School.CreateOne = function(school, callback) {
        if (!school) return callback(null, {});
        School.findOrCreate({
            where: {
                name: {
                    regexp: `${school.name}`,
                    options: 'i'
                }
            }
        }, school, (err, newSchool) => {
            if (err) return callback(err);

            return callback(null, newSchool);
        });
    }

    School.Update = function(school, callback) {
        if (!school) return callback(null, {});

        School.upsert(school, (err, school) => {
            if (err) return callback(err);

            return callback(null, school);
        });
    }

    School.prototype.UpdateData = function(school, callback) {
        if (!school) return callback(null, false);
        School.upsert(school.school, (err, schoolupdated) => {
            if (err) return callback(err);
            School.app.models.UserData.Update(school.data, (err, updated) => {
                if (err) return callback(err);
                School.app.models.Usuario.findOne({ where: { id: school.data.userId } }, (err, user) => {
                    if (err) return callback(err);
                    user.__data.username = school.name;
                    // user.__data.email = school.email;
                    user.save(user, (err, updated) => {
                        if (err) return callback(err);
                        return callback(null, school);
                    });
                });
            });
        });
    }

};
