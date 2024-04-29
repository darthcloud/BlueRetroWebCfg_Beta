export const downloadFile = (blob: Blob, filename: string) => {
    var url = window.URL.createObjectURL(blob);

    var a = document.createElement("a",);
    a.style.cssText = "display: none";
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);

    // On Edge, revokeObjectURL should be called only after
    // a.click() has completed, atleast on EdgeHTML 15.15048
    setTimeout(function () {
        window.URL.revokeObjectURL(url);
    }, 1000);
}