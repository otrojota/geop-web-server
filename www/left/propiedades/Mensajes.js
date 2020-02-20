class Mensajes extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "mensajes";  
        this.options = options;
        this.item = options.item;                
    }  
    get mensajes() {return this.item.mensajes}  
    get config() {
        let c = this.item.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.item.configPanel.configSubPaneles[this.codigo] = {
            abierto:false
        }
        return this.item.configPanel.configSubPaneles[this.codigo];
    }
    async destruye() {}
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    refresca() {     
        if (this.config.abierto) {
            this.imgAbierto.removeClass("fa-plus-square");
            this.imgAbierto.addClass("fa-minus-square");
            this.contenido.show();
        } else {
            this.imgAbierto.removeClass("fa-minus-square");
            this.imgAbierto.addClass("fa-plus-square");
            this.contenido.hide();
        }

        if (!this.mensajes || !this.mensajes.tieneDatos) {
            this.hide();
            return;
        }
        this.show();
                 
        if (this.mensajes.nErrores) {
            if (this.mensajes.nErrores == 1) this.titulo.text = "Información: Un Error";
            else this.titulo.text = "Información: " + this.mensajes.nErrores + " Errores";
            this.titulo.view.style.color = "red";
        } else if (this.mensajes.nAdvertencias) {
            if (this.mensajes.nAdvertencias == 1) this.titulo.text = "Información: Una Advertencia";
            else this.titulo.text = "Información: " + this.mensajes.nAdvertencias + " Advertencias";
            this.titulo.view.style.color = "darkorange";
        } else {
            this.titulo.view.style.color = "black";
            this.titulo.text = "Información";
        }

        if (this.mensajes.nMensajes) {
            let html = this.mensajes.listaMensajes.reduce((html, m) => {
                let src = "img/iconos/info.svg";
                if (m.tipo == "advertencia") src = "img/iconos/advertencia.svg";
                if (m.tipo == "error") src = "img/iconos/error.svg";
                html += 
                    `<tr>
                        <td style="vertical-align:top;"><img src="${src}" class="mr-2" style="height:16px;" /></td>
                        <td class="text-muted small" style="width:100%;">${m.texto}</td>
                    </tr>`;
                return html;
            }, "");
            this.contenedorMensajes.show();
            this.contenedorMensajes.html = "<table style='width:100%;'>" + html + "</table><hr class='my-1'/>";
        } else {
            this.contenedorMensajes.hide();
        }
        if (this.mensajes.nPropiedades) {
            let html = this.mensajes.listaPropiedades.reduce((html, prop) => {
                let valor = prop.valor;
                if (prop.nombre.toLowerCase().indexOf("tiempo") >= 0) {
                    let dt = moment.tz(valor, window.timeZone);
                    if (dt.isValid()) valor = dt.format("DD/MMM/YYYY HH:mm");
                }
                html += 
                    `<tr>
                        <td class="small p-1" style="vertical-align:top; max-width:60%; ">${prop.nombre}</td>
                        <td class="text-muted small p-1">${valor}</td>
                    </tr>`;
                return html;
            }, "");
            this.contenedorPropiedades.show();
            this.contenedorPropiedades.html = "<table class='mt-1' style='width:100%; border: 1px solid gray;'>" + html + "</table><hr class='my-1'/>";
        } else {
            this.contenedorPropiedades.hide();
        }
        if (this.mensajes.tieneOrigen) {
            this.contenedorOrigenes.show();
            let n = this.mensajes.listaOrigenes.length;
            let html = this.mensajes.listaOrigenes.reduce((html, codigo, i) => {
                let origen = window.geoportal.getOrigen(codigo);
                html += `
                <table style="width:100%;" class="mt-1">
                    <tr>
                        <td><img style="height: 32px;" class="mr-2" crossorigin="anonymous" src="${origen.icono}"/></td>
                        <td style="width: 100%; text-align: right;">
                            <h5 id="nombreOrigen">${origen.nombre}</h5>
                            <a id="urlOrigen" href="${origen.url}" class="btn-link mt-2" target="_blank">Visitar Sitio</a>
                        </td>
                    </tr>
                </table>
                `;
                if (i < (n - 1)) html += "<hr class='my-1' />";
                return html;
            }, "");
            this.contenedorOrigenes.html = html;
        } else {
            this.contenedorOrigenes.hide();
        }
    }
}
ZVC.export(Mensajes);