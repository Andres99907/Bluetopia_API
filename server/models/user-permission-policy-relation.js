'use strict';

var pubsub = require('../helpers/pubsub.js');
module.exports = function(UserPermissionPolicyRelation) {
  UserPermissionPolicyRelation.createUserPermissions = function(permissionNodeIds, userId, callback) {
    let userAdminPerssionPolicyNodesToCreate = [];

    permissionNodeIds.forEach(permissionNodeId => {
      userAdminPerssionPolicyNodesToCreate.push({
        userPermissionPolicyNodeId: permissionNodeId,
        usuarioId: userId,
      });
    });

    UserPermissionPolicyRelation.create(userAdminPerssionPolicyNodesToCreate, function(err, createdNodes) {
      if (err) return callback(err);

      callback(null, createdNodes);
    });
  };

  UserPermissionPolicyRelation.updateAnyPermissions = function(permissionNodeIds, userId, callback) {
    UserPermissionPolicyRelation.find({where: {usuarioId: userId}}, function(err, userPermissions) {
      if (err) return callback(err);

      // Busca los elementos que se encuentren en 'permissionNodeIds' y no en 'userPermissions'
      let permissionsToCreate = permissionNodeIds.filter(elem => userPermissions.find(p => p.userPermissionPolicyNodeId == elem) == null);

      UserPermissionPolicyRelation.createUserPermissions(permissionsToCreate, userId, function(err, createdNodes) {
        if (err) return callback(err);

        // Busca los elementos que se encuentren en 'userPermissions' y no en 'permissionNodeIds'
        let permissionsToDelete = userPermissions.filter(p => permissionNodeIds.find(elem => elem == p.userPermissionPolicyNodeId) == null);
        permissionsToDelete = permissionsToDelete.map(ptd => ptd.userPermissionPolicyNodeId);

        UserPermissionPolicyRelation.destroyAll({userPermissionPolicyNodeId: {inq: permissionsToDelete}}, function(err, info) {
          if (err) return callback(err);

          let userFilter = {
            where: {id: userId},
            include: 'userPermissions',
          };

          UserPermissionPolicyRelation.app.models.Usuario.findOne(userFilter, function(err, updatedUser) {
            if (err) return callback(err);

            updatedUser.loadUserData(function(err, userData) { // ERROR FALTA FUNCION
              if (err) return callback(err);

              var socket = UserPermissionPolicyRelation.app.io;
              pubsub.publish(socket, {
                model: 'Usuario',
                id: userId,
                data: userData,
                method: 'getPermissions',
              });

              callback(null, {created: createdNodes.length, deleted: info.count, updatedUser: updatedUser});
            });
          });
        });
      });
    });
  };
};
