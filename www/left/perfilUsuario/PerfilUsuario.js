class PerfilUsuario extends ZCustomController {
    async onThis_init() {
        await this.perfil.refresca(window.sesionUsuario.email);
        window.geoportal.panelPerfil = this;
    }

    onThis_deactivated() {
        window.geoportal.panelPerfil = null;
    }
    refrescaPerfil() {
        this.perfil.refresca(window.sesionUsuario.email);
    }

    desactivaOpciones() {
        this.findAll(".fila-opcion").forEach(div => div.classList.remove("fila-opcion-activa"));
    }
    onCmdEditarPerfil_click() {
        this.desactivaOpciones();
        this.cmdEditarPerfil.view.parentNode.classList.add("fila-opcion-activa");
        window.geoportal.panelAuxiliar.openEditarPerfil(_ => this.desactivaOpciones());
    }
    onCmdCambiarPwd_click() {
        this.desactivaOpciones();
        this.cmdCambiarPwd.view.parentNode.classList.add("fila-opcion-activa");
        window.geoportal.panelAuxiliar.openCambiarPwd(_ => this.desactivaOpciones());
    }
    onCmdLogout_click() {
        this.desactivaOpciones();
        window.geoportal.panelAuxiliar.close();
        this.showDialog("common/WConfirm", {message:"¿Confirma que desea cerrar la sesión de usuario?"}, _ => {
            window.sesionUsuario = null;
            window.zSecurityToken = null;
            localStorage.removeItem("sesion");
            this.triggerEvent("logout");    
        })
    }
}
ZVC.export(PerfilUsuario);