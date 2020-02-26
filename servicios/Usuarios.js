const ZModule = require("./z-server").ZModule;
const mongo = require("./MongoDB");
const emailValidador = require("email-validator");
const mailer = require("./Mailer");
const bcrypt = require('bcryptjs');

class Usuarios extends ZModule {
    static get instance() {
        if (Usuarios._singleton) return Usuarios._singleton;
        Usuarios._singleton = new Usuarios();
        return Usuarios._singleton;
    }

    getCodigoRandom() {
        let codigo = "";
        for (let i=0; i<6; i++) {
            codigo += "" + parseInt(Math.random() * 10);
        }
        return codigo;
    }
    encript(pwd) {
        return new Promise((onOk, onError) => {
            bcrypt.hash(pwd, 8, (err, hash) => {
                if (err) onError(err);
                else onOk(hash);
            });
        });
    }

    async compareWithEncripted(pwd, hash) {
        return await bcrypt.compare(pwd, hash);
    }

    generateRandomToken(length = 60, soloNumeros = false) {
        const chars = "0123456789abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ-=.,;#$%&/()";
        const nums = "0123456789";
        let token = "";
        while (token.length < length) {
            if (!soloNumeros) {
                token += chars.charAt(parseInt(Math.random() * chars.length));
            } else {
                token += nums.charAt(parseInt(Math.random() * nums.length));
            }
        }
        return token;
    }

    async getUsuarioBasico(email) {
        try {
            let col = await mongo.collection("usuario");
            let doc = await col.findOne({_id:email}, {_id:1, nombre:1, bloqueado:1});
            if (!doc) return null;
            return {email:doc._id, nombre:doc.nombre, bloqueado:doc.bloqueado}
        } catch(error) {
            throw error;
        }
    }
    
    async iniciaRegistro(email, nombre) {
        try {            
            if (!email) throw "Debe ingresar su dirección de correo electrónico";
            if (!nombre) throw "Debe ingresar su nombre para registrarse";
            if (!emailValidador.validate(email)) throw "La dirección ingresada es inválida";
            let u = await this.getUsuarioBasico(email);
            if (u) throw "Ya existe un usuario registrado con el mismo email. Puede usar la opción 'Olvidé mi Contraseña' para crear una nueva."
            let col = await mongo.collection("codigoRecuperacion");
            await col.deleteMany({_id:email});
            let codigo = this.getCodigoRandom();
            await col.insertOne({_id:email, nombre:nombre, codigo:codigo});
            let html = `
                <html>
                    <body>
                        <p>
                            Se está intentando crear una cuenta de usuario en Geoportal usando su dirección de correo electrónico.
                            Si usted no lo ha solicitado, sólo ignore este correo.
                        </p>
                        <p>
                            Para continuar la creación de la cuenta, ingrese el siguiente código en la página que lo solicita:
                        </p>
                        <h2>${codigo}</h2>
                        <hr />
                        <i>Este es un correo automático generado por Geoportal. Por favor no lo responda.</i>
                    </body>
                </html>
            `;
            await mailer.sendMail(email, "Geoportal - Código para creación de Cuenta de Usuario", null, html);
        } catch(error) {
            throw error;
        }
    }

    async finalizaRegistro(email, codigo, pwd) {
        try {
            let col = await mongo.collection("codigoRecuperacion");
            let doc = await col.findOne({_id:email});
            if (!doc) throw "No hay un código de creación de cuenta activo para el email ingresado. Recuerde que éstos tienen una validez de 10 minutos. Inicie el proceso de creación de cuenta de usuario nuevamente.";
            if (codigo != doc.codigo) throw "El código ingresado es inválido. Recuerde que éstos tienen una validez de 10 minutos. Inicie el proceso de creación de cuenta de usuario nuevamente.";
            await col.deleteOne({_id:email});
            let u = await this.getUsuarioBasico(email);
            if (u) throw "Ya existe un usuario registrado con el mismo email. Puede usar la opción 'Olvidé mi Contraseña' para crear una nueva."
            let colUsuario = await mongo.collection("usuario");
            let hash = await this.encript(pwd);
            await colUsuario.insertOne({_id:email, nombre:doc.nombre, bloqueado:false, pwd:hash, config:{}})
        } catch(error) {
            throw error;
        }
    } 

    async getSesionUsuario(token) {
        try {
            let colSesionUsuaro = await mongo.collection("sesionUsuario");
            let doc = await colSesionUsuaro.findOne({_id:token});
            if (!doc) return null;
            return {
                token:doc._id, email:doc.email, tiempoInicio:doc.tiempoInicio, tiempoUltimaActividad:doc.tiempoUltimaActividad
            }
        } catch(error) {
            throw error;
        }
    }
    async pingSesionUsuario(token) {
        try {
            let colSesionUsuaro = await mongo.collection("sesionUsuario");
            let ahora = Date.now();
            let ret = await colSesionUsuaro.updateOne({_id:token}, {$set:{tiempoUltimaActividad:ahora}});
            return ret.matchedCount?true:false;
        } catch(error) {
            throw error;
        }
    }
    async login(email, pwd) {
        try {
            const mensajeError = "Email o contraseña inválidos";
            let colUsuario = await mongo.collection("usuario");
            let doc = await colUsuario.findOne({_id:email}, {pwd:1});
            if (!doc) throw mensajeError;
            let hash = doc.pwd;
            let valido = await this.compareWithEncripted(pwd, hash);
            if (!valido) throw mensajeError;
            let colSesionUsuaro = await mongo.collection("sesionUsuario");
            doc = await colSesionUsuaro.findOne({email:email}, {_id:1});
            let token;
            if (doc) {
                token = doc._id;
                await this.pingSesionUsuario(token);
            } else {
                token = this.generateRandomToken();
                let ahora = Date.now();
                await colSesionUsuaro.insertOne({_id:token, email:email, tiempoInicio:ahora, tiempoUltimaActividad:ahora});
            }
            return await this.getSesionUsuario(token);
        } catch(error) {
            throw error;
        }
    }

    async autoLogin(token) {
        try {
            let valido = await this.pingSesionUsuario(token);
            if (!valido) return null;
            return await this.getSesionUsuario(token);
        } catch(error) {
            throw error;
        }
    }

    async getPerfil(email) {
        try {
            let colUsuario = await mongo.collection("usuario");
            let doc = await colUsuario.findOne({_id:email});
            if (!doc) return null;
            return {
                email:email,
                nombre:doc.nombre,
                tieneFoto:false,
                descripcionPerfil:doc.descripcionPerfil
            }
        } catch(error) {
            throw error;
        }
    }
}

module.exports = Usuarios.instance;