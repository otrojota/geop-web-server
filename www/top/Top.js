class Top extends ZCustomController {
    onThis_activated() {
        console.log("boton", this.cmdAlternaMenu);
    }
    doResize() {
        let {width, height} = this.size;
        let w = width - this.leftM.size.width - this.rightM.size.width - this.centerM.size.width;
        this.centerM.view.style["margin-left"] = (w/2) + "px";
    }
    onCmdAlternaMenu_click() {
        this.triggerEvent("alternaMenu");
    }
}
ZVC.export(Top);