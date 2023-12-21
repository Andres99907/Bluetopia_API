'use strict';

module.exports = function(Evaluation) {

    Evaluation.Update = function(evaluation, callback) {
        Evaluation.findOne({
            where: {
                studentId: evaluation.studentId,
                parcialProductId: evaluation.parcialProductId
            }
        }, (err, evaluationFound) => {
            if(err) return callback(err);

            if(!!evaluationFound) evaluation.id = evaluationFound.id;
            evaluation.hasBeenEvaluated = true;
            Evaluation.upsert(evaluation, (err, newEvaluation) => {
                if(err) return callback(err);
    
                return callback(null, newEvaluation);
            });
        });
    }

    Evaluation.GetStudentEvaluation = function(studentId, parcialProductId, callback) {
        let evaluation = {
            studentId,
            parcialProductId,
            calification: 0,
        }
        Evaluation.findOrCreate({
            where: {studentId, parcialProductId},
            include: ['studentFiles']
        }, evaluation, (err, studentEvaluation) => {
            if(err) return callback(err);
            
            return callback(null, studentEvaluation);
        });
    }

    Evaluation.prototype.UploadStudentFile = function(file, callback) {
        Evaluation.app.models.Upload.newBase64File(file, (err, newFile) => {
            if(err) return callback(err);

            this.studentFiles.add(newFile.id, (err => {
                if(err) return callback(err);
    
                return callback(null, newFile);
            }));
        });
    }

    Evaluation.prototype.DeleteStudentFile = function(fileId, callback) {
        this.studentFiles.destroy(fileId, (err => {
            if(err) return callback(err);

            return callback(null, this);
        }));
    }

    Evaluation.prototype.ToggleIsDone = function(callback) {
        this.isDone = !this.isDone;
        this.save((err, evaluationSaved) => {
            return callback(err, evaluationSaved);
        });
    }

    Evaluation.GetByStrategyOfStudent = function name(student,strategy,cb) {
        Evaluation.app.models.ParcialProduct.GetByStrategy(strategy,(err,products)=>{
            if(err) return cb(err);
            if(products.length == 0) return cb(null,[]);
            const productsIds = products.map(product => product.id);
            let filter = {
                where:{
                    and:[{
                        productId:{inq:productsIds}
                    },
                {studentId:student}]
                },
                include: {'parcialProduct':'type'}
            }

            Evaluation.find(filter,(err,evaluations)=>{
                if(err) return cb(err);
                return cb(null,evaluations);
            });
        }); 
    }
};
