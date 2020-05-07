var SAMPLE = undefined;
var SCRUB_PARSE;
var UNCHANGED_ROWS = 6;
var DATA_LENGTH = 0;
var WARNINGS = [];
var TEXTWARNINGS = [];
var FileWorker;
var FileState = 0;
var INITIAL_FILETYPE = "csv";

function OpenHeaderFile(event) {
	let files = document.getElementById("headerFile").files;
	let input = event.target;
	let reader = new FileReader();
	reader.readAsText(input.files[0]);
	reader.onload = function(e) {
		IMPORTED_HEADER = $csv.toArray(e.target.result);
		PreviewHeader();
		// compare sample header and imported headers
		let indexMap = [];
		// [1, 2, 3, 4, 5] - imported
		// [1, 2, 3, 4, 5, 7] - sample
		// [0, 1, 2, 3, 4, 5]

		for (let i = 0; i < IMPORTED_HEADER.length; i++) {
			let found = false;
			for (let j = 0; j < SAMPLE_HEADER.length; j++) {
				if (SAMPLE_HEADER[j] == IMPORTED_HEADER[i]) {
					indexMap.push(j);
					found = true;
					break;
				}
			}
			if (!found) {
				indexMap.push(-1);
			}
		}

		// // build
		let end = [];
		for (let i = 0; i < SAMPLE_HEADER.length; i++) {
			if (!indexMap.includes(i)) {
				WARNINGS.push("<b>WARNING: </b>" + SAMPLE_HEADER[i] + "(" + CalcColumnID(i) + ") in original sample moved to end.");
				TEXTWARNINGS.push("WARNING: " + SAMPLE_HEADER[i] + "(" + CalcColumnID(i) + ") in original sample moved to end.\n");
				end.push(i);
			}
		}
		indexMap = indexMap.concat(end);
		console.log(indexMap, end);

		// rearrange sample based on map
		const records = [];
		for (let i = 0; i < SAMPLE.records.length; i++) {
			let newRec = [];
			let record = SAMPLE.records[i];
			for (let j = 0; j < indexMap.length; j++) {
				let index = indexMap[j];
				if (index >= 0 && index < record.length) {
					newRec.push(record[index]);
				} else if (index == -1) {
					if (i == 0) {
						newRec.push(IMPORTED_HEADER[j]);
						WARNINGS.push("<b>WARNING: </b>" + IMPORTED_HEADER[j] + "(" + CalcColumnID(j) + ") cannot be mapped, blanks inserted");
						TEXTWARNINGS.push("WARNING: " + IMPORTED_HEADER[j] + "(" + CalcColumnID(j) + ") cannot be mapped, blanks inserted\n");
					} else {
						newRec.push("");
					}
				}

			}
			records.push(newRec);
		}
		SAMPLE.records = records.slice();
		PreviewSampleFromArrs(SAMPLE.records);
		DisplayWarnings(WARNINGS.length == 0);
	}
}


