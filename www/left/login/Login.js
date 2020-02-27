class Login extends ZCustomController {
    async onThis_init() {
        this.alerta.hide();
        let storedSesion = localStorage.getItem("sesion");
        if (storedSesion) {
            try {
                let sesion = await zPost("autoLogin.usu", {token:JSON.parse(storedSesion).token});
                if (sesion) {
                    window.sesionUsuario = sesion;
                    window.zSecurityToken = sesion.token;
                    this.triggerEvent("login");
                    return;
                } 
            } catch(error) {
                console.error(error);
            }
        }
        this.view.onkeyup = e => {
            if (e.code == "Enter") this.onCmdLogin_click();
        }
    }

    onCmdRegistrarse_click() {
        this.showDialog("./WRegistrarse", {email:this.edEmail.value}, r => {
            this.edEmail.value = r.email;
            this.edPassword.value = r.pwd;
        });
    }
    onCmdOlvidoPwd_click() {
        this.showDialog("./WOlvidoPwd", {email:this.edEmail.value}, r => {
            this.edEmail.value = r.email;
            this.edPassword.value = r.pwd;
        });
    }
    async onCmdLogin_click() {
        try {
            this.alerta.hide();
            let sesion = await zPost("login.usu", {email:this.edEmail.value, pwd:this.edPassword.value});
            window.sesionUsuario = sesion;
            window.zSecurityToken = sesion.token;            
            if (this.edRecordarme.checked) {
                localStorage.setItem("sesion", JSON.stringify({token:sesion.token}));
            } else {
                localStorage.removeItem("sesion");
            }
            this.triggerEvent("login");
        } catch(error) {
            this.alerta.text = error;
            this.alerta.show();
        }
    }
}
ZVC.export(Login);