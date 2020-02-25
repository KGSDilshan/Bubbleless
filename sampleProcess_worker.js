onmessage = function(event) {
    self.importScripts('jqcsv.js');
    let data = event.data;
    let arr =  new Array(data.length);
    console.log(data.length);
    for (let i = 0; i < data.length; i++) {
        arr[i] = $csv.toArray(data[i]);
        if (arr[i] === undefined)
            arr.splice(i, 1);
    }
    postMessage(arr);
};
