class Left extends ZCustomController {
    onThis_init() {
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
            onCapaAgregada:capa => this.capaAgregada(capa),
            onCapaRemovida:capa => this.capaRemovida(capa)
        }
        window.geoportal.capas.setListener(this.listener);
    }
    onThis_deactivated() {
        window.geoportal.capas.setListener(null);
    }
    async capaAgregada(capa) {
        (await this.selecciona("capas")).capaAgregada(capa);

    }
    async capaRemovida(capa) {
        (await this.selecciona("capas")).capaRemovida(capa);
    }

    async selecciona(opcion) {
        if (opcion == this.opcionActiva) return this.opcionesLoader.content;
        this.find(".opcion-izquierda.activa").classList.remove("activa");
        this.find(".opcion-izquierda[data-opcion='" + opcion + "']").classList.add("activa");
        let controller = await this.activaOpcion(opcion);
        this.opcionActiva = opcion;
        return controller;
    }
    doResize() {
        let h = this.view.clientHeight;
        this.tabs.view.style.height = (h - 2) + "px";
        this.opcionesLoader.view.style.height = (h - 2) + "px";
        if (this.opcionesLoader.content.doResize) this.opcionesLoader.content.doResize();
    }
    async activaOpcion(opcion) {
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
}
ZVC.export(Left);