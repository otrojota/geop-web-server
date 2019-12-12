const leftWidth = 300;
const topHeight = 44;

class Main extends ZCustomController {
    onThis_init() {
        this.leftOpen = true;
    }
    onThis_activated() {
        $(window).resize(() => {            
	        this.doResize();
        });
        this.left.pos = {left:0, top:0};
        this.top.pos = {left:0, top:0};
        this.mapa.pos = {left:0, top:0};
        this.doResize();
    }
    doResize() {
        let w = window.innerWidth;
        let h = window.innerHeight;
        this.size = {width:w, height:h}
        if (this.leftOpen) {
            this.left.size = {width:leftWidth, height:h}
            this.left.show();
            this.top.pos = {left:leftWidth + 1, top:0};
            this.top.size = {width:w - leftWidth - 1, height:topHeight}
            this.mapa.pos = {left:leftWidth + 1, top:0};
            this.mapa.size = {width:w - leftWidth - 1, height:h}
        } else {
            this.left.hide();
            this.top.pos = {left:0, top:0};
            this.top.size = {width:w, height:topHeight}
            this.mapa.pos = {left:0, top:0};
            this.mapa.size = {width:w, height:h}
        }
        this.top.doResize();
    }

    onTop_alternaMenu() {
        this.leftOpen = !this.leftOpen;
        this.doResize();
    }
}
ZVC.export(Main);