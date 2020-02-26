const MongoClient = require('mongodb').MongoClient;
const config = require("./Config");

/**
 * Colecciones:
 * codigoRecuperacion:{
 *      _id:email, 
 *      codigo:999999, 
 *      time:long
 * }
 * usuario:{
 *      _id:email,
 *      pwd:string (hash),
 *      nombre:string,
 *      bloqueado:bool,
 *      descripcionPerfil:string,
 *      config:{}
 * }
 * sesionUsuario:{
 *      _id:string (token),
 *      email:email,
 *      tiempoInicio:long,
 *      tiempoUltimaActividad:long
 * }
 */


class MongoDB {
    static instance() {
        if (MongoDB.singleton) return MongoDB.singleton;
        MongoDB.singleton = new MongoDB();
        return MongoDB.singleton;
    }

    constructor() {
        this.client = null;
        this.databaseURL = process.env.MONGO_URL || config.getConfig().mongoDB.url;
        this.databaseName = process.env.MONGO_DATABASE || config.getConfig().mongoDB.database;
        this.db = null;
    }
    get connected() {return this.client?true:false}

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async init() {
        try {
            this.client = new MongoClient(this.databaseURL, {useNewUrlParser:true, useUnifiedTopology:true});
            await this.client.connect();
            this.db = this.client.db(this.databaseName); 
            // Creación de Indices
            let colSesionUsuario = await this.collection("usuario");
            colSesionUsuario.createIndex({email:1});
            // Inicializar demonios
            this.callDemonioRemueve(1000);
        } catch(error) {
            console.error("[MongoDB] Cannot connect to Database '" + this.databaseName + "'");
            console.error(error);            
        }
    }

    collection(name) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject("MongoDB connection to '" + this.databaseName + "' not initialized");
                return;
            }
            this.db.collection(name, (err, col) => {
                if (err) reject(err);
                else resolve(col);
            });
        });
    }

    callDemonioRemueve(ms) {
        if (this.timerDemonioRemueve) {
            clearTimeout(this.timerDemonioRemueve);
        }
        this.timerDemonioRemueve = setTimeout(_ => this.demonioRemueve(), ms || 60000);
    }

    async demonioRemueve() {
        try {
            // codigoRegistro
            let col = await this.collection("codigoRecuperacion");
            let tiempoCorte = Date.now() - 1000 * 60 * 10;
            await col.deleteMany({time:{$lt:tiempoCorte}});
        } catch(error) {
            console.error(error);
        } finally {
            this.callDemonioRemueve()
        }
    }
}

module.exports = MongoDB.instance();