class Sesion extends ZCustomController {
    onSesionLoader_login() {
        this.usuarioLogueado();
    }
    onSesionLoader_logout() {
        this.usuarioDeslogueado();
    }
    usuarioLogueado() {
        this.sesionLoader.load("./perfilUsuario/PerfilUsuario");
    }
    usuarioDeslogueado() {
        this.sesionLoader.load("./login/Login");
    }
}
ZVC.export(Sesion);