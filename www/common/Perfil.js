class Perfil extends ZCustomController {
    async refresca(email) {
        let perfil = await zPost("getPerfil.usu", {email:email});
        if (!perfil) {
            this.foto.view.src = "img/usuario-no-encontrado.svg";
            this.nombre.text = "Usuario no encontrado";
            return;
        }
        this.nombre.text = perfil.nombre;
        if (perfil.descripcionPerfil) {
            this.descripcionPerfil.html = perfil.descripcionPerfil.replace(/(?:\r\n|\r|\n)/g, '<br>');
            this.conBiografia.show();
        } else {
            this.conBiografia.hide();
        }
        
        if (perfil.tieneFoto) this.foto.view.src = "foto-usuario?email=" + email;
    }
}
ZVC.export(Perfil);