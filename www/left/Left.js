class Left extends ZCustomController {
    onThis_init() {
        window.geoportal.panelLeft = this;
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
    async capaAgregada(capa) {
        if (this.opcionActiva == "capas") await this.panelActivo.capaAgregada(capa);
        else (await this.selecciona("capas")); // Refresh al abrir
    }
    async seleccionaCapas() {
        this.triggerEvent("aseguraVisible");
        if (this.opcionActiva != "capas") {
            (await this.selecciona("capas")); // Refresh al abrir
        }
    }
    async capaRemovida(capa) {
        if (this.opcionActiva == "capas") await this.panelActivo.capaRemovida(capa);
        else (await this.selecciona("capas")); // Refresh al abrir
    }

    async selecciona(opcion) {
        if (opcion == this.opcionActiva) return this.opcionesLoader.content;
        this.find(".opcion-izquierda.activa").classList.remove("activa");
        this.find(".opcion-izquierda[data-opcion='" + opcion + "']").classList.add("activa");
        let controller = await this.activaOpcion(opcion);
        this.opcionActiva = opcion;
        this.panelActivo = controller;
        return controller;
    }
    doResize() {
        let h = this.view.clientHeight;
        this.tabs.view.style.height = (h - 2) + "px";
        this.opcionesLoader.view.style.height = (h - 2) + "px";
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