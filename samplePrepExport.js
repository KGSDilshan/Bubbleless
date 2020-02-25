onmessage = function(event) {
    self.importScripts('jqcsv.js');
    let data = event.data;
    let arr =  new Array(data.length);
    for (let i = 0; i < data.length; i++) {
        arr[i] = $csv.fromArrays([data[i]]);
    }
    postMessage(arr);
};
