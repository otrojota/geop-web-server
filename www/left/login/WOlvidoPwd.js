class WRegistrarse extends ZDialog {
    onThis_init(options) {
        this.mensaje.html = `<i class="fas fa-info mr-1"></i>Ingrese la dirección de correo que utilizó para registrarse en el Portal. Se le enviará a esa dirección un código de recuperación, el que será requerido en el siguiente paso.`;
        this.alerta.hide();
        this.paso = 1; 
        this.paso2.hide();
        this.edEmail.value = options.email;       
    }

    async onCmdOk_click() {
        this.mensaje.hide();
        this.alerta.hide();
        if (this.paso == 1) {
            this.cmdOk.html = `Enviando Correo <i class="fas fa-spin fa-spinner ml-1"></i>`;            
            this.cmdOk.disable();
            try {
                let email = this.edEmail.value.trim();
                await zPost("iniciaOlvidoPwd.usu", {email:email});
                this.paso1.hide();
                this.paso2.show();
                this.cmdOk.html = `Finalizar <i class="fas fa-check ml-1"></i>`;  
                this.cmdOk.enable();
                this.paso = 2;
                this.email = email;
            } catch(error) {
                this.alerta.text = error;
                this.alerta.show();
                this.cmdOk.html = `Siguiente <i class="fas fa-chevron-right ml-1"></i>`;  
                this.cmdOk.enable();
            }
        } else {
            this.cmdOk.disable();
            try {
                let email = this.email;
                let codigo = this.edCodigo.value.trim();
                let pwd1 = this.edPwd1.value.trim();
                let pwd2 = this.edPwd2.value.trim();
                if (!pwd1 || !pwd2 || pwd1.length < 4) throw "La contraseña es obligatoria y debe contener al menos 4 caracteres";
                if (pwd1 != pwd2) throw "La contraseña y su repetición son diferentes";
                await zPost("finalizaOlvidoPwd.usu", {email:email, codigo:codigo, pwd:pwd1});
                this.close({email:email, pwd:pwd1});
            } catch(error) {
                this.alerta.text = error;
                this.alerta.show();
                this.cmdOk.html = `Finalizar <i class="fas fa-check ml-1"></i>`;  
                this.cmdOk.enable();
            }
        }
    }

    onCmdCancel_click() {this.cancel()}
}
ZVC.export(WRegistrarse);