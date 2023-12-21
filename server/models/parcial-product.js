'use strict';

module.exports = function(ParcialProduct) {

    ParcialProduct.observe('after save', (ctx, next) => {
        let instanceThatTriggered = !!ctx.instance ? ctx.instance : ctx.data;
        if(!!instanceThatTriggered) {
            ParcialProduct.app.models.Strategy.findById(instanceThatTriggered.strategyId, {}, (err, strategy) => {
                if(err) console.error(err);
                strategy.save((err, saved) => {
                    if(err) console.error(err);
                    next();
                });
            });
        }
    });

    ParcialProduct.CreateOne = function(parcialProduct, callback) {
        if(parcialProduct.hasOwnProperty('id')) delete parcialProduct.id;
        if(!!parcialProduct.evaluationType) parcialProduct.evaluationTypeId = parcialProduct.evaluationType.id;
        if(parcialProduct.date) {
            const eventInstance = {
                name: `Entrega: "${parcialProduct.name}"`,
                date: parcialProduct.date,
                strategyId: parcialProduct.strategyId,
            }
            ParcialProduct.app.models.Event.create(eventInstance, (err, newEvent) => {
                if(err) return callback(err);

                parcialProduct.eventId = newEvent.id;
                ParcialProduct.create(parcialProduct, (err, newParcialProduct) => {
                    if(err) return callback(err);
                    
                    newParcialProduct.UpdateResources(parcialProduct.resources, (err, updated) => {
                        if(err) return callback(err);

                        return callback(null, newParcialProduct);
                    });
                });
            });
        }
        else {
            ParcialProduct.create(parcialProduct, (err, newParcialProduct) => {
                if(err) return callback(err);
                
                newParcialProduct.UpdateResources(parcialProduct.resources, (err, updated) => {
                    if(err) return callback(err);

                    return callback(null, newParcialProduct);
                });
            });
        }
    }

    ParcialProduct.CreateActivity = function (parcialProduct, callback) {
      ParcialProduct.app.models.EvaluationType.GetIdByTypeName(
        "numeric",
        (err, evaluationTypeId) => {
          if (err) return callback(err);

          parcialProduct.evaluationTypeId = evaluationTypeId.id;
          const eventInstance = {
            name: `Actividad: "${parcialProduct.name}"`,
            date: parcialProduct.date,
            strategyId: parcialProduct.strategyId,
          };
          ParcialProduct.app.models.Event.create(
            eventInstance,
            (err, newEvent) => {
              if (err) return callback(err);

              parcialProduct.eventId = newEvent.id;
              parcialProduct.isActivity = true;
              ParcialProduct.create(
                parcialProduct,
                (err, newParcialProduct) => {
                  if (err) return callback(err);

                  newParcialProduct.UpdateResources(
                    parcialProduct.resources,
                    (err, updated) => {
                      if (err) return callback(err);

                      return callback(null, newParcialProduct);
                    }
                  );
                }
              );
            }
          );
        }
      );
    };

    ParcialProduct.UpdateEvent = function (
      parcialProductId,
      event,
      callback
    ) {
      if (!parcialProductId) return callback(null, {});
      ParcialProduct.findById(parcialProductId, {}, (err, parcialProduct) => {
        parcialProduct.eventId = event.id;
        parcialProduct.save((err, saved) => {
          if (err) return callback(err);
          parcialProduct.UpdateResources(
            event.resources,
            (err, savedResources) => {
              if (err) return callback(err);

              return callback(null, parcialProduct);
            }
          );
        });
      });
    };

    ParcialProduct.prototype.Update = function(ctx, parcialProduct, callback) {
        let eventInstance = {
            name: `Entrega: "${parcialProduct.name}"`,
            date: parcialProduct.date,
            strategyId: parcialProduct.strategyId,
            id: parcialProduct.eventId
        };
        ParcialProduct.app.models.Event.Update(ctx, eventInstance, (err, updatedEvent) => {
            if(err) return callback(err);

            parcialProduct.eventId = updatedEvent.id;
            ParcialProduct.upsert(parcialProduct, (err, updated) => {
                if(err) return callback(err);
                
                updated.UpdateResources(parcialProduct.resources, (err, updatedResources) => {
                    if(err) return callback(err);

                    return callback(null, updated);
                });
            });
        });
    }

    ParcialProduct.prototype.Delete = function(callback) {
        this.destroy((err, destroyed) => {
            if(err) return callback(err);
            return callback(null, destroyed);
        });
    }

    ParcialProduct.prototype.UpdateResources = function(resources, callback) {
        let files = [];
        if(!resources || resources.length == 0) return callback(null, files);
        let cont = 0, limit = resources.length;
        if(!limit) return callback(null, files);
        let where = {
            parcialProductId: this.id,
            fileId: {
                nin: resources.filter(resource => !!resource.id).map(resource => resource.id)
            }
        };
        ParcialProduct.app.models.ParcialProductFile.destroyAll(where, (err, destroyed) => {
            if(err) return callback(err);

            resources.forEach(resource => {
                if(!!resource.id) {
                    const parcialProductFile = {
                        parcialProductId: this.id,
                        fileId: resource.id
                    }
                    ParcialProduct.app.models.ParcialProductFile.findOrCreate({where: {...parcialProductFile}}, parcialProductFile, (err, newParcialProductFile) => {
                        if(err) return callback(err);
    
                        files.push(resource);
                        if(++cont == limit) return callback(null, files);
                    });
                }
                else {
                    ParcialProduct.app.models.Upload.newBase64File(resource, (err, newFile) => {
                        if(err) return callback(err);
    
                        const parcialProductFile = {
                            parcialProductId: this.id,
                            fileId: newFile.id
                        }
                        ParcialProduct.app.models.ParcialProductFile.create(parcialProductFile, (err, newParcialProductFile) => {
                            if(err) return callback(err);
        
                            files.push(newFile);
                            if(++cont == limit) return callback(null, files);
                        });
                    });
                }
            });
        });
    }

    ParcialProduct.GetByStrategy = function(strategy,cb) {
        ParcialProduct.find({where:{strategyId:strategy}},(err,products)=>{
            if(err) return cb(err);
            return cb(null,products);
        });
    }
};
