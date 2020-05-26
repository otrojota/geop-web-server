class WConfigCaptura extends ZDialog {
    onThis_init() {
        this.edTiempo.setRows([{
            codigo:"NO", nombre:"No mostrar Tiempo"
        }, {
            codigo:"DD/MMMM/YYYY HH:mm", nombre:"Dia/Mes/Año Hora:Minuto"
        }, {
            codigo:"DD/MMMM/YYYY", nombre:"Dia/Mes/Año"
        }, {
            codigo:"MMMM - YYYY", nombre:"Mes - Año"
        }, {
            codigo:"YYYY", nombre:"Año"
        }], window.configCapturas.tiempo);
        this.edTitulo.value = window.configCapturas.titulo;
    }
    onCmdOk_click() {
        window.configCapturas.tiempo = this.edTiempo.value;
        window.configCapturas.titulo = this.edTitulo.value;
        this.close()
    }
    onCmdCancel_click() {this.cancel()}
}
ZVC.export(WConfigCaptura);