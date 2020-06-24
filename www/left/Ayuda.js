class Ayuda extends ZCustomController {
    doResize() {
        let h = this.view.clientHeight;
        if (h - 540 < 0) {
            this.logoHuinay.hide();    
        } else {
            this.logoHuinay.show();  
            this.logoHuinay.view.style.setProperty("margin-top", (h - 540) + "px",  "important");
        }
    }
}
ZVC.export(Ayuda);