class EditarPerfil extends ZCustomController {
    async onThis_init() {
        this.cmdGrabar.disable();
        let email = window.sesionUsuario.email;
        let perfil = await zPost("getPerfil.usu", {email:email});
        if (!perfil) {
            this.showDialog("common/WError", {message:"Perfil no encontrado"});
            this.triggerEvent("close");
            return;
        }
        this.edEmail.value = perfil.email;
        this.edNombre.value = perfil.nombre;
        if (perfil.descripcionPerfil) this.edDescripcionPerfil.value = perfil.descripcionPerfil;
        if (perfil.tieneFoto) {
            this.fotoInicial.view.src = "foto-usuario?email=" + email;
        } else {
            this.fotoInicial.view.src = "img/anonimo.svg";
        }
        this.croppie = null;
        this.dragOverListener = e => {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
        this.dropListener = e => {
            e.stopPropagation();
            e.preventDefault();
            if (!e.dataTransfer.files || !e.dataTransfer.files.length) return;
            let file = e.dataTransfer.files[0];
            let name = file.name.toLowerCase();
            if (!name.endsWith(".png") && !name.endsWith(".jpg") && !name.endsWith(".jpeg")) {
                this.showDialog("common/WError", {message:"La imagen debe ser de tipo PNG o JPG"});
                return;
            }
            let reader = new FileReader();
            reader.onloadend = _ => {
                this.creaCroppie(reader.result);
            }
            reader.readAsDataURL(file);
        }
        this.fotoContainer.view.addEventListener("dragover", this.dragOverListener);
        this.fotoContainer.view.addEventListener("drop", this.dropListener);
    }
    onThis_deactivated() {
        this.fotoContainer.view.removeEventListener("dragover", this.dragOverListener);
        this.fotoContainer.view.removeEventListener("drop", this.dropListener);
    }
    onCmdClose_click() {this.triggerEvent("close")}

    onFotoContainer_click() {
        if (!this.croppie) {
            $(this.edFileInput.view).trigger("click");
        }
    }
    onEdFileInput_change() {
        if (this.edFileInput.view.files && this.edFileInput.view.files.length && this.edFileInput.view.files[0]) {
            let file = this.edFileInput.view.files[0];
            let reader = new FileReader();
            reader.onloadend = _ => {
                this.creaCroppie(reader.result);
            }
            reader.readAsDataURL(file);
        }
    }

    creaCroppie(url) {
        if (this.croppie) this.croppie.destroy();
        this.fotoInicial.hide();
        this.helpImagen.text = "";
        this.croppie = new Croppie(this.fotoContainer.view, {
            url:url,
            viewport:{width:128, height:128, type:"circle"}
        });
        this.cmdGrabar.enable();
    }

    async onCmdGrabar_click() {
        let foto = null;
        if (this.croppie) {
            foto = await this.croppie.result({
                type:"base64",
                circle:true
            });
        }
        let nombre = this.edNombre.value.trim();
        let descripcionPerfil = this.edDescripcionPerfil.value.trim();
        if (!nombre) {
            this.showDialog("common/WError", {message:"Debe ingresar su nombre", title:"Grabar Perfil"});
            return;
        }
        try {
            await zPost("savePerfil.usu", {email:window.sesionUsuario.email, nombre:nombre, descripcionPerfil:descripcionPerfil, foto:foto});
            if (window.geoportal.panelPerfil) window.geoportal.panelPerfil.refrescaPerfil();
            this.triggerEvent("close");
        } catch(error) {
            this.showDialog("common/WError", {message:error.toString()});
        }

    }
    onCmdCancelar_click() {
        this.triggerEvent("close");
    }
    onEdNombre_change() {this.cmdGrabar.enable()}
    onEdDescripcionPerfil_change() {this.cmdGrabar.enable()}
}
ZVC.export(EditarPerfil);