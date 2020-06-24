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
    async usuarioLogueado() {
        await this.sesionLoader.load("./perfilUsuario/PerfilUsuario");
        this.doResize();
    }
    async usuarioDeslogueado() {
        await this.sesionLoader.load("./login/Login");
        this.doResize();
    }
    doResize() {
        if (this.sesionLoader.content.doResize) this.sesionLoader.content.doResize();
    }
}
ZVC.export(Sesion);