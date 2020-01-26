var SAMPLE = undefined;
var SCRUB_PARSE;
var UNCHANGED_ROWS = 6;
var DATA_LENGTH = 0;
var WARNINGS = [];

function OpenFile(event) {
	let input = event.target;
	let reader = new FileReader();
	reader.onload = function(e) {
		SAMPLE = e.target.result;
		PreviewSample(SAMPLE);
		ProcessEntireSample(SAMPLE);
	};
	reader.readAsText(input.files[0]);
};


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


function ProcessEntireSample(fdata) {
	let data = fdata.split("\n");
	SAMPLE = new Sample(data);
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
	WARNINGS = [];
	$("button#continue2").remove();
	$("button#continue3").remove();
	// reparse all arguments
	let contents = document.getElementById("bubblelessInput").value;
	contents = contents.split("\n");
	let currentCol = undefined;
	let isDelete = false;
	for (let i = 0; i < contents.length; i++) {
		let line = contents[i].trim();
		if (line == "")
			continue;
		line = line.split("\t");
		if (line.length == 1) {
			line[0] = line[0].toUpperCase();
			if (line[0].includes("STOP DELETE")) {
				isDelete = false;
			} else if (line[0].includes("DELETE")) {
				// this is a delete
				currentCol = line[0].toUpperCase().split("DELETE").join("").trim();
				isDelete = true;
			} else if (isDelete) {
				SAMPLE.DeleteRecords(currentCol, line[0].toUpperCase());
			} else if (line[0].includes("COMBINE")) {
				let replacement =  line[0].split("COMBINE").join("").trim();
				let j = i + 1;
				let conds = [];
				while (true) {
					let temp = contents[j].trim().toUpperCase().split("\t");
					if (temp.includes("END COMBINE")) {
						i = j;
						break;
					} else {
						let rangeVals = temp[1].split("-");
						let vmin = rangeVals[0];
						let vmax = rangeVals.length > 1 ? rangeVals[1] : rangeVals[0];
						if (vmin != vmax) {
							// is an actual range
							vmin = parseInt(vmin);
							vmax = parseInt(vmax);
						}
						conds.push({col: (CalcIndexColumn(temp[0]) - 1), min: vmin, max : vmax});
						j++;
					}
				}
				if (conds.length > 0) {
					i = j;
					let flaggedCol = SAMPLE.FlagExists(currentCol);
					let col = CalcIndexColumn(currentCol) - 1;
					let needAppend = true;
					if (flaggedCol == -1) {
						// column is empty, create it
						SAMPLE.flagged_additions.push(new FlaggedColumn(currentCol, SAMPLE.flagged_start));
						SAMPLE.flagged_start++;
						flaggedCol = SAMPLE.flagged_additions.length - 1;
					} else {
						needAppend = false;
					}
					SAMPLE.flagged_additions[flaggedCol].changes.push("ReplacementString" + replacement);
					for (let k = 0; k < SAMPLE.records.length; k++) {
						let setRecord = true;
						for (let j = 0; j < conds.length; j++) {
							let colID = conds[j].col;
							let min = conds[j].min;
							let max = conds[j].max;
							if (max != min) {
								if (!(parseInt(SAMPLE.records[k][colID]) >= min && parseInt(SAMPLE.records[k][colID]) <= max)) {
									setRecord = false;
									break;
								}
							} else {
								// normal comparison
								if (SAMPLE.records[k][colID] != min) {
									setRecord = false;
									break;
								} else {
								}
							}
						}
						if (setRecord) {
							if (needAppend) {
								SAMPLE.flagged_additions[flaggedCol].Add("ReplacementString" + replacement);
							} else {
								SAMPLE.flagged_additions[flaggedCol].additions[k] = ("ReplacementString" + replacement);
							}
						} else {
							if (needAppend)
								SAMPLE.flagged_additions[flaggedCol].Add(SAMPLE.records[k][col]);
						}
					}
				}

			} else {
				// this is column
				currentCol = line[0];
				isDelete = false;
			}
		} else {
			// this is a replacement
			let original = line[0].toUpperCase().split(",");
			let replacement = line[1];
			for (let j = 0; j < original.length; j++) {
				if (original[j].includes("-")) {
					// this is a range
					SAMPLE.FindAndReplaceRange(currentCol, original[j].split("-"), replacement);
				} else {
					SAMPLE.FindAndReplace(currentCol, original[j], replacement);
				}
			}
		}
	}
	SAMPLE.PrepareExport();
	if (WARNINGS.length == 0){
		WARNINGS.push("<b>ALL OK.</b>");
		let buttonHTML = '<button type="submit" class="btn btn-primary mb-2" id="continue2" onClick=SAMPLE.DownloadCSV()>Download CSV</button>'
		$("div#ButtonBuffer").append(buttonHTML);
	} else {
		let buttonHTML = '<button type="submit" class="btn btn-primary mb-2" id="continue2" onClick=SAMPLE.DownloadCSV() >Acknowledged Warnings & Download CSV</button>'
		$("div#ButtonBuffer").append(buttonHTML);
	}
	DisplayWarnings();
}

function DisplayWarnings() {
	let message = "";
	for (let i = 0; i < WARNINGS.length; i++) {
		message += WARNINGS[i] + "<br>";
	}
	// write
	document.getElementById("WarningBuffer").innerHTML = message + "<br><br>";
}
