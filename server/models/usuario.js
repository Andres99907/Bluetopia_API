'use strict';
var disableRelationMethods = require('../model-methods-helper').disableRelationMethods;
var uuidV4 = require('uuid/v4');
var loopback = require('loopback');
var path = require('path');

module.exports = function(Usuario) {
    var app = require('../../server/server');
    disableRelationMethods(Usuario);

    delete Usuario.validations.username;
    Usuario.testPush = function(callback) {
        // Enviar push
        var notificacion = this.app.models.Notification;
        var res = notificacion.p('SuperUser', {
            title: 'titulo de prueba',
            tag: 'tag1',
            content: 'un push de prueba se ha enviado para revisar que todo este bien',
            link: notificacion.baseURL + '/inicio',
            'image': 'https://scontent.fgdl4-1.fna.fbcdn.net/v/t1.0-9/50728512_2110076052393262_3123088630382329856_o.png?_nc_cat=103&_nc_ht=scontent.fgdl4-1.fna&oh=045b806a600cd3dc959b54ae1e739d73&oe=5D2B7633',
        });
        //    var res = notificacion.setByRoleNotification("admin",{title:"Push prueba3", content:"Animo!!",link:"http://localhost:4200/#/inicio/administrador/tickets/1","image":"http://elvwdetuvida.com.mx/img/decada/highlights/d70s/icon-historias-volkswagen-aniversario-h-16.svg"});
        callback(null, res);
    };

    Usuario.findByRole = function(role, includes = null, callback) {
        var RoleMapping = app.models.RoleMapping;
        var Role = app.models.Role;
        Role.findOne({ where: { name: role } }, function(err, DBrole) {
            if (err) return callback(err);

            RoleMapping.find({ where: { roleId: DBrole.id } }, function(err, roles) {
                if (err) return callback(err);

                var query = { include: [], where: { or: [] } };
                if (includes.hasOwnProperty('length') && includes.length > 0) {
                    includes.forEach(i => {
                        query.include.push({
                            relation: i,
                        });
                    });
                }
                roles.forEach(r => {
                    query.where.or.push({
                        id: r.principalId,
                    });
                });
                Usuario.find(query, function(err, DBusers) {
                    if (err) return callback(err);

                    callback(null, DBusers);
                });
            });
        });
    };

    Usuario.newUseWithRole = function(user, role, callback) {
        var RoleMapping = app.models.RoleMapping;
        var Role = app.models.Role;

        Usuario.create(user, function(err, newU) {
            if (err) return callback(err);

            Role.findOne({
                where: {
                    name: role,
                },
            }, function(err, role) {
                if (err) return callback(err);

                role.principals.create({
                    principalType: RoleMapping.USER,
                    principalId: newU.id,
                }, function(err, principal) {
                    if (err) callback(err);

                    callback(null, newU);
                });
            });
        });
    };

    Usuario.RegisterUser = function(user, userData, role, callback) {
        var RoleMapping = app.models.RoleMapping;
        var Role = app.models.Role;

        Role.findOne({
            where: {
                or: [{ name: { like: `${role}` } }, { description: { like: `${role}` } }],
            },
        }, (err, role) => {
            if (err) return callback(err);

            if (!role) return callback('Role not specified');
            if (!!userData && !!userData.username) user.username = userData.username;
            if (role.name == 'School' && !!userData.school) userData.school.isActive = true;
            Usuario.app.models.School.CreateOne(!!userData ? userData.school : null, (err, newSchool) => {
                if (err) return callback(err);

                if (!user.schoolId && !!newSchool) user.schoolId = newSchool.id;
                Usuario.create(user, (err, newU) => {
                    if (err) return callback(err);

                    role.principals.create({
                        principalType: RoleMapping.USER,
                        principalId: newU.id,
                    }, function(err, principal) {
                        if (err) callback(err);

                        if (userData) {
                            userData.userId = newU.id;
                            if (role.name == 'School') newSchool.schoolUserId = newU.id;
                            Usuario.app.models.School.upsert(newSchool, (err, schoolUpdate) => {
                                if (err) callback(err);
                                Usuario.app.models.UserData.create(userData, (err, newUserData) => {
                                    if (err) {
                                        newU.destroy((err2, destroyed) => {
                                            if (err2) return callback(err2);
                                            return callback(err);
                                        });
                                    }

                                    Usuario.app.models.Teacher.ChangeSchoolId(userData.teacherIdToAbsorb, newU.id, (err, teacherUpdated) => {
                                        if (err) callback(err);

                                        if (role.name == 'Teacher') {
                                            let teacher = {
                                                name: userData.username,
                                                email: userData.email,
                                                active: true,
                                                userId: newU.id,
                                                schoolId: newU.schoolId,
                                                subjects: []
                                            }
                                            Usuario.app.models.Teacher.AddTeacher(teacher, (err, newTeacher) => {
                                                if (err) callback(err);

                                                return callback(null, newU);
                                            });
                                        } else return callback(null, newU);
                                    });
                                })
                            });
                        } else {
                            if (role.name == 'Student') {
                                Usuario.app.models.Student.findById(user.studentId, (err, student) => {
                                    if (err) {
                                        newU.destroy((err2, destroyed) => {
                                            return callback(err);
                                        });
                                    }
                                    student.userId = newU.id;
                                    student.save((err, saved) => {
                                        if (err) {
                                            newU.destroy((err2, destroyed) => {
                                                return callback(err);
                                            });
                                        }
                                        callback(null, newU);
                                    });
                                });
                            } else callback(null, newU);
                        }
                    });
                });
            });
        });
    }

    /**
     * Gets an user with his credentials
     * @param {object} ctx Current Context
     * @param {Function(Error, object)} callback
     */
    Usuario.userWithCredentials = function(ctx, callback) {
        if (!ctx.accessToken) return callback('User not logged in!');

        var userWithCredentials;
        var id = ctx.accessToken.userId;
        var RoleMapping = app.models.RoleMapping;
        var Role = app.models.Role;

        Usuario.findOne({
            where: {
                id,
            },
            include: ['data', 'school', 'student']
        }, function(error, user) {
            if (error) return callback(error, 'Error On User');

            RoleMapping.find({
                where: {
                    principalType: 'USER',
                    principalId: id,
                },
            }, function(error, roleM) {
                if (error) return callback(error);

                Role.findOne({
                    where: {
                        id: roleM[0].roleId,
                    },
                }, function(error, role) {
                    if (error) return callback(error);

                    user.role = role;
                    userWithCredentials = user;

                    if (role.name == 'SuperUser') {
                        // TODO
                        return callback(null, userWithCredentials);
                    } else {
                        userWithCredentials.loadUserData(function(err, UWC) {
                            if (err) return callback(err);
                            UWC.role = role;
                            callback(err, UWC);
                        });
                    }
                });
            });
        });
    };

    Usuario.CreateNew = function(newUser, callback) {
        var Role = app.models.Role;
        var RoleMapping = app.models.RoleMapping;

        if (!newUser.type) newUser.type = 'User';
        Usuario.findOne({
            where: {
                or: [
                    { email: newUser.email },
                    { username: newUser.username },
                ],
            },
        }, function(err, userWR) {
            if (err) return callback(err);
            if (userWR) return callback('Nombre de usuario o correo inválido');

            newUser.verificationToken = uuidV4();
            Usuario.create(newUser, function(err, user) {
                if (err) return callback(err);
                Role.find({
                    where: {
                        name: newUser.type,
                    },
                }, function(err, res) {
                    if (err) return callback(err);
                    var role = res[0];

                    role.principals.create({
                        principalType: RoleMapping.USER,
                        principalId: user.id,
                    }, function(err, principal) {
                        if (err) throw err;

                        return callback(null, user);
                    });
                });
            });
        });
    };

    /**
     * registers a new user with a profile picture
     * @param {object} newUser new User object to be stored
     * @param {Function(Error, object)} callback
     */

    Usuario.register = function(newUser, callback) {
        Usuario.CreateNew(newUser, (error, createdUser) => {
            if (error) return callback(error);

            Usuario.login(newUser, (err, accessToken) => {
                if (err) return callback(err);
                return callback(null, accessToken);
            });
        });
    };

    /**
     * registers a new user and send verification email
     * @param {object} newUser new User object to be stored
     * @param {Function(Error, object)} callback
     */

    Usuario.RegisterWithEmailVerification = function(newUser, callback) {
        Usuario.app.models.adminMail.CheckDomainAvailability(newUser.email.split('@')[1], (err, domainValid) => {
            if (err) return callback(err);
            if (domainValid) {
                Usuario.CreateNew(newUser, (error, createdUser) => {
                    var emailData = {};
                    emailData.email = createdUser.email;
                    emailData.username = createdUser.username;
                    emailData.path = require('../helpers/constants').hostURL + 'verificacion/' + createdUser.verificationToken;

                    var renderer = loopback.template(path.resolve(__dirname, '../emails/email-verification.ejs'));
                    var html_body = renderer(emailData);

                    Usuario.app.models.adminMail.send({
                        to: createdUser.email,
                        from: 'testmail@jarabesoft.com',
                        subject: 'Confirmación de correo electrónico',
                        html: html_body,
                    }, function(err, res) {
                        if (err) return callback(err);

                        return callback(null, { email: createdUser.email });
                    });
                });
            } else {
                return callback('Dominio no valido');
            }
        });
    };

    /**
     * Verify user email
     * @param {string} Verification code
     * @param {Function(Error, boolean)} callback
     */

    Usuario.VerifyEmail = function(code, callback) {
        let filter = {
            where: {
                verificationToken: code,
            },
        };

        let errorMsg = 'Ocurrió un error al verificar correo electrónico';
        Usuario.findOne(filter, (err, userDB) => {
            if (err) {
                console.error(err);
                return callback(errorMsg);
            }

            if (!userDB) return callback(errorMsg);

            userDB.updateAttributes({ emailVerified: true }, (err, userVerified) => {
                if (err) {
                    console.error(err);
                    return callback(errorMsg);
                }

                return callback(null, true);
            });
        });
    };

    /**
     * registers a new user with a profile picture
     * @param {object} newUser new User object to be stored
     * @param {Function(Error, object)} callback
     */
    Usuario.registerAdmins = function(newUser, callback) {
        var Role = app.models.Role;
        var RoleMapping = app.models.RoleMapping;
        Usuario.create(newUser, function(err, user) {
            if (err) return callback(err);
            Role.find({
                where: {
                    name: 'Admin',
                },
            }, function(err, res) {
                if (err) return callback(err);
                var role = res[0];
                role.principals.create({
                    principalType: RoleMapping.USER,
                    principalId: user.id,
                }, function(err, principal) {
                    if (err) throw err;

                    if (!newUser.profileImage)
                        return callback(null, user);

                    var profileImage = {
                        encodedFileContainer: 'profileImages',
                        base64File: newUser.profileImage.base64File,
                        fileExtention: newUser.profileImage.fileExtention,
                    };

                    app.models.Upload.newBase64File(profileImage, function(err, img) {
                        if (err) return callback(err);
                        user.profileImage(img);

                        Usuario.upsert(user, function(err, updatedUser) {
                            if (err) return callback(err);
                            Usuario.find({
                                where: {
                                    id: updatedUser.id,
                                },
                            }, function(err, userWR) {
                                if (err) return callback(err);
                                callback(null, userWR);
                            });
                        });
                    });
                });
            });
        });
    };

    /**
     * changes the user's profile image for a new one
     * @param {object} newImage new image in base 64
     * @param {Function(Error, object)} callback
     */
    Usuario.prototype.changeProfileImage = function(newImage, callback) {
        var Upload = app.models.Upload;
        var actual = this;

        // TODO
        var newProfileImage = {
            encodedFileContainer: 'profileImages',
            name: newImage.name,
            resize: newImage.resize,
            base64File: newImage.base64File,
            fileExtention: newImage.fileExtention,
        };
        Upload.replaceFileBase64File(actual.profileImageId, newProfileImage, function(err, res) {
            if (err) return callback(err);

            actual.profileImage(res);
            Usuario.upsert(actual, function(err, updatedUser) {
                if (err) return callback(err);
                Usuario.findOne({
                    where: {
                        id: updatedUser.id,
                    },
                }, function(err, userWR) {
                    if (err) return callback(err);
                    callback(null, userWR);
                });
            });
        });
    };

    /**
     * updates a user's push token
     * @param {object} data token to be saved
     * @param {Function(Error)} callback
     */

    Usuario.prototype.updatePushToken = function(data, callback) {
        let PushTokens = Usuario.app.models.PushTokens;
        let actual = this;
        // TODO
        if (!data.token.id) {
            return callback('Invalid data');
        }
        PushTokens.findById(data.token.id, function(err, existing) {
            if (err) return callback(err);
            if (existing) { return callback(null, true); }
            let newToken = {
                id: data.token.id,
                usuarioId: actual.id,
                mobile: data.token.isMobile,
            };
            PushTokens.create(newToken, function(err, res) {
                if (err) return callback(err);

                return callback(null, true);
            });
        });
    };

    /**
     * updates a user's push token
     * @param {object} data token to be saved
     * @param {Function(Error)} callback
     */

    Usuario.deletePushToken = function(token, callback) {
        let PushTokens = Usuario.app.models.PushTokens;

        PushTokens.findById(token, function(err, res) {
            if (err) return callback(err);

            if (!res) { return callback(null, true); }
            PushTokens.destroyById(token, function(err, res) {
                if (err) return callback(err);

                return callback(null, true);
            });
        });
    };

    /**
     * Deletes push tokens before logout
     * @param {object} body token to be saved
     * @param {Function(Error)} callback
     */
    // Usuario.beforeRemote('logout', function(context, callback) {
    //     Usuario.find({where: {id : context.req.accessToken.userId}}, function(err, usuario) {
    //         if(err) return callback(err)

    //         if(context.req.body.tokens){
    //           context.req.body.tokens.forEach(token => {
    //               let body = { token : token }
    //               console.log("BODY", body)

    //               usuario.deletePushToken(body, null)
    //           });
    //         }
    //     })
    // });

    /**
     * gives all the roles
     *
     */

    Usuario.getRoles = function(callback) {
        var Role = app.models.Role;

        Role.find({
            where: {
                name: { neq: 'SuperUser' },
            },
        }, function(err, res) {
            if (err) return callback(null);

            return callback(null, res);
        });
    };

    // =================================================================================================================
    //    LOGIN
    // =================================================================================================================

    /**
     * [Endpoint] Login if user is active
     * @param {object} credentials {email, password}
     * @param {Function(Error)} callback
     */

    Usuario.loginIfActive = function(credentials, callback) {
        let where = {
            or: [{
                    and: [
                        { email: { neq: null } },
                        { email: credentials.email },
                    ]
                },
                {
                    and: [
                        { username: credentials.email },
                    ]
                },
            ]
        }
        Usuario.findOne({ where }, function(err, userFound) {
            if (err) return callback(err);

            if (!userFound) {
                return callback('Usuario no registrado');
            } else {
                if (userFound.active == null) {
                    userFound.active = true;
                    Usuario.upsert(userFound, function(err, res) {
                        if (err) return callback(err);
                    });
                }
                if (userFound.active == false) {
                    return callback('Error con la cuenta. Contacta al administrador');
                }
            }

            if (!userFound.email) {
                credentials.username = credentials.email;
                delete credentials.email;
            }
            Usuario.login(credentials, function(err, accessToken) {
                if (err) return callback(err);

                callback(null, accessToken);
            });
        });
    };

    /**
     * log the user by social media token
     * @param {object} user user to login
     * @param {Function(Error, object)} callback
     */

    Usuario.loginBySocialMedia = function(user, callback) {
        let mediaImage = { email: user.email, socialMediaId: user.socialMediaId };
        let mediaFilter = {};
        // TODO
        switch (user.loginType) {
            case 'Facebook':
                mediaFilter = {
                    where: {
                        FBToken: user.token,
                    },
                };
                break;
            case 'Google':
                mediaFilter = {
                    where: {
                        GToken: user.token,
                    },
                };
                break;
            case 'Apple':
                mediaFilter = {
                    where: {
                        AppleToken: user.token,
                    },
                };
                break;
            default:
                return callback('Undefined token type', null);
                break;
        }

        Usuario.findOne(mediaFilter, function(err, res) {
            if (err) return callback(err, null);

            if (res) {
                // console.log('Found user with that key')
                res.createAccessToken(-1, function(err, token) {
                    if (err) return callback(err, null);
                    if (user.loginType == 'Facebook') {
                        Usuario.setProfilePictureFromSocialMedia(mediaImage, (err, res) => {});
                    }
                    callback(null, token);
                });
            } else {
                // Si el key no se encuentra entre los usuarios , revisa el correo,
                Usuario.findOne({
                    where: {
                        email: user.email,
                    },
                }, function(err, userWithEmail) {
                    if (err) return callback(err, null);

                    // si el correo ya existe le asigna el key a esa cuenta,
                    // si el correo no existe dentro de usuarios, crea un nuevo usuario y le asigna el key
                    if (userWithEmail) {
                        switch (user.loginType) {
                            case 'Facebook':
                                userWithEmail.FBToken = user.token;
                                break;
                            case 'Google':
                                userWithEmail.GToken = user.token;
                                break;
                            case 'Apple':
                                userWithEmail.AppleToken = user.token;
                                break;
                            default:
                                return callback('Undefined token type', null);
                                break;
                        }

                        Usuario.upsert(userWithEmail, function(err, updatedUser) {
                            if (err) return callback(err);

                            updatedUser.createAccessToken(-1, function(err, token) {
                                if (err) return callback(err, null);
                                if (user.loginType == 'Facebook') {
                                    Usuario.setProfilePictureFromSocialMedia(mediaImage, (err, res) => {});
                                }
                                callback(null, token);
                            });
                        });
                    } else {
                        user.password = Math.random().toString(36).slice(-8);
                        // console.log('Creating user with that key')
                        switch (user.loginType) {
                            case 'Facebook':
                                user.FBToken = user.token;
                                break;
                            case 'Google':
                                user.GToken = user.token;
                                break;
                            default:
                                return callback('Undefined token type', null);
                                break;
                        }

                        Usuario.register(user, function(err, userWR) {
                            if (err) return callback(err);

                            userWR.createAccessToken(-1, function(err, token) {
                                if (err) return callback(err, null);
                                if (user.loginType == 'Facebook') {
                                    Usuario.setProfilePictureFromSocialMedia(mediaImage, (err, res) => {});
                                }
                                callback(null, token);
                            });
                        });
                    }
                });
            }
        });
    };

    /**
     * [Endpoint] Gets list of users
     * @param {object} ctx Current context
     * @param {Function(Error, object)} callback
     */
    Usuario.getAnyUsers = function(ctx, callback) {
        let filter = {
            where: {
                // or: [{roleId: 2}, {roleId: 1}],
            },
        };

        Usuario.app.models.RoleMapping.find(filter, function(err, roles) {
            if (err) return callback(err);

            var query = {
                where: { or: [] },
                include: [
                    'userPermissions',
                ],
            };

            roles.forEach(r => {
                query.where.or.push({
                    id: r.principalId,
                });
            });
            Usuario.find(query, function(err, DBusers) {
                if (err) return callback(err);

                return callback(null, DBusers);
            });
        });
    };

    /**
     * Update a user
     * @param {object} ctx context object
     * @param {object} updtUser object of staff to update
     * @param {Function(Error)} callback
     */
    Usuario.prototype.updateAnyUser = function(ctx, updtUser, callback) {
        var _this = this;
        Usuario.getAnyUsers(ctx, function(err, users) {
            if (err) return callback(err);

            if (!users.find(elem => elem.id == updtUser.id)) {
                return callback('What are you doing?...');
            }

            _this.changeAttributesAndEraseTokensIfUserIsInactive(updtUser, function(err, erasedTokens) {
                if (err) return callback(err);

                Usuario.app.models.UserPermissionPolicyRelation.updateAnyPermissions(updtUser.permissionNodeIds, updtUser.id, function(err, res) {
                    if (err) return callback(err);

                    if (updtUser.profileImage && updtUser.hasChangedProfileImage) {
                        res.updatedUser.changeMyProfileImage(updtUser.profileImage, function(err, updatedUser) {
                            if (err) return callback(err);

                            Usuario.getAnyUsers(ctx, function(err, users) {
                                if (err) return callback(err);

                                return callback(null, users);
                            });
                        });
                    } else {
                        Usuario.getAnyUsers(ctx, function(err, users) {
                            if (err) return callback(err);

                            return callback(null, users);
                        });
                    }
                });
            });
        });
    };

    Usuario.prototype.changeAttributesAndEraseTokensIfUserIsInactive = function(updtUser, callback) {
        var _this = this;

        _this.updateAttributes(updtUser, function(err, updatedUser) {
            if (err) return callback(err);

            if (!updatedUser.active) {
                Usuario.app.models.UsuarioAccessToken.destroyAll({ userId: updatedUser.id }, function(err, info) {
                    if (err) return callback(err);

                    callback(null, info.count);
                });
            } else {
                callback(null, 0);
            }
        });
    };

    /**
     * changes the user's profile image for a new one
     * @param {object} newImage new image in base 64
     * @param {Function(Error, object)} callback
     */

    Usuario.prototype.changeMyProfileImage = function(profileImage, callback) {
        if (!profileImage) return callback(null, this);

        const Upload = Usuario.app.models.Upload;
        const newProfileImage = {
            encodedFileContainer: 'profileImages',
            name: profileImage.name,
            resize: profileImage.resize,
            base64File: profileImage.base64File,
            fileExtention: profileImage.fileExtention,
        };
        Upload.replaceFileBase64File(this.profileImageId, newProfileImage, (err, res) => {
            if (err) return callback(err);

            this.profileImage(res);
            Usuario.upsert(this, (err, updatedUser) => {
                if (err) return callback(err);

                Usuario.findOne({ where: { id: updatedUser.id } }, (err, userWR) => {
                    if (err) return callback(err);
                    callback(null, userWR);
                });
            });
        });
    };

    /**
     * [Endpoint] Update admin password
     * @param {object} ctx context object
     * @param {object} data {userId, newPassword}
     * @param {Function(Error)} callback
     */
    Usuario.changeAnyPassword = function(ctx, data, callback) {
        Usuario.getAnyUsers(ctx, function(err, users) {
            if (err) return callback(err);

            if (!users.find(elem => elem.id == data.userId)) {
                return callback('What are you doing?...');
            }

            Usuario.setPassword(data.userId, data.newPassword, function(err) {
                if (err) return callback(err);

                callback(null, 'success');
            });
        });
    };

    Usuario.prototype.loadUserData = function(callback) {
        let userWithCredentials = this;
        let permissionsFilter = {};

        userWithCredentials.userPermissions(permissionsFilter, function(err, userPermissions) {
            if (err) return callback(err);

            Usuario.app.models.UserPermissionPolicyNode.preselectNodes(userPermissions, function(err, parsedUserPermissions) {
                if (err) return callback(err);

                // userWithCredentials.permissions = parsedUserPermissions;
                return callback(null, userWithCredentials);
            });
        });
    };

    Usuario.setProfilePictureFromSocialMedia = function(data, callback) {
        Usuario.findOne({ where: { email: data.email } }, function(err, usr) {
            if (err) {
                console.log('ERROR: ' + err);
                return callback(err);
            }

            if (!usr.profileImageId) {
                console.log('Usuario de social media sin foto de perfil');
                var imageId = uuidV4();
                app.models.UploadedFiles.create({ id: imageId, name: 'FacebookProfileImage', resize: false, URL: `https://graph.facebook.com/${data.socialMediaId}/picture?width=600&height=600` }, function(err, res) {
                    if (err) return callback(err);
                    let newUser = { profileImageId: res.id };
                    usr.updateAttributes(newUser, function(err, updated) {
                        if (err) return callback(err);
                        callback(null, updated);
                    });
                });
            }
        });
    };

    Usuario.prototype.UpdateProfile = function(newInformation, callback) {
        this.hasPassword(newInformation.password, (err, isMatch) => {
            if (err) return callback(err);

            const emailChanged = newInformation.email != this.email;
            if (emailChanged && !isMatch)
                return callback('Passwords do not match');

            this.changeMyProfileImage(newInformation.profileImage, (err, updatedUser) => {
                if (err) return callback(err);

                newInformation.name = newInformation.username;
                updatedUser.ChangeEmailAndUsername(newInformation, (err, userUpdated) => {
                    if (err) return callback(err);

                    if (emailChanged) {
                        Usuario.login(newInformation, function(err, accessToken) {
                            if (err) return callback(err);

                            return callback(null, accessToken);
                        });
                    } else {
                        return callback(null, {});
                    }
                });
            });
        });
    };

    Usuario.prototype.ChangeEmailAndUsername = function(newInformation, callback) {
        Usuario.findOne({
            where: {
                or: [
                    { email: newInformation.email },
                    { username: newInformation.name },
                ],
            }
        }, (err, user) => {
            if (err)
                return callback(err);
            if (user && user.id != this.id) {
                if (user.email == newInformation.email)
                    return callback('Este correo ya existe.');
                if (user.username == newInformation.name)
                    return callback('Este usuario ya existe.');
            }

            this.email = newInformation.email;
            this.username = newInformation.name;
            this.phone = newInformation.phone;
            this.save((err, userUpdated) => {
                if (err) return callback(err);
                return callback(null, userUpdated);
            });
        });
    };

    Usuario.GetFileLibrary = function(ctx, schoolId, callback) {
        const userId = ctx.accessToken.userId;
        Usuario.app.models.RoleMapping.findOne({
            where: {
                principalId: userId
            },
            include: 'role'
        }, (err, roleMapping) => {
            if (err) return callback(err);

            if (roleMapping.role().name == 'School') {
                Usuario.find({
                    where: {
                        schoolId: schoolId
                    }
                }, (err, userTeachersOfSchool) => {
                    if (err) return callback(err);

                    Usuario.app.models.UploadedFiles.find({
                        where: {
                            or: [
                                { userId: { inq: userTeachersOfSchool.map(user => user.id) } },
                                { userId }
                            ]
                        }
                    }, (err, files) => {
                        if (err) return callback(err);
                        return callback(null, files);
                    });
                });
            } else {
                Usuario.app.models.UploadedFiles.find({
                    where: {
                        userId
                    }
                }, (err, files) => {
                    if (err) return callback(err);
                    return callback(null, files);
                });
            }
        });
    }

    Usuario.IsUsernameDuplicated = function(user, cb) {
        let filter = {
            where: {
                username: { like: `${user}` }
            }
        }
        Usuario.findOne(filter, (err, user) => {
            if (err) return cb(err);
            return cb(null, user === null ? false : true);
        });
    }

    Usuario.SchoolByUsuario = function(usuerId, callback) {
        Usuario.findOne({
            where: { id: Number(usuerId) },
            include: ['school']
        }, (err, user) => {
            user = JSON.parse(JSON.stringify(user))
            let school = user ? user.school : null
            return callback(null, school)
        })
    }


};
