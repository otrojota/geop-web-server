class Sesion extends ZCustomController {
    onThis_init() {
        this.refresca();
    }
    refresca() {
        if (window.sesionUsuario) this.usuarioLogueado();
        else this.usuarioDeslogueado();
    }
    onSesionLoader_login() {
        //this.usuarioLogueado();
        this.triggerEvent("logout");
    }
    onSesionLoader_logout() {
        //this.usuarioDeslogueado();
        this.triggerEvent("logout");
    }
    usuarioLogueado() {
        this.sesionLoader.load("./perfilUsuario/PerfilUsuario");
    }
    usuarioDeslogueado() {
        this.sesionLoader.load("./login/Login");
    }
}
ZVC.export(Sesion);