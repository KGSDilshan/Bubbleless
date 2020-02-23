onmessage = function(file) {
    self.importScripts('https://unpkg.com/xlsx/dist/xlsx.full.min.js');
    let reader = new FileReader();
    console.log(file.data[0]);
    postMessage("starting up");
    reader.readAsArrayBuffer(file.data[0]);
    postMessage("reading file as compressed binary.");
    reader.onload = function(e) {
    	postMessage("loading compressed binary");
    	var data = new Uint8Array(reader.result);
        postMessage("converting compressed binary");
    	var wb = XLSX.read(data, {type:'array'});
        postMessage("Uncompressing data.");
    	let sample = XLSX.write(wb, {sheet:wb.SheetNames[0], type:'binary',bookType:'csv'});
        postMessage("Converting into CSV.");
        postMessage(4);
        postMessage(sample);
    };
}
