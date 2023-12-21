'use strict';

const relationMethodPrefixes = [
    'prototype.__findById__',
    'prototype.__destroyById__',
    'prototype.__updateById__',
    'prototype.__exists__',
    'prototype.__link__',
    'prototype.__get__',
    'prototype.__create__',
    'prototype.__update__',
    'prototype.__destroy__',
    'prototype.__unlink__',
    'prototype.__count__',
    'prototype.__delete__'
  ];

  module.exports.disableRelationMethods = function(appModel){
      var relationMethods = [];
      try {
          var keys = Object.keys(appModel.definition.settings.relations);
          keys.forEach(r => {
              relationMethodPrefixes.forEach(MP => {
                  relationMethods.push(MP+r)
              });
              relationMethods.forEach(m => {
                  appModel.disableRemoteMethodByName(m)
              });
          });
      } catch (error) {
          console.log(error);
          
      }
  }