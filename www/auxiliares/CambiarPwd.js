class CambiarPwd extends ZCustomController {
    onCmdClose_click() {this.triggerEvent("close")}

    async onCmdGrabar_click() {
        let pwdActual = this.edPwdActual.value.trim();
        let pwd1 = this.edPwd1.value.trim();
        let pwd2 = this.edPwd2.value.trim();
        if (!pwdActual || !pwd1 || !pwd2) {
            this.showDialog("common/WError", {message:"La Contraseña no puede ser vacía", title:"Cambiar Contraseña"});
            return;
        }
        if (pwd1 != pwd2) {
            this.showDialog("common/WError", {message:"La Nueva Contraseña y su Repetición son Diferentes", title:"Cambiar Contraseña"});
            return;
        }
        try {
            await zPost("cambiarPwd.usu", {pwdActual:pwdActual, pwdNueva:pwd1});
            this.showDialog("common/WInfo", {message:"Su contraseña ha sido modificada", subtitle:"Cambio de Contraseña"}, null, _ => {
                this.triggerEvent("close");
            });
        } catch(error) {
            this.showDialog("common/WError", {message:error.toString()});
        }

    }
    onCmdCancelar_click() {
        this.triggerEvent("close");
    }
}
ZVC.export(CambiarPwd);