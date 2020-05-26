class WExportaCapturas extends ZDialog {
    onThis_init() {
        this.refresca();
        this.working.hide();
        this.cmdExporta.hide();
        this.edDelay.value = window.configCapturas.delay;
        if (!window.configCapturas.fotos.length) this.cmdAnima.disable();
    }

    refresca() {
        let html = `<table class="table table-sm w-100">`;
        window.configCapturas.fotos.forEach((f,i) => {
            html += `
                <tr style="font-size: 80%;">
                    <td><i class="eliminador fas fa-trash-alt" data-idx="${i}" style="cursor: pointer;"></i>
                    <td class="item-exportar" data-idx="${i}">${TimeUtils.fromUTCMillis(f.tiempo).format("DD/MM/YYYY HH:mm")}</td>
                    <td><i class="exportador fas fa-download" data-idx="${i}" style="cursor: pointer;"></i>
                </tr>
            `;
        });
        html += "</table>";
        this.contenedorTabla.html = html;
        this.contenedorTabla.findAll(".eliminador").forEach(element => {
            element.onclick = e => {
                let idx = parseInt(element.getAttribute("data-idx"));
                window.configCapturas.fotos.splice(idx, 1);
                this.refresca();
            }
        })
        this.contenedorTabla.findAll(".exportador").forEach(element => {
            element.onclick = e => {
                let idx = parseInt(element.getAttribute("data-idx"));
                let canvas = window.configCapturas.fotos[idx].canvas;
                var myImage = canvas.toDataURL("image/png");
                var link = document.createElement("a");
                link.download = "geoos-captura.png";
                link.href = "data:" + myImage;
                link.click();
            }
        })
        this.contenedorTabla.findAll(".item-exportar").forEach(element => {
            element.onclick = e => {
                let idx = parseInt(element.getAttribute("data-idx"));
                let canvas = window.configCapturas.fotos[idx].canvas;
                this.preview.view.src = canvas.toDataURL("image/png");
            }
        })
    }

    onCmdAnima_click() {
        let delay = parseInt(this.edDelay.value);
        if (isNaN(delay)) return;
        window.configCapturas.delay = delay;

        let gif = new GIF({workers: 4, quality: 10});
        window.configCapturas.fotos.forEach(f => {
            gif.addFrame(f.canvas, {delay: delay});
        });
        gif.on('finished', blob => {
            this.gifURL = URL.createObjectURL(blob);
            this.preview.view.src = this.gifURL;
            this.working.hide();
            this.cmdAnima.enable();
            this.cmdExporta.show();
        });
        this.cmdAnima.disable();
        this.working.show();
        gif.render();
    }

    onCmdExporta_click() {
        var link = document.createElement("a");
        link.download = "geoos-animacion.gif";
        link.href = this.gifURL;
        link.click();
    }
}
ZVC.export(WExportaCapturas);