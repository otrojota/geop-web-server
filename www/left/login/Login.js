class Login extends ZCustomController {
    onThis_init() {
        this.alerta.hide();        
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

    doResize() {
        if (!this.logoFooter) return;
        let h = this.view.parentElement.clientHeight;
        if (h - 640 < 0) {
            this.logoFooter.hide();    
        } else {
            this.logoFooter.show();  
            this.logoFooter.view.style.setProperty("margin-top", (h - 640) + "px",  "important");
        }
    }
}
ZVC.export(Login);