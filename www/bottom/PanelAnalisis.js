class PanelAnalisis extends ZCustomController {
    onThis_init() {
        this.rowAnalizador.pos = {left:0, top:0};
        interact(this.vsplitAnalisis.view).draggable({
            startAxis:"x", lockAxis:"x",
            listeners:{
                move: e => {
                    let p = this.vsplitAnalisis.pos;
                    p.left += e.dx;
                    if (p.left < 30) p.left = 30;
                    if (p.left > this.size.width - 30) p.left = this.size.width - 30;
                    this.vsplitAnalisis.pos = {left:p.left, top:p.top}
                },
                end: e => {
                    let p = this.vsplitAnalisis.pos;
                    if (this.objeto) {
                        this.objeto.configAnalisis.width = p.left - 6;
                        this.doResize();
                    }
                }
            }            
        });
    }
    async crea() {
        this.objeto = window.geoportal.capas.getGrupoActivo().itemActivo;
        this.refrescaAnalizadores();
    }
    async destruye() {
        this.objeto = null;
    }
    
    refrescaAnalizadores() {
        let analizadores = window.geoportal.capas.getAnalizadoresAplicables(this.objeto);
        this.edAnalizador.setRows(analizadores);
    }
    doResize() {
        let s = this.size;
        if (!this.objeto) return;
        this.vsplitAnalisis.pos = {left:this.objeto.configAnalisis.width, top:0}
        this.vsplitAnalisis.size = {width:6, height:s.height};
        this.rowAnalizador.size = {width:this.objeto.configAnalisis.width, height:s.height};
    }
}

ZVC.export(PanelAnalisis)