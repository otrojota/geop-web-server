class EditarPerfil extends ZCustomController {
    async onThis_init() {
        let email = window.sesionUsuario.email;
        let perfil = await zPost("getPerfil.usu", {email:email});
        if (!perfil) {
            this.fotoInicial.view.src = "img/usuario-no-encontrado.svg";
            this.edNombre.value = "Usuario no encontrado";
            return;
        }
        this.edNombre.value = perfil.nombre;
        if (perfil.tieneFoto) {
            this.fotoInicial.view.src = "foto-usuario?email=" + email;
        } else {
            this.fotoInicial.view.src = "img/anonimo.svg";
        }
    }
    onCmdClose_click() {this.triggerEvent("close")}
}
ZVC.export(EditarPerfil);