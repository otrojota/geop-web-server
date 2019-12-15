class Left extends ZCustomController {
    onThis_init() {
        this.findAll(".opcion-izquierda").forEach(op => {
            op.onclick = e => {
                let opcion=op.getAttribute("data-opcion");
                this.find(".opcion-izquierda.activa").classList.remove("activa");
                this.find(".opcion-izquierda[data-opcion='" + opcion + "']").classList.add("activa");
                this.activaOpcion(opcion);
            }
        });
    }
    doResize() {
        let h = this.view.clientHeight;
        this.tabs.view.style.height = (h - 2) + "px";
        this.opcionesLoader.view.style.height = (h - 2) + "px";
    }
    activaOpcion(opcion) {
        switch(opcion) {
            case "sesion":
                this.opcionesLoader.load("./Sesion");
                break;
            case "preferencias":
                this.opcionesLoader.load("./Preferencias");
                break;
        }
    }
}
ZVC.export(Left);