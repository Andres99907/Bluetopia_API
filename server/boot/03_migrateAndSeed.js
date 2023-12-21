'use strict';
const sepObjectives = require('../helpers/sepGoals.json');
module.exports = function(app) {
  /*
   * The `app` object provides access to a variety of LoopBack resources such as
   * models (e.g. `app.models.YourModelName`) or data sources (e.g.
   * `app.datasources.YourDataSource`). See
   * https://loopback.io/doc/en/lb3/Working-with-LoopBack-objects.html
   * for more info.
   */

  // Seed
  var seedUsers = function() {
    var attemptNewUserWithRole = function(user, roleToAssing) {
      var RoleMapping = app.models.RoleMapping;
      var Role = app.models.Role;
      var Usuario = app.models.Usuario;

      Usuario.find({where:{ or: [{email:user.email}, {username: user.username}] } }, function(err, res){
        if (err) throw err;

        // If seed object is not created
        if (res.length == 0) {
          Usuario.create(user, function(err, newU){
            if (err) throw err;

            Role.findOne({where:{name: roleToAssing}}, function(err, role) {
              if (err) throw err;

              role.principals.create({
                  principalType: RoleMapping.USER,
                  principalId: newU.id
                }, function(err, principal) {
                  if (err) throw err;

                  console.log("Created User: ",newU.email,", with role: ", roleToAssing)
              })
            })
          })
        }
      })
    }

    var users = [
      {
        User: {
          name: "SuperUser",
          username: "SuperUser",
          password: "j4r4b3s0",
          email: "superuser@jarabepruebas.com",
          emailVerified: true,
          active: true
        },
        Role: "SuperUser"
      },
      {
        User: {
          name: "Admin",
          username: "Admin",
          password: "j4r4b3s0",
          email: "admin@jarabepruebas.com",
          emailVerified: true,
          active: true
        },
        Role: "Admin"
      },
      {
        User: {
          name: "Parent Jarabe",
          username: "Parent Jarabe",
          password: "j4r4b3s0",
          email: "parent@jarabepruebas.com",
          emailVerified: true,
          active: true
        },
        Role: "Parent"
      },
      {
        User: {
          name: "Student Jarabe",
          username: "Student Jarabe",
          password: "j4r4b3s0",
          email: "student@jarabepruebas.com",
          emailVerified: true,
          active: true
        },
        Role: "Student"
      },
    ]

    users.forEach(u => {
      attemptNewUserWithRole(u.User, u.Role);
    });
  }

  var seedRoles = function () {
    var appRoles = [
      {
        name: "User",
        description: 'platform user'
      },
      {
        name: "Admin",
        description: 'platform administrator'
      },
      {
        name:"SuperUser",
        description: 'the most powerful user'
      },
      {
        name:"School",
        description: 'escuela'
      },
      {
        name:"Teacher",
        description: 'maestro'
      },
      {
        name:"Parent",
        description: 'padre'
      },
      {
        name:"Student",
        description: 'estudiante'
      },
    ]

    // console.log("Seeding Model: Role");
    sequentialSeed(appRoles, "name", app.models.Role, seedUsers);
    
  }

  var seedSubjects = function() {
    const subjects = [
      {
        name: "Lenguajes",
        id:1
      },
      {
        name: "Saberes y Pensamiento Científico",
        id:2
      },
      {
        name: "Ética, naturaleza y sociedades",
        id:3
      },
      {
        name: "De lo humano y lo comunitario",
        id:4
      },
    ];

    let cont = 0, limit = subjects.length;
    subjects.forEach(subject => {
      app.models.Subject.CreateOneWithoutRepeat(subject, (err, newSubject) => {
        if(err) throw err;
        if(++cont == limit) console.log("Subjects seeded succesfully");
      });
    });
  }

  var seedTemplateTopics = function() {
    const templateTopics = [
      {
        name: "Agua potable"
      },
      {
        name: "Contaminación"
      },
      {
        name: "Energía renovable"
      },
    ];

    let cont = 0, limit = templateTopics.length;
    templateTopics.forEach(templateTopic => {
      app.models.TemplateTopic.CreateOne(templateTopic, (err, newTemplateTopic) => {
        if(err) throw err;
        if(++cont == limit) console.log("template topics seeded");
      });
    });
  }

  var seedTemplateTypes = function() {
    const templateTypes = [
      {
        id: 1,
        name: "Aprendizaje basado en"
      },
      {
        id: 2,
        name: "Exeperiencias Gamificadas"
      },
      {
        id: 3,
        name: "Actividades de Aprendizaje"
      },
    ];

    let cont = 0, limit = templateTypes.length;
    templateTypes.forEach(templateType => {
      app.models.TemplateType.CreateOne(templateType, (err, newTemplateType) => {
        if(err) throw err;
        if(++cont == limit) {
          seedTemplates();
        }
      });
    });
  }

  var seedTemplates = function() {
    let templates = require('./../helpers/templates.json');
    let cont = 0, limit = templates.length;
    templates.forEach(template => {
      app.models.Template.CreateOne(template, (err, newTemplate) => {
        if(err) throw err;
        if(++cont == limit) console.log("Templates seeded succesfully");
      });
    });
  }

  var seedParcialProductsTypes = function() {
    let parcialProductTypes = require('./../helpers/parcialProducts.json');

    let cont = 0, limit = parcialProductTypes.length;
    parcialProductTypes.forEach(parcialProductType => {
      app.models.ParcialProductType.CreateOne(parcialProductType, (err, newParcialProductType) => {
        if(err) throw err;
        if(++cont == limit) console.log("parcial product types seeded");
      });
    });
  }

  var seedEvaluationTypes = function() {
    const evaluationTypes = [
      {
        name: 'Por rúbrica',
        type: 'rubric',
      },
      {
        name: 'Valor numérico',
        type: 'numeric',
      },
    ];

    let cont = 0, limit = evaluationTypes.length;
    evaluationTypes.forEach(evaluationType => {
      app.models.EvaluationType.CreateOne(evaluationType, (err, newInstance) => {
        if(err) throw err;
        if(++cont == limit) console.log("Evaluation types seeded");
      });
    });
  }

  var seedSepObjectives = function() {
    

    let cont = 0, limit = sepObjectives.length;
    sepObjectives.forEach(sepObjective => {
      app.models.SepObjective.CreateOne(sepObjective, (err, newSepObjective) => {
        if(err) throw err;
        if(++cont == limit) console.log("SEP objectives seeded");
      });
    });
  }

  var seedSkills = function() {
    const skills = [
      {
        name: 'ADAPTABILIDAD',
      },
      {
        name: 'ANÁLISIS DE PROBLEMAS',
      },
      {
        name: 'ANÁLISIS NUMÉRICO',
      },
      {
        name: 'ASUNCIÓN DE RIESGOS',
      },
      {
        name: 'AUTOMOTIVACIÓN',
      },
      {
        name: 'CAPACIDAD CRÍTICA',
      },
      {
        name: 'CREATIVIDAD',
      },
      {
        name: 'COMUNICACIÓN VERBAL Y NO VERBAL PERSUASIVA',
      },
      {
        name: 'COMUNICACIÓN ESCRITA',
      },
      {
        name: 'COMPROMISO',
      },
      {
        name: 'DELEGACIÓN',
      },
      {
        name: 'DECISIÓN',
      },
      {
        name: 'TOLERANCIA AL ESTRÉS',
      },
      {
        name: 'ESCUCHA',
      },
      {
        name: 'FLEXIBILIDAD',
      },
      {
        name: 'INDEPENDENCIA',
      },
      {
        name: 'INTEGRIDAD',
      },
      {
        name: 'IMPACTO',
      },
      {
        name: 'INICIATIVA',
      },
      {
        name: 'LIDERAZGO',
      },
      {
        name: 'METICULOSIDAD',
      },
      {
        name: 'NIVELES DE TRABAJO',
      },
      {
        name: 'PLANIFICACIÓN Y ORGANIZACIÓN',
      },
      {
        name: 'RESISTENCIA',
      },
      {
        name: 'SENSIBILIDAD ORGANIZACIONAL',
      },
      {
        name: 'SENSIBILIDAD INTERPERSONAL',
      },
      {
        name: 'SOCIABILIDAD',
      },
      {
        name: 'TENACIDAD',
      },
      {
        name: 'TRABAJO EN EQUIPO',
      },
    ];

    let cont = 0, limit = skills.length;
    skills.forEach(skill => {
      skill.name = `${skill.name.charAt(0).toUpperCase()}${skill.name.slice(1).toLowerCase()}`;
      app.models.Skill.CreateOne(skill, (err, newSkill) => {
        if(err) throw err;
        if(++cont == limit) console.log("Skills seeded");
      });
    });
  }

  var seedStrategyStatuses = function() {
    const statuses = [
      {
        id: 1,
        name: 'En planeación',
      },
      {
        id: 2,
        name: 'Activa',
      },
      {
        id: 3,
        name: 'Finalizada',
      },
    ];

    let cont = 0, limit = statuses.length;
    statuses.forEach(status => {
      app.models.StrategyStatus.CreateOne(status, (err, newStatus) => {
        if(err) throw err;
        if(++cont == limit) console.log("Strategy statuses seeded");
      });
    });
  }

  var seedEventTypes = function() {
    let eventTypes = require('./../helpers/eventType.json');

    let cont = 0, limit = eventTypes.length;
    eventTypes.forEach(eventType => {
      app.models.EventType.CreateOne(eventType, (err, newEventType) => {
        if(err) throw err;
        if(++cont == limit) console.log("event types seeded");
      });
    });
  }

  var seedTeamRoles = function() {
    const teamRoles = [
      {
        name: 'Director / Líder',
        description: 'Es quien dirige el trabajo del equipo.',
      },
      {
        name: 'Secretario',
        description: 'Es quien lleva el registro del avance, toma acuerdos y ayuda al buen funcionamiento.',
      },
      {
        name: 'Editor',
        description: 'Es quien asegura la calidad del trabajo ayudando a cuidar los detalles y mejorar los productos.',
      },
      {
        name: 'Investigador / Detective',
        description: 'Es quien busca información y consigue los datos necesarios para el trabajo.',
      },
      {
        name: 'Creativo ',
        description: 'Es quien busca nuevas soluciones, ideas alternativas y posibilidades insospechadas.',
      },
      {
        name: 'Cronómetro / Reloj',
        description: 'Es quien cuida el tiempo para terminar cuando es debido.',
      },
      {
        name: 'Recursos / Almacén',
        description: 'Es quien se asegura de tener el material y recursos necesarios para el trabajo.',
      },
      {
        name: 'Revisor / Lupa',
        description: 'Es quien busca errores, omisiones y detalles a mejorar antes de entregar el trabajo.',
      },
      {
        name: 'Impulsor ',
        description: 'Es quien anima al equipo y ayuda a que el equipo avance con buen ritmo.',
      },
      {
        name: 'Especialista en',
        description: 'Es quien cuidará una parte específica del trabajo, se nombra especialista en algo concreto.',
      },
      {
        name: 'Redactor',
        description: 'Es quien escribe cuidando especialmente la redacción y ortografía en los trabajos.',
      },
    ];

    let cont = 0, limit = teamRoles.length;
    teamRoles.forEach(teamRole => {
      app.models.TeamRole.findOrCreate({where: {name: {like: `%${teamRole.name}%`}}}, teamRole, (err, newTeamRole) => {
        if(err) throw err;
        if(++cont == limit) console.log("team roles seeded");
      });
    });
  }

  var SynchronizeSchoolIdOfStudentsGroups = function() {
    app.models.StudentGroup.find({where: {schoolId: null}, include: 'student'}, (err, instances) => {
      instances.forEach(instance => {
        if(!!instance.student()) {
          instance.schoolId = instance.student().schoolId;
          instance.save((err, saved) => {
          });
        }
      });
    });
  }

  var SynchronizeSchoolIdOfStrategyGroups = function() {
    app.models.StrategyGroup.find({where: {schoolId: null}, include: 'strategy'}, (err, instances) => {
      instances.forEach(instance => {
        if(!!instance.strategy()) {
          instance.schoolId = instance.strategy().schoolId;
          instance.save((err, saved) => {
          });
        }
      });
    });
  }

  var SynchronizeSchoolIdOfTemplateTopics = function() {
    app.models.TemplateTopic.find({where: {schoolId: null}, include: 'user'}, (err, instances) => {
      instances.forEach(instance => {
        if(!!instance.user()) {
          instance.schoolId = instance.user().schoolId;
          instance.save((err, saved) => {
          });
        }
      });
    });
  }

  var seedUploadContainers = function(){
    var Upload = app.models.Upload;
    var containers = [
      {
        name: "profileImages"
      },
      {
        name: "resources"
      },
      {
        name: "studentActivitiesFiles"
      },
    ]

    var sequentialConteinerSeed = function(containers, uploadAppModel){
      if(containers.length == 0){
        console.log("Seeded Model: ",uploadAppModel.modelName);
        return;
      }
      let container = containers[0];
      uploadAppModel.getContainer(container.name, function(err, cont){
        containers.shift();
        if(err){
          if (err.code == "ENOENT"){
            uploadAppModel.createContainer(container, function(err, cont){
              if (err) throw err;
              if(cont)
                console.log("Created  "+uploadAppModel.modelName+": ",container.name)
              else
                console.log("Could not create  "+appModel.modelName+": ",container.name)

              sequentialConteinerSeed(containers, uploadAppModel);
            })
          }else
            throw err
        }else{
          sequentialConteinerSeed(containers, uploadAppModel);
        }
      })
    }

    sequentialConteinerSeed(containers, Upload);
  }

  var sequentialSeed = function (modelsSeedsArray, key, appModel, afterFunction = null){
    if(modelsSeedsArray.length == 0){
      console.log("Seeded Model: ",appModel.modelName);
      if(afterFunction != null){
        console.log("Executing After Function: "+afterFunction.name+"...",);
        afterFunction();
      }
      return;
    }
    var modelSeed = modelsSeedsArray[0];
    var query = {};
    query["where"] = {};
    query["where"][key] = modelSeed[key];

    // Find seed object
    appModel.find(query, function(err, res){
        if (err) throw err;

        // Remove actual seed model from array
        modelsSeedsArray.shift();
        // If seed object is not created
        if (res.length == 0) {
          appModel.create(modelSeed, function(err, res){
            if (err) throw err;

            if(res)
              console.log("Created  "+appModel.modelName+": ",modelSeed[key])
            else
              console.log("Could not create  "+appModel.modelName+": ",modelSeed[key])

            // pass to next modelSeed
            sequentialSeed(modelsSeedsArray, key, appModel, afterFunction)
          });
        }else{
          // pass to next modelSeed
          sequentialSeed(modelsSeedsArray, key, appModel, afterFunction)
        }
      });
  }

  var Seeders = [
    seedRoles,
    seedUploadContainers,
    seedSubjects,
    seedTemplateTypes,
    seedSepObjectives,
    seedSkills,
    seedParcialProductsTypes,
    seedTemplateTopics,
    seedEventTypes,
    seedTeamRoles,
    seedStrategyStatuses,
    seedEvaluationTypes,
    SynchronizeSchoolIdOfStudentsGroups,
    SynchronizeSchoolIdOfStrategyGroups,
    SynchronizeSchoolIdOfTemplateTopics
  ]

  // Migrate
  var migrateAndUpdate = function () {
    // set datdsource listeners to prevent memory leaks
    const numModels = Object.keys(app.models).length
    for (let dataSource of Object.values(app.dataSources)) {
      dataSource.setMaxListeners(numModels)
    }
    // get database to seed
    var db = app.dataSources.mysqlDev;
    var appModels = Object.keys(db.connector._models)
    // check if database is up to date with models
    db.isActual(appModels, function (err, actual) {
      if (!actual) {
        db.autoupdate(appModels, function (err, result) {
          if (err) throw err;
          console.log("Updated Models: " + appModels.join() + " Seeding...")
          Seeders.forEach(seeder => seeder())
          RecursiveUserPolicyNodeSeeder()
        });
      } else {
        console.log("Already Up to date, Seeding...")
        Seeders.forEach(seeder => seeder())
        RecursiveUserPolicyNodeSeeder()
      }
    });
  }

  migrateAndUpdate()

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ SEEDER PERMISOS +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  var userPermissionPolicyNodes = [
    //+++++++++++DASHBOARD+++++++++++
    {
      key : "dashboard",
      name : "Página principal",
      children : [
        {
          key : "Events",
          name : "Ver eventos"
        }
      ]
    }
  ]

  var RecursiveUserPolicyNodeSeeder = function() {
    let UserPermissionPolicyNode = app.models.UserPermissionPolicyNode

    console.log(`Seeding model ${UserPermissionPolicyNode.modelName}...`)

    let seedUserPolicyNode = function(node) {

      
      let preparedNode = {
        key : node.key,
        name : node.name,
        parentId : node.parentId
      }

      //console.log(`SEEDING ${preparedNode.key} of parent ${preparedNode.parentId}`)
      
      isNodeAlreadySeeded(preparedNode, function(err, isSeeded) {
        if (err) throw err;

        if (isSeeded) {
          //console.log(`ALREADYSEEDED ${preparedNode.key} of parent ${preparedNode.parentId}`)
          return
        }
        
        UserPermissionPolicyNode.create(preparedNode, function(err, UserPermissionPolicyNode) {
          if (err) throw err;
  
          //console.log(`SEEDED ${UserPermissionPolicyNode.key} of parent ${UserPermissionPolicyNode.parentId}`)
          if( Array.isArray(node.children) ) {
            for(let innerNode of node.children) {
              innerNode.parentId = UserPermissionPolicyNode.id
              //console.log(`CHILD ${innerNode.key} of parent ${innerNode.parentId}`)
              seedUserPolicyNode(innerNode)
            }
          }
        })
      })      
    }

    let isNodeAlreadySeeded = function(node, callback) {
      let filter = {
        where : {
          key : node.key,
          parentId : node.parentId
        }
      }

      UserPermissionPolicyNode.findOne(filter, function(err, existingNode) {
        if(err) return callback(err)

        return callback(null, existingNode != null)
      })
    }
    
    userPermissionPolicyNodes.forEach(seedUserPolicyNode)
  }
};
