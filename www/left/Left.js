class Left extends ZCustomController {
    onThis_init() {
        window.geoportal.panelLeft = this;
        this.colapsado = false;
        this.opcionActiva = "sesion";
        this.findAll(".opcion-izquierda").forEach(op => {
            op.onclick = e => {
                let opcion = op.getAttribute("data-opcion");
                this.selecciona(opcion);
            }
        });
    }
    onThis_activated() {
        this.listener = {
            onCapaAgregada:async capa => await this.capaAgregada(capa),
            onCapaRemovida:async capa => await this.capaRemovida(capa),
            seleccionaCapas: async _ => await this.seleccionaCapas()
        }
        window.geoportal.capas.setListener(this.listener);
    }
    onThis_deactivated() {
        window.geoportal.capas.setListener(null);
    }
    startWorking() {
        this.logoGEOOS.addClass("fa-spin");
    }
    finishWorking() {
        this.logoGEOOS.removeClass("fa-spin");
    }
    async capaAgregada(capa) {
        if (this.opcionActiva == "capas") await this.panelActivo.capaAgregada(capa);
        else (await this.selecciona("capas")); // Refresh al abrir
    }
    async seleccionaCapas() {
        //this.triggerEvent("aseguraVisible");
        //if (this.opcionActiva != "capas") {
            (await this.selecciona("capas")); // Refresh al abrir
        //}
    }
    async capaRemovida(capa) {
        if (this.opcionActiva == "capas") await this.panelActivo.capaRemovida(capa);
        else (await this.selecciona("capas")); // Refresh al abrir
    }

    async selecciona(opcion) {
        //if (opcion == this.opcionActiva) return this.opcionesLoader.content;
        if (opcion == this.opcionActiva) {
            this.colapsa();
            return;
        }
        let actual = this.find(".opcion-izquierda.activa");
        if (actual) actual.classList.remove("activa");
        this.find(".opcion-izquierda[data-opcion='" + opcion + "']").classList.add("activa");
        let controller = await this.activaOpcion(opcion);
        if (this.opcionActiva == "capas") window.geoportal.panelTop.activaOpcionMenu("cmdCapasActivas", false);
        this.opcionActiva = opcion;
        if (this.opcionActiva == "capas") window.geoportal.panelTop.activaOpcionMenu("cmdCapasActivas", true);
        this.panelActivo = controller;
        if (this.colapsado) {
            this.colapsado = false;
            this.opcionesLoader.show();
            this.triggerEvent("cambioEstado");
        }
        return controller;
    }
    colapsa() {
        this.find(".opcion-izquierda.activa").classList.remove("activa");
        if (this.opcionActiva == "capas") window.geoportal.panelTop.activaOpcionMenu("cmdCapasActivas", false);
        this.opcionActiva = null;
        this.panelActivo = null;
        this.colapsado = true;
        this.opcionesLoader.hide();
        this.triggerEvent("cambioEstado");
    }
    doResize() {
        let h = this.view.clientHeight;
        this.tabs.view.style.height = (h - 2) + "px";
        this.opcionesLoader.view.style.height = (h - 2) + "px";
        this.ayuda.view.style.setProperty("margin-top", (h - 330) + "px",  "important");
        if (this.opcionesLoader.content.doResize) this.opcionesLoader.content.doResize();
    }
    async activaOpcion(opcion) {
        await window.geoportal.panelAuxiliar.close();
        let controller;
        switch(opcion) {
            case "sesion":
                controller = await this.opcionesLoader.load("./Sesion");
                break;
            case "preferencias":
                controller = await this.opcionesLoader.load("./Preferencias");
                break;
            case "capas":
                controller = await this.opcionesLoader.load("./Capas");
                break;
            case "ayuda":
                controller = await this.opcionesLoader.load("./Ayuda");
                break;
        }
        this.doResize();
        return controller;
    }
    
    onOpcionesLoader_login() {this.refrescaSesion()}
    onOpcionesLoader_logout() {this.refrescaSesion()}
    refrescaSesion() {
        if (this.opcionActiva == "sesion") {
            this.opcionesLoader.content.refresca();
        }
        if (window.sesionUsuario) {
            this.fotoUsuario.view.src = "foto-usuario?email=" + window.sesionUsuario.email;
        } else {
            this.fotoUsuario.view.src = "img/iconos/usuario.svg";
        }
    }
}
ZVC.export(Left);