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



function RemovePrefixesInRecords() {
	for (let i = 0; i < SAMPLE.records.length; i++) {
		SAMPLE.records[i] = SAMPLE.records[i].split("STRTOKENPREFIX").join("A").split("STRPREFIXModeInternalFill").join("");
	}
}

function SetPhoneRecords() {
	// clean the phone records, should not contain any email records in this sample
	for (let i = PHONE_SAMPLE.length - 1; i >= 0; i--) {
		if (EMAIL_SAMPLE.includes(PHONE_SAMPLE[i])) {
			PHONE_SAMPLE.splice(i, 1);
		}
	}

	// Post sample processing
	let records = [SAMPLE.records[0]];
	var rec;
	for (let i = 0; i < PHONE_SAMPLE.length; i++) {
		rec = SAMPLE.records[PHONE_SAMPLE[i]].split("STRTOKENPREFIX").join("P").split("STRPREFIXModeInternalFill").join("1");
		records.push(rec);
	}
	PHONE_SAMPLE = records.slice();
}

function SetEmailRecords() {
	// Post sample processing
	let records = [SAMPLE.records[0]];
	var rec;
	for (let i = 0; i < EMAIL_SAMPLE.length; i++) {
		rec = SAMPLE.records[EMAIL_SAMPLE[i]].split("STRTOKENPREFIX").join("E").split("STRPREFIXModeInternalFill").join("2");
		records.push(rec);
	}
	EMAIL_SAMPLE = records.slice();
}

function SetTextRecords() {
	// Email Text, everything from TEXT_PHONES_SAMPLE where indexes are shared in EMAIL_SAMPLE
	// Phone Text sample, everything remaining is phones
	let emailTextSample = [];
	for (let i = 0; i < EMAIL_SAMPLE.length; i++) {
		for (let j = TEXT_PHONES_SAMPLE.length - 1; j >= 1; j--) {
			if (EMAIL_SAMPLE[i] == TEXT_PHONES_SAMPLE[j]) {
				emailTextSample.push(TEXT_PHONES_SAMPLE[j]);
				TEXT_PHONES_SAMPLE.splice(j, 1);
			}
		}
	}
	// phones text
	let records = [SAMPLE.records[0]];
	var rec;
	for (let i = 0; i < TEXT_PHONES_SAMPLE.length; i++) {
		rec = SAMPLE.records[TEXT_PHONES_SAMPLE[i]].split("STRTOKENPREFIX").join("T").split("STRPREFIXModeInternalFill").join("3");
		records.push(rec);
	}
	TEXT_PHONES_SAMPLE = records.slice();

	// email Text
	records = [SAMPLE.records[0]];
	for (let i = 0; i < emailTextSample.length; i++) {
		rec = SAMPLE.records[emailTextSample[i]].split("STRTOKENPREFIX").join("T").split("STRPREFIXModeInternalFill").join("3");
		records.push(rec);
	}
	TEXT_EMAIL_SAMPLE = records.slice();
}
