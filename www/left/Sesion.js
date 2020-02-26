class Sesion extends ZCustomController {
    onSesionLoader_login() {
        this.usuarioLogueado();
    }
    usuarioLogueado() {
        this.sesionLoader.load("./perfilUsuario/PerfilUsuario");
    }
}
ZVC.export(Sesion);