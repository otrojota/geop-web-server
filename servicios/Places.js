const ZModule = require("./z-server").ZModule;
const apiKey = require("./Config").getConfig().hereAPIKey;
const request = require("request");

class Places extends ZModule {
    static get instance() {
        if (Places._singleton) return Places._singleton;
        Places._singleton = new Places();
        return Places._singleton;
    }

    busca(filtro, maxResults, lat, lng) {
        return new Promise((resolve, reject) => {
            let txt = encodeURIComponent(filtro);
            //let url = "https://geocoder.ls.hereapi.com/search/6.2/geocode.json?languages=es-CL&maxresults=" + maxResults + "&searchtext=" + txt + "&apiKey=" + apiKey;
            let url = `https://places.sit.ls.hereapi.com/places/v1/autosuggest?at=${lat},${lng}&maxresults=${maxResults}&q=${txt}&apiKey=${apiKey}`;
            request(url, {
                method:"GET"
            }, (err, res, body) => {
                if (err) reject(err);
                resolve(body);
            });
        })
    }
}

module.exports = Places.instance;