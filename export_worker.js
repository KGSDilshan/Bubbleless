onmessage = function(event) {
    self.importScripts('https://unpkg.com/xlsx/dist/xlsx.full.min.js');
    self.importScripts('args_parse.js');
    self.importScripts('jqcsv.js');
    var wb = XLSX.utils.book_new();
    let csvVar  = [];
    for (let i = 0; i < event.data.length; i++) {
        csvVar.push($csv.toArray(event.data[i]));
    }
    console.log("WORKER", csvVar);

    postMessage([1, "(1/5) finished... loading CSV data"]);
    wb.Props = {
        Title: "bubbless",
        Author: "bubbless",
    };
    wb.SheetNames.push("sheet 1");
    postMessage([2, "(2/5) finished... converting CSV data to array format"]);
    var ws_data = csvVar;
    var ws = XLSX.utils.aoa_to_sheet(ws_data);
    postMessage([3, "(3/5) finished... creating worksheet with workbook data"]);
    wb.Sheets["sheet 1"] = ws;
    var wbout = XLSX.write(wb, {bookType:'xlsx', type: 'binary'});
    postMessage([4, "(4/5) finished... creating XLSX file."]);
    var buf = new ArrayBuffer(wbout.length);
    var view = new Uint8Array(buf);
    for(let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
    }
    postMessage([5, "(5/5) finished... converting XLSX file into binary."]);
    postMessage([6, buf]);
};
