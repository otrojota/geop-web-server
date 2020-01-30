const leftWidth = 340;
const topHeight = 44;

class Main extends ZCustomController {
    onThis_init() {
        this.leftOpen = true;
        this.analisisOpen = false;
        this.hsplitAnalisis.hide();
        this.panelAnalisis.hide();
        interact(this.hsplitAnalisis.view).draggable({
            startAxis:"y", lockAxis:"y",
            listeners:{
                move: e => {
                    let p = this.hsplitAnalisis.pos;
                    p.top += e.dy;
                    if (p.top < 30) p.top = 30;
                    if (p.top > this.size.height - 30) p.top = this.size.height - 30;
                    this.hsplitAnalisis.pos = {left:p.left, top:p.top}
                },
                end: e => {
                    let p = this.hsplitAnalisis.pos;
                    let s = this.panelAnalisis.size;
                    this.panelAnalisis.size = {width:s.width, height:window.innerHeight - p.top - 6}
                    this.doResize();
                }
            }            
        });
    }
    async onThis_activated() {
        $(window).resize(() => {            
	        this.doResize();
        });
        this.left.pos = {left:0, top:0};
        this.top.pos = {left:0, top:0};
        this.mapa.pos = {left:0, top:0};
        this.panelAnalisis.pos = {left:0, top:200}
        this.doResize();
        await window.geoportal.init();
    }
    doResize() {
        let w = window.innerWidth;
        let h = window.innerHeight;
        this.size = {width:w, height:h}
        let altoAnalisis = this.panelAnalisis.size.height;
        if (altoAnalisis > h - 30) altoAnalisis = h-30;
        if (altoAnalisis < 30) altoAnalisis = 30;

        if (this.leftOpen) {
            this.left.size = {width:leftWidth, height:h}
            this.left.show();
            this.left.doResize();
            this.top.pos = {left:leftWidth + 1, top:0};
            this.top.size = {width:w - leftWidth - 1, height:topHeight}
            this.mapa.pos = {left:leftWidth + 1, top:0};
            this.central.pos = {left:leftWidth + 1, top:0};
            if (this.analisisOpen) {
                this.mapa.size = {width:w - leftWidth - 1, height:h - altoAnalisis - 7}
                this.central.size = {width:w - leftWidth - 1, height:h - altoAnalisis - 7}
                this.hsplitAnalisis.pos = {left:leftWidth + 1, top:h - altoAnalisis - 6}
                this.hsplitAnalisis.size = {width:w - leftWidth - 1, height:6}
                this.panelAnalisis.pos = {left:leftWidth + 1, top:h - altoAnalisis}
                this.panelAnalisis.size = {width:w - leftWidth - 1, height:altoAnalisis}
            } else {
                this.mapa.size = {width:w - leftWidth - 1, height:h}
                this.central.size = {width:w - leftWidth - 1, height:h}
            }
        } else {
            this.left.hide();
            this.top.pos = {left:0, top:0};
            this.top.size = {width:w, height:topHeight}
            this.mapa.pos = {left:0, top:0};
            this.central.pos = {left:0, top:0};
            if (this.analisisOpen) {
                this.mapa.size = {width:w, height:h - altoAnalisis - 7}
                this.central.size = {width:w, height:h - altoAnalisis - 7}
                this.hsplitAnalisis.pos = {left:0, top:h - altoAnalisis - 6}
                this.hsplitAnalisis.size = {width:w, height:6}
                this.panelAnalisis.pos = {left:0, top:h - altoAnalisis}
                this.panelAnalisis.size = {width:w, height:altoAnalisis}
            } else {
                this.mapa.size = {width:w, height:h}
                this.central.size = {width:w, height:h}
            }
        }
        this.top.doResize();
        this.mapa.doResize();
        this.central.doResize();
        if (this.analisisOpen) this.panelAnalisis.doResize();
    }

    onTop_alternaMenu() {
        this.leftOpen = !this.leftOpen;
        this.doResize();
    }

    ajustaPanelAnalisis() {

    }
}
ZVC.export(Main);