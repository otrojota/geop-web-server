class SerieTiempo extends ZCustomController {
    refresca(objeto) {
        this.objeto = objeto;
        console.log("Panel SerieTiempo, refresca", objeto);
    }
}
ZVC.export(SerieTiempo);