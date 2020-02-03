class DateTimeField extends ZCustomController {
    onThis_init() {
        
    }

    onThis_activated() {
        this.refId = "ref" + parseInt(Math.random() * 1000000);
        let $view = $(this.ed.view);
        let x = $view.offset().left;
        let y = $view.offset().top;        
        let div = document.createElement("div");
        div.innerHTML = `
            <div id='${this.refId}' style='position:absolute; left:${x}px; top:${y}px;'>
                <div style='position:relative;'>
                    <div id='${this.refId}-cnt' style='font-size:80%;'></div>
                </div>
            </div>
        `;
        this.calendarContainer = div.children[0];
        document.body.appendChild(this.calendarContainer);
        $view.datetimepicker({
            timeZone:window.timeZone,
            format:"DD/MMM/YYYY HH:mm",            
            widgetPositioning: {horizontal: 'right', vertical: 'top'},
            locale:"es",
            widgetParent:"#" + this.refId + "-cnt",
            icons: {
                time: "fas fa-clock",
                date: "fas fa-calendar",
                up: "fas fa-arrow-up",
                down: "fas fa-arrow-down"
            },
            ignoreReadonly: true
        });
        $view.on("dp.change", _ => this.onEd_change());
        $view.on("dp.show", e => {
            let $view = $(this.ed.view);
            let x = $view.offset().left;
            let y = $view.offset().top;  
            this.calendarContainer.style["left"] = x + "px";
            this.calendarContainer.style["top"] = y + "px";
        });
    }
    onThis_deactivated() {
        this.calendarContainer.remove();
    }
    onEd_change() {
        this.triggerEvent("change");
    }
    get value() {return $(this.ed.view).data("DateTimePicker").date()}
    set value(m) {return $(this.ed.view).data("DateTimePicker").date(m)}
}
ZVC.export(DateTimeField);