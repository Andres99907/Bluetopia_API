'use strict';

module.exports = function(Entry) {

    Entry.GetAllOfSchool = function(schoolId, callback) {
        // Definir el filtro para buscar los objetos Subject con el schoolId proporcionado o con schoolId igual a 0
        var filter = {
            where: {
            schoolId 
            }
        };
    
        Entry.find(filter, (err, items) => {
            if(err) return callback(err);
    
            return callback(null, items);
        });
    };

    Entry.GetLast = function (cb) {
        Entry.findOne({order:'id DESC'},(err,last)=>{
            if(err) return cb(err);
            return cb(null,last);
        });
    }

    // Definir la función para crear un nuevo RubricItem
    Entry.CreateOneWithoutRepeat = function(entry, cb) {
    const schoolId = entry.schoolId; // Asumimos que schoolId viene dentro del objeto entry

    // Verificar que el schoolId esté presente
    if (!schoolId) {
      const err = new Error('schoolId is required');
      err.statusCode = 400;
      return cb(err);
    }

    if (!entry.entryLevel)
    {
    // Buscar el último RubricItem para el schoolId dado
    Entry.find({ where: { schoolId: schoolId }, order: 'entryLevel DESC', limit: 1 }, function(err, lastEntries) {
      if (err) {
        return cb(err);
      }

      // Determinar el entryLevel para el nuevo RubricItem
      const lastEntry = lastEntries[0];
      const newEntryLevel = lastEntry ? lastEntry.entryLevel + 1 : 1;

      // Crear el nuevo RubricItem
      Entry.create({
        entry: entry.entry,
        entryDescription: entry.entryDescription,
        entryLevel: newEntryLevel,
        schoolId: schoolId // Asegurarse de que el schoolId se está pasando correctamente
      }, cb);
    });
    }
    // Crear el nuevo RubricItem
    Entry.create({
      entry: entry.entry,
      entryDescription: entry.entryDescription,
      entryLevel: entry.entryLevel,
      schoolId: schoolId // Asegurarse de que el schoolId se está pasando correctamente
    }, cb);
  };


  Entry.DeleteOne = function(entryId, callback) {
    
    Entry.findById(entryId, (err, foundEntry) => {
        if (err) {
            return callback(err);
        }
        
        // Verificar si  existe
        if (!foundEntry) {
            return callback('ENTRY_NOT_FOUND');
        }
        
        foundEntry.destroy()
        return callback(null, 'ENTRY_DELETED_SUCCESSFULLY');
    });
};
  

};
