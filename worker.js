onmessage = function(file) {
    self.importScripts('https://unpkg.com/xlsx/dist/xlsx.full.min.js');
    let reader = new FileReader();
    postMessage("(1/6) starting up");
    reader.readAsArrayBuffer(file.data[0]);
    postMessage("(2/6) reading file as compressed binary.");
    reader.onload = function(e) {
    	postMessage("(3/6) loading compressed binary");
    	var data = new Uint8Array(reader.result);
        postMessage("(4/6) converting compressed binary");
    	var wb = XLSX.read(data, {type:'array'});
        postMessage("(5/6) Uncompressing data.");
    	let sample = XLSX.write(wb, {sheet:wb.SheetNames[0], type:'binary',bookType:'csv'});
        postMessage("(6/6) Converting into CSV.");
        postMessage(4);
        postMessage(sample);
    };
}
