class Auxiliar extends ZCustomController {
    onThis_init() {
        window.geoportal.panelAuxiliar = this;
        this.abierto = false;
    }

    doResize() {

    }

    async close() {
        if (!this.abierto) return;        
        if (this.closeCallback) {
            await this.closeCallback();
            this.closeCallback = null;
        }
        await this.triggerEvent("close");
        this.auxiliarLoader.load("common/Empty");
        this.abierto = false;
    }
    onAuxiliarLoader_close() {
        this.close();
    }

    openEditarPerfil(closeCallback) {
        this.auxiliarLoader.load("./auxiliares/EditarPerfil");
        this.triggerEvent("open");
        this.closeCallback = closeCallback;
        this.abierto = true;
    }

    openCambiarPwd(closeCallback) {
        this.auxiliarLoader.load("./auxiliares/CambiarPwd");
        this.triggerEvent("open");
        this.closeCallback = closeCallback;
        this.abierto = true;
    }

}
ZVC.export(Auxiliar);