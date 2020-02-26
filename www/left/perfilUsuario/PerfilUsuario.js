class PerfilUsuario extends ZCustomController {
    async onThis_init() {
        await this.perfil.refresca(window.sesionUsuario.email);
    }

    desactivaOpciones() {
        this.findAll(".fila-opcion").forEach(div => div.classList.remove("fila-opcion-activa"));
    }
    onCmdEditarPerfil_click() {
        this.desactivaOpciones();
        this.cmdEditarPerfil.view.parentNode.classList.add("fila-opcion-activa");
        window.geoportal.panelAuxiliar.openEditarPerfil(_ => this.desactivaOpciones());
    }
}
ZVC.export(PerfilUsuario);