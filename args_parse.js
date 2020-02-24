var SAMPLE = undefined;
var SCRUB_PARSE;
var UNCHANGED_ROWS = 6;
var DATA_LENGTH = 0;
var WARNINGS = [];
var TEXTWARNINGS = [];
var FileWorker;
var FileState = 0;
var INITIAL_FILETYPE = "csv";

function OpenFile(event) {
	AltLoadBar();
	let files = document.getElementById("sampleFile").files;
	if (files[0].name.includes(".csv")) {
		let input = event.target;
		let reader = new FileReader();
		reader.readAsText(input.files[0]);
		reader.onload = function(e) {
			SAMPLE = e.target.result;
			PreviewSample(SAMPLE);
			ProcessEntireSample(SAMPLE);
			$("div#sampleuploadtimer").remove();
		};
	} else {
		INITIAL_FILETYPE = files[0].name.split(".");
		INITIAL_FILETYPE = INITIAL_FILETYPE[INITIAL_FILETYPE.length - 1];
		FileWorker = new Worker("worker.js");
		FileWorker.onmessage = function(event) {
			switch (FileState) {
				case 0:
					console.log("finished..", event.data);
					if (event.data == 4) {
						FileState = 1;
					}
					break;
				case 1:
					SAMPLE = event.data.slice(3, event.data.length);
					PreviewSample(SAMPLE);
					ProcessEntireSample(SAMPLE, "sample_uploader");
					FileWorker.terminate();
					$("div#sampleuploadtimer").remove();
					break;
			};
		};
		FileWorker.postMessage(files);
	}
};


function LoadBar(id) {
	let data = '<div class="progress">';
	data += '<div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" id="' + id.toString() + 'loadbar"' +  'aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div>'
	data += '</div>';

	$("div#" + id.toString()).append(data);
	return id.toString() + "loadbar";
}


function AltLoadBar(id="sample_uploader") {
	let data = '<div class="spinner-border" id="sampleuploadtimer" role="status">';
	data += '<span class="sr-only">Loading...</span>'
	data += '</div>';
	$("div#" + id.toString()).append(data);
}


function LoadBarSetValue(id, value) {
	document.getElementById(id).style.width = value.toString() + "%";
}


function PreviewSample(fdata) {
	// header
	let thtml = '<table class="table table-dark" id="dtHorizontal" "scrollX": true>';
	let data = fdata.split("\n");
	let row1to6 = [data[0].split(","),data[1].split(","),data[2].split(","),data[3].split(","),data[4].split(","),data[5].split(",")];
	let htmlHeader = '<thead class="thead-dark"><tr>'
	let trow = ""
	trows = ["<tr>","<tr>","<tr>","<tr>","<tr>","<tr>"]
	DATA_LENGTH = row1to6[0].length;
	for (let i = 0; i < DATA_LENGTH; i++) {
		htmlHeader += '<th scope="col">' + CalcColumnID(i+1) + "</th>"
		for (let j = 0; j < row1to6.length; j++) {
			trows[j] += "<td>" + row1to6[j][i] + "</td>";
		}
	}
	let rowsFinal = "<tbody>";
	for (let i = 0; i < row1to6.length; i++) {
		rowsFinal += trows[i] + "</tr>"
	}
	rowsFinal += "</tbody>"
	htmlHeader += "</tr></thead>"
	thtml += htmlHeader + rowsFinal + '</table>';
	document.getElementById("samplePreview").innerHTML = "";
	document.getElementById("samplePreview").innerText = "";
	$("div#samplePreview").append(thtml);
	$('.dataTables_length').addClass('bs-select');
}


function ProcessEntireSample(fdata, id) {
	let data = fdata.split("\n");
	SAMPLE = new Sample(data, id);
	console.log("done");
}

function CalcColumnID(num) {
  for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
    ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret;
  }
  return ret;
}

function CalcIndexColumn(s) {
	let n = 0;
	for(let p = 0; p < s.length; p++){
		n = s[p].charCodeAt() - 64 + n * 26;
	}
	return n;
}


function ProcessInput() {
	if (SAMPLE == undefined) {
		alert("Upload a sample first.");
		return;
	}
	let flagstart = document.getElementById("bubbless-flagstart-input").value;
	if (parseInt(flagstart) < 0) {
		alert("Invalid input for flag start field.");
	} else {
		UNCHANGED_ROWS = parseInt(flagstart) - 1;
		SAMPLE.flagged_start = UNCHANGED_ROWS;
	}
	WARNINGS = [];
	TEXTWARNINGS = [];
	$("button#continue2").remove();
	$("button#continue3").remove();
	// reparse all arguments
	let contents = document.getElementById("bubblelessInput").value;
	contents = contents.split("\n");
	for (let i = 0; i < contents.length; i++) {
		i = RunCommand(contents, i);
	}

	SAMPLE.PrepareExport();
	console.log("filetype: ", INITIAL_FILETYPE);
	let good = false;
	if (WARNINGS.length == 0) {
		WARNINGS.push("<b>ALL OK.</b>");
		TEXTWARNINGS.push("ALL OK\n");
		let buttonHTML = '<button type="submit" class="btn btn-primary mb-2" id="continue2" onClick=SAMPLE.DownloadCSV(SAMPLE.records)>Download CSV</button>'
		$("div#ButtonBuffer").append(buttonHTML);
		good = true;
	} else {
		let buttonHTML = '<button type="submit" class="btn btn-danger mb-2" id="continue2" onClick=SAMPLE.DownloadCSV(SAMPLE.records) >Acknowledged Warnings & Download CSV</button>'
		$("div#ButtonBuffer").append(buttonHTML);
	}
	DisplayWarnings(good);
	ViewRawData();
	document.getElementById("dataChartArea").innerHTML = "";
	for (let i = 0; i < SAMPLE.flagged_additions.length; i++) {
		if (!SAMPLE.flagged_additions[i].isCopied) {
			let x = new DataVisual(SAMPLE.flagged_additions[i].breakdown, SAMPLE.flagged_additions[i].breakdownNames, SAMPLE.flagged_additions[i].parentName);
			x.RenderGraph();
		}
	}
}

function ViewRawData() {
	if (SAMPLE.deletedRecords.size > 0) {
		// check how many deletes we have
		let count = 0;
    	for (const [key, value] of SAMPLE.deletedRecords.entries()) {
            count += value.length;
    	}
		let buttonHTML = '&nbsp;&nbsp;<button type="submit" class="btn btn-primary mb-2" id="continue3" onClick=SAMPLE.ExportDeleted()>Download Deletes (' + count + ')</button>'
		$("div#ButtonBuffer").append(buttonHTML);
	}
}

function DisplayWarnings(good) {
	let message = "";
	alertMsg = "";
	for (let i = 0; i < WARNINGS.length; i++) {
		let htmlAlert;
		if (good)
			htmlAlert = '<div class="alert alert-success alert-dismissible fade show" role="alert">';
		else
			htmlAlert = '<div class="alert alert-danger alert-dismissible fade show" role="alert">';
		htmlAlert += WARNINGS[i] + "<br>";
		htmlAlert += '<button type="button" class="close" data-dismiss="alert" aria-label="Close">';
		htmlAlert += '<span aria-hidden="true">&times;</span></button></div>';
		message += htmlAlert;
		alertMsg += WARNINGS[i].split("<b>").join("").split("</b>").join("") + "\n"
	}
	// write
	document.getElementById("WarningBuffer").innerHTML = message + "<br><br>";
	if (!good)
		alert(alertMsg);
}
