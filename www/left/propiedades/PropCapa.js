class PropCapa extends ZCustomController {
    onThis_init(options) {        
        this.options = options;
        this.capa = options.item;
    }
    async destruye() {}
    refresca() {
        
    }
}
ZVC.export(PropCapa);