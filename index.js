global.confPath = process.argv.length > 2?process.argv[2]:__dirname + "/config.json";
const config = require("./servicios/Config");

async function createHTTPServer() {
    const zServer = require("./servicios/z-server");
    const express = require('express');
	const app = express();
    const bodyParser = require('body-parser');
    const http = require('http');
    const conf = config.getConfig();
    
    //zServer.registerModule("seg", seguridad);
    
    app.use("/", express.static(__dirname + "/www"));

    app.use(bodyParser.urlencoded({extended:true}));
    app.use(bodyParser.json({limit:"50mb"}));
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
        next();
    });

    app.post("/*.*", (req, res) => zServer.resolve(req, res));

    if (conf.webServer.http) {
        var port = conf.webServer.http.port;
        httpServer = http.createServer(app);
        httpServer.listen(port, function () {
            console.log("[POMeO] HTTP Server iniciado en puerto " + port);
        });
    }
}

createHTTPServer()