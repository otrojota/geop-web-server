global.confPath = process.argv.length > 2?process.argv[2]:__dirname + "/config.json";
const config = require("./servicios/Config");

function base64MimeType(encoded) {
    let result = null;
    if (typeof encoded !== 'string') return null;
    let mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (mime && mime.length) return mime[1];
    return null;
  }

async function createHTTPServer() {
    const zServer = require("./servicios/z-server");
    const express = require('express');
	const app = express();
    const bodyParser = require('body-parser');
    const http = require('http');
    const conf = config.getConfig();
    const places = require("./servicios/Places");
    const capas = require("./servicios/Capas");
    const plugins = require("./servicios/Plugins");
    const usuarios = require("./servicios/Usuarios");
    
    await require("./servicios/MongoDB").init();

    let loadedPlugins = await plugins.init();
    capas.init();

    zServer.registerModule("plc", places);
    zServer.registerModule("ly", capas);    
    zServer.registerModule("plug", plugins);
    zServer.registerModule("usu", usuarios);
    
    app.use("/", express.static(__dirname + "/www"));

    loadedPlugins.forEach(p => {
        app.use("/" + p.codigo, express.static(p.basePath + "/www"));
    });

    app.use(bodyParser.urlencoded({extended:true}));
    app.use(bodyParser.json({limit:"50mb"}));
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
        next();
    });

    app.set('etag', false);
    app.get("/foto-usuario", (req, res) => {
        let email = req.query.email;
        usuarios.getFotoUsuario(email)
            .then(foto => {
                let regex = /^data:.+\/(.+);base64,(.*)$/;
                let matches = foto.match(regex);
                let contentType = matches[1];
                let data = matches[2];
                let buffer = Buffer.from(data, 'base64');
                res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
                res.setHeader('Content-Type', "image/" + contentType);
                res.status(200);
                res.send(buffer);
            })
            .catch(error => res.send(error).sendStatus(500));
    });
    app.post("/*.*", (req, res) => zServer.resolve(req, res));

    if (conf.webServer.http) {
        var port = conf.webServer.http.port;
        httpServer = http.createServer(app);
        httpServer.listen(port, function () {
            console.log("[GEOPortal] HTTP Server iniciado en puerto " + port);
        });
    }
}

createHTTPServer()