function OpenFile(event) {
	AltLoadBar();
	let files = document.getElementById("sampleFile").files;
	if (files[0].name.includes(".csv")) {
		INITIAL_FILETYPE = "csv";
		let input = event.target;
		let reader = new FileReader();
		reader.readAsText(input.files[0]);
		reader.onload = function(e) {
			SAMPLE = e.target.result;
			PreviewSample(SAMPLE);
			ProcessEntireSample(SAMPLE);
		};
	} else {
		INITIAL_FILETYPE = files[0].name.split(".");
		INITIAL_FILETYPE = INITIAL_FILETYPE[INITIAL_FILETYPE.length - 1];
		FileWorker = new Worker("worker.js");
		FileWorker.onmessage = function(event) {
			switch (FileState) {
				case 0:
					if (event.data == 4) {
						FileState = 1;
					} else {
						document.getElementById("loadingStatusMsg").innerText = "finished..." + event.data;
					}
					break;
				case 1:
					SAMPLE = event.data.slice(3, event.data.length);
					PreviewSample(SAMPLE);
					ProcessEntireSample(SAMPLE, "sample_uploader");
					FileWorker.terminate();
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
	data += '</div><div id="loadingStatusMsg">' + "" + '</div>';
	$("div#" + id.toString()).append(data);
}


function LoadBarSetValue(id, value) {
	document.getElementById(id).style.width = value.toString() + "%";
}

function PreviewHeader() {
	// header
	let thtml = '<table class="table table-dark" id="dtHorizontal" "scrollX": true>';
	let trow = [];
	let htmlHeader = "";
	for (let i = 0; i < IMPORTED_HEADER.length; i++) {
		htmlHeader += '<th scope="col">' + CalcColumnID(i+1) + "</th>";
		trow.push("<td>" + IMPORTED_HEADER[i] + "</td>");
	}
	console.log(trow);
	thtml += "<tbody>" + htmlHeader + "<tr>" + trow.join("") + "</tr>" + "</tbody></table>";
	document.getElementById("headerPreview").innerHTML = "";
	document.getElementById("headerPreview").innerText = "";
	$("div#headerPreview").append(thtml);
	$('.dataTables_length').addClass('bs-select');
}

function PreviewSampleFromArrs(arrs) {
	// header
	let thtml = '<table class="table table-dark" id="dtHorizontal" "scrollX": true>';
	let data = arrs;
	console.log(data);
	let row1to6 = [data[0],data[1],data[2],data[3],data[4],data[5]];
	let htmlHeader = '<thead class="thead-dark"><tr>';
	let trow = "";
	trows = ["<tr>","<tr>","<tr>","<tr>","<tr>","<tr>"];
	DATA_LENGTH = row1to6[0].length;
	for (let i = 0; i < DATA_LENGTH; i++) {
		htmlHeader += '<th scope="col">' + CalcColumnID(i+1) + "</th>";
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

function PreviewSample(fdata) {
	// header
	let thtml = '<table class="table table-dark" id="dtHorizontal" "scrollX": true>';
	let data = fdata.split("\n");
	let row1to6 = [data[0].split(","),data[1].split(","),data[2].split(","),data[3].split(","),data[4].split(","),data[5].split(",")];
	let htmlHeader = '<thead class="thead-dark"><tr>';
	let trow = "";
	trows = ["<tr>","<tr>","<tr>","<tr>","<tr>","<tr>"];
	DATA_LENGTH = row1to6[0].length;
	for (let i = 0; i < DATA_LENGTH; i++) {
		htmlHeader += '<th scope="col">' + CalcColumnID(i+1) + "</th>";
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
	let rs = s.toUpperCase();
	for(let p = 0; p < rs.length; p++){
		n = rs[p].charCodeAt() - 64 + n * 26;
	}
	return n;
}

function RemovePrefixesInRecords() {
	for (let i = 0; i < SAMPLE.records.length; i++) {
		SAMPLE.records[i] = SAMPLE.records[i].split("STRTOKENPREFIX").join("A").split("STRPREFIXModeInternalFill").join("");
	}
}

function SetPhoneRecords() {
	// clean the phone records, should not contain any email records in this sample
	for (let i = PHONE_SAMPLE.length - 1; i >= 0; i--) {
		if (EMAIL_SAMPLE.includes(PHONE_SAMPLE[i])) {
			EMAIL_TO_PHONE_SAMPLE.push(PHONE_SAMPLE[i]);
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

	records = [SAMPLE.records[0]];
	for (let i = 0; i < EMAIL_TO_PHONE_SAMPLE.length; i++) {
		rec = SAMPLE.records[EMAIL_TO_PHONE_SAMPLE[i]].split("STRTOKENPREFIX").join("P").split("STRPREFIXModeInternalFill").join("1");
		records.push(rec);
	}
	EMAIL_TO_PHONE_SAMPLE = records.slice();
}

function SetEmailRecords() {
	// Post sample processing
	let records = [SAMPLE.records[0]];
	var rec;
	for (let i = 0; i < EMAIL_SAMPLE.length; i++) {
		try {
			rec = SAMPLE.records[EMAIL_SAMPLE[i]].split("STRTOKENPREFIX").join("E").split("STRPREFIXModeInternalFill").join("2");
			records.push(rec);
		}
		catch (e) {
			console.log("err", EMAIL_SAMPLE[i], SAMPLE.records[1]);
		}
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


function ProcessInput() {
	if (SAMPLE == undefined) {
		alert("Upload a sample first.");
		return;
	}
	if (document.getElementById("bubblelessScrubNamesInput").value == "") {
		alert("Please insert data for scrubbing.");
		return;
	}


	let flagstart = document.getElementById("bubbless-flagstart-input").value;
	if (parseInt(flagstart) < 0) {
		alert("Invalid input for flag start field.");
		return;
	} else {
		UNCHANGED_ROWS = parseInt(flagstart) - 1;
		SAMPLE.flagged_start = UNCHANGED_ROWS;
	}
	WARNINGS = [];
	TEXTWARNINGS = [];
	$("button#continue2").remove();
	$("button#continue3").remove();
	$("button#continue4").remove();
	$("button#continue5").remove();
	$("button#continue6").remove();
	$("button#continue7").remove();
	// reparse all arguments
	let contents = document.getElementById("bubblelessInput").value;
	let scrubs = document.getElementById("bubblelessScrubNamesInput").value;
	if (!scrubs.toUpperCase().includes("NAMESLIST")) {
		alert("NAMESLIST Command is manditory!");
		return;
	}
	if ((document.getElementById("IncludePhoneSample").checked || document.getElementById("IncludeEmailSample").checked || document.getElementById("IncludeTextSample").checked)) {
		if (!contents.toUpperCase().includes("MERGEPHONENUM")) {
			alert("MERGEPHONENUM is required to create mode based samples.");
			return;
		}
		if (!contents.toUpperCase().includes("EVALEMAILS")) {
			alert("EVALEMAILS is required to create mode based samples.");
			return;
		}
	}

	let temp = scrubs.split("\n");
	scrubs = contents.split("\n");
	contents = temp.concat(scrubs);
	for (let i = 0; i < contents.length; i++) {
		console.log(contents[i]);
		i = RunCommand(contents, i);
		if (i === -1) {
			return;
		}
	}
	$("button#sampleprocessingbtn").remove();
	SAMPLE.CheckClusters();
	SAMPLE.PrepareExport();
	AltLoadBar("LoadingMessages");
}

function ContinueExportProcess() {
	$("div#LoadingMessages").hide();
	if (WARNINGS.length == 0) {
		WARNINGS.push("<b>ALL OK.</b>");
		TEXTWARNINGS.push("ALL OK\n");
		let buttonHTML = '&nbsp;&nbsp;<button type="submit" class="btn btn-primary mb-2" id="continue2" onClick=SAMPLE.DownloadCSV(SAMPLE.records)>DL Master Sample &nbsp;&nbsp;</button><br>';
		$("div#ButtonBuffer").append(buttonHTML);
		if (document.getElementById("IncludePhoneSample").checked) {
			buttonHTML = '&nbsp;&nbsp;<button type="submit" class="btn btn-primary mb-2" id="continue4" onClick=SAMPLE.DownloadPhoneSamples()>DL Phones Sample &nbsp;&nbsp;</button>';
			$("div#ButtonBuffer").append(buttonHTML);
		}
		if (document.getElementById("IncludeEmailSample").checked) {
			buttonHTML = '&nbsp;&nbsp;<button type="submit" class="btn btn-primary mb-2" id="continue5" onClick=SAMPLE.DownloadCSV(EMAIL_SAMPLE,' + '"emails"' + ')>DL Emails Sample &nbsp;&nbsp;</button>';
			$("div#ButtonBuffer").append(buttonHTML);
		}
		if (document.getElementById("IncludeTextSample").checked) {
			buttonHTML = '&nbsp;&nbsp;<button type="submit" class="btn btn-primary mb-2" id="continue6" onClick=SAMPLE.DownloadTextingSamples()>DL Texting Samples &nbsp;&nbsp;</button>';
			$("div#ButtonBuffer").append(buttonHTML);
		}
		$("div#ButtonBuffer").append("<br>");
	} else {
		let buttonHTML = '&nbsp;&nbsp;<button type="submit" class="btn btn-danger mb-2" id="continue2" onClick=SAMPLE.DownloadCSV(SAMPLE.records) >Acknowledged Warnings & DL Master Sample &nbsp;&nbsp;</button><br>';
		$("div#ButtonBuffer").append(buttonHTML);
		if (document.getElementById("IncludePhoneSample").checked) {
			buttonHTML = '&nbsp;&nbsp;<button type="submit" class="btn btn-danger mb-2" id="continue4" onClick=SAMPLE.DownloadPhoneSamples() >DL Phones Sample &nbsp;&nbsp;</button>';
			$("div#ButtonBuffer").append(buttonHTML);
		}
		if (document.getElementById("IncludeEmailSample").checked) {
			buttonHTML = '&nbsp;&nbsp;<button type="submit" class="btn btn-danger mb-2" id="continue5" onClick=SAMPLE.DownloadCSV(EMAIL_SAMPLE,' + '"emails"' + ') >DL Emails Sample &nbsp;&nbsp;</button>';
			$("div#ButtonBuffer").append(buttonHTML);
		}
		if (document.getElementById("IncludeTextSample").checked) {
			buttonHTML = '&nbsp;&nbsp;<button type="submit" class="btn btn-danger mb-2" id="continue6" onClick=SAMPLE.DownloadTextingSamples() >DL Texting Samples &nbsp;&nbsp;</button>';
			$("div#ButtonBuffer").append(buttonHTML);
		}
		$("div#ButtonBuffer").append("<br>");
	}
	DisplayWarnings(WARNINGS.length == 0);
	ViewRawData();
	document.getElementById("dataChartArea").innerHTML = "";
	const qBuff = document.getElementById("QuotasBuffer");
	qBuff.innerHTML = "";
	for (let i = 0; i < SAMPLE.flagged_additions.length; i++) {
		if ((SAMPLE.flagged_additions[i].breakdown.size > 0 && SAMPLE.flagged_additions[i].breakdown.size < 100) ||
			SAMPLE.flagged_additions[i].createCol == false) {
			let grph = new DataVisual(SAMPLE.flagged_additions[i].breakdown,
									SAMPLE.flagged_additions[i].breakdownNames, SAMPLE.flagged_additions[i].parentName,
									SAMPLE.flagged_additions[i].originalValue, SAMPLE.flagged_additions[i]);
			grph.RenderGraph();
			//let quotaGrp = new QuotaGroup(SAMPLE.flagged_additions[i].parentName);
			if (grph.percentages && (grph.name != "EMAIL_Flagged from EMAIL" && grph.name != "email from EMAIL") && !grph.name.includes("Clusters in sample")) {
				console.log(grph.name);
				const qBuff = document.getElementById("QuotasBuffer");
				let data_table = '<thead>';
				data_table += '<tr>';
				data_table += '<th scope="col" colspan="5" contenteditable="true">' + SAMPLE.flagged_additions[i].breakdownNames + '</th>';
				data_table += '</tr>';
				data_table += '</thead>';
				data_table += '<tbody>';
				let quotaName = SAMPLE.flagged_additions[i].breakdownNames;
				quotaName = "p" + quotaName[0].toUpperCase() + quotaName.slice(1, quotaName.length).toLowerCase();
				for (let j = 0; j < grph.percentages.length; j++) {
					data_table += '<tr>';
					data_table += '<td contenteditable="true">' + (grph.percentages[j].transformation ? grph.percentages[j].transformation : "QUOTA_NAME") + '</td>';
					data_table += '<td contenteditable="true">' + grph.percentages[j].rounded + '%</td>';
					data_table += '<td contenteditable="true">' + quotaName + '</td>';
					data_table += '<td contenteditable="true">' + grph.percentages[j].label + '</td>';
					data_table += '</tr>';
				}
				data_table += '</tbody>';
				data_table += '</table>';
				let unbracketed_name = SAMPLE.flagged_additions[i].breakdownNames;
				qBuff.innerHTML += UITableHTML(unbracketed_name) + data_table + "<br><br></div>";
			}
		}
	}

	// render deletes chart
	console.log(DELETESMAP);
	if (DELETESMAP != undefined) {
		let data_table = '<table class="table table-bordered">';
        data_table += '<thead>';
        data_table += '<tr>';
        data_table += '<th scope="col" colspan="4">First and Lastname deletes</th>';
        data_table += '</tr>';
        data_table += '<tr>';
        data_table += '<th scope="col">Name</th>';
        data_table += '<th scope="col">Counts</th>';
        data_table += '<th scope="col">Deletes Breakdown</th>';
        data_table += '<th scope="col">Sample Breakdown</th>';
        data_table += '</tr>';
        data_table += '</thead>';
        data_table += '<tbody>';
		let delCount = 0;
		let delPercentage = 0;
		let delPercentageFull = 0;
		for (let [key, value] of DELETESMAP) {
			data_table += '<tr>';
			data_table += '<td>' + key + '</td>';
			data_table += '<td>' + value + '</td>';
			let delPerc = ((parseFloat(value) / (TOTAL_RECORDS_IN_SAMPLE - SAMPLE.records.length)) * 100);
			let delPercFull = ((parseFloat(value) / (TOTAL_RECORDS_IN_SAMPLE)) * 100);
			data_table += '<td>' + delPerc + '%</td>';
			data_table += '<td>' + delPercFull +'%</td>';
			data_table += '</tr>';
			delCount += value;
			delPercentage += delPerc;
			delPercentageFull += delPercFull;
		}
        data_table += '<thead>';
        data_table += '<tr>';
        data_table += '<th scope="col" colspan="1">Delete Counts total:</th>';
        data_table += '<th scope="col" colspan="1">' + delCount + '</th>';
        data_table += '<th scope="col" colspan="1">' + delPercentage + '%</th>';
        data_table += '<th scope="col" colspan="1">' + delPercentageFull + '%</th>';
        data_table += '</tr>';
        data_table += '</thead>';
        data_table += '</tbody>';
        data_table += '</table><br><br>';
		$("div#dataChartArea").append(data_table);
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

	if (SAMPLE_HEADER.length > 0) {
		let buttonHTML = '&nbsp;&nbsp;<button type="submit" class="btn btn-primary mb-2" id="continue3" onClick=SAMPLE.ExportHeader()>Download Headers</button>'
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
