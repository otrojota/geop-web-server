class CheckBox extends ZCustomController {
    onThis_init() {
        if (this.view.getAttribute("data-label")) this.label = this.view.getAttribute("data-label");
    }
    get checked() {return this.check.hasClass("fa-check-square")}
    set checked(c) {
        if (c) {
            this.check.removeClass("fa-square");
            this.check.addClass("fa-check-square");
        } else {
            this.check.removeClass("fa-check-square");
            this.check.addClass("fa-square");
        }
    }
    get label() {return this.labelText.text}
    set label(l) {this.labelText.text = l}

    onCheck_click() {
        if (this.disabled) return;
        this.checked = !this.checked;
        this.triggerEvent("change", this.checked);
    }
    onLabelText_click() {
        this.onCheck_click();
    }
    disable() {
        this.disabled = true;
        this.view.firstChild.style.removeProperty("cursor");
        this.labelText.addClass("text-muted");
        this.check.view.style.color = "lightgray";
    }
}
ZVC.export(CheckBox);