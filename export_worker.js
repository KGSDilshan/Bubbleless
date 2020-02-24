onmessage = function(event) {
    self.importScripts('https://unpkg.com/xlsx/dist/xlsx.full.min.js');
    var wb = XLSX.utils.book_new();
    let csvVar = event.data;
    console.log("(1/5) finished... loading CSV data");
    wb.Props = {
        Title: "bubbless",
        Author: "bubbless",
    };
    wb.SheetNames.push("sheet 1");
    console.log("(2/5) finished... converting CSV data to array format");
    var ws_data = csvVar;
    var ws = XLSX.utils.aoa_to_sheet(ws_data);
    console.log("(3/5) finished... creating worksheet with workbook data");
    wb.Sheets["sheet 1"] = ws;
    var wbout = XLSX.write(wb, {bookType:'xlsx', type: 'binary'});
    console.log("(4/5) finished... creating XLSX file.");

    var buf = new ArrayBuffer(wbout.length);
    var view = new Uint8Array(buf);
    for(let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
    }
    console.log("(5/5) finished... converting XLSX file into binary.");
    postMessage(buf);
};
