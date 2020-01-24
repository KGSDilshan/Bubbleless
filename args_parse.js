var SAMPLE;
var SCRUB_PARSE;
var UNCHANGED_ROWS = 6;
var DATA_LENGTH = 0;
var ALPHABET = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q",
 				"R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

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
	console.log("starting to process");
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
	// reparse all arguments
	let contents = document.getElementById("bubblesInput").value;
    contents = contents.split("\n");
	console.log(contents);
	currentCol = undefined;
	for (let i = 0; i < contents.length; i++) {
		let line = contents[i].trim();
		if (line == "")
			continue;
		line = line.split("\t");
		console.log(line);
		if (line.length == 1) {
			// this is column
			currentCol = line[0];
			console.log("Column is ", line[0], CalcIndexColumn(line[0]) - 1);

		} else {
			// this is a replacement
			let original = line[0].split(",");
			let replacement = line[1];
			for (let j = 0; j < original.length; j++) {
				console.log("In column ", currentCol, "replace", original[j], "with", replacement)
				SAMPLE.FindAndReplace(currentCol, original[j], replacement);
			}
		}
	}
	SAMPLE.PrepareExport();
	DownloadCSV(SAMPLE.records);
	console.log("export ready!");
	//DisplayWarnings();
}

function DisplayWarnings() {
	let message = "";
	for (let i = 0; i < WARNINGS.length; i++) {
		message += WARNINGS[i] + "<br>";
	}
	// write
	document.getElementById("WarningBuffer").innerHTML = message + "<br><br>";
}


function DownloadCSV(csv, filename="YourFilename.csv") {
    let csvFile;
    let downloadLink;

	if (window.Blob == undefined || window.URL == undefined || window.URL.createObjectURL == undefined) {
		alert("Your browser doesn't support Blobs");
		return;
	}

    csvFile = new Blob(csv, {type:"text/csv"});
    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}
