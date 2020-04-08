var TABLE_COUNTER = 0;
var RAN_CSWARNINGS = 0;
var CLIENT = undefined;


function DeleteTable(id) {
    var removeDiv = document.getElementById(id);
    var parentEl = removeDiv.parentElement;
    parentEl.removeChild(removeDiv);
}

function UITableHTML(unbracketed_name) {
    let tableHeader = '<div id="tableIndex' + TABLE_COUNTER +'">';
    tableHeader += '<form"><div class="row">'

    tableHeader += '<div class="col">';
    tableHeader += '<button type="button" class="btn btn-danger btn-sm" onClick=DeleteTable("tableIndex' + TABLE_COUNTER + '")>Delete ' +  unbracketed_name + '</button>';
    tableHeader += '</div>';
    tableHeader += '<div class="col"><div class="form-group">';
    tableHeader += '<input type="text" class="form-control form-control-sm"" id="customN' + TABLE_COUNTER +'" placeholder="Custom N-size">';
    tableHeader += '</div></div>';
    tableHeader += '</div>';
    tableHeader += '</form>';
    tableHeader += '<table class="table table-light table-bordered table-hover" id="quotaTable">'
    return tableHeader;
}

function CreateNewQuota_DOM(len) {
	const qBuff = document.getElementById("QuotasBuffer");
    let data_table = '';
    data_table += '<thead>';
    data_table += '<tr>';
    data_table += '<th scope="col" colspan="5" contenteditable="true">QUOTA_GROUP_NAME</th>';
    data_table += '</tr>';
    data_table += '</thead>';
    data_table += '<tbody>';
    for (let i = 0; i < len; i++) {
        data_table += '<tr>';
        data_table += '<td contenteditable="true">QUOTA_NAME</td>';
        data_table += '<td contenteditable="true">X%</td>';
        data_table += '<td contenteditable="true">pPrecodeName</td>';
        data_table += '<td contenteditable="true">' + (i + 1) + '</td>';
        data_table += '</tr>';
    }
    data_table += '</tbody>';
    data_table += '</table>';
    let unbracketed_name = "QUOTA_GROUP_NAME";
    qBuff.innerHTML += UITableHTML(unbracketed_name) + data_table + "<br><br></div>";
    TABLE_COUNTER++;
}


function ReadQuotaTables() {
    const qBuff = document.querySelectorAll("table#quotaTable");

    let data = "";
    for (let i = 0; i < qBuff.length; i++) {
        let grpData = qBuff[i].innerText.split("\n");
        for (let j = grpData.length; j >= 0; j--) {
            if (grpData[j] == "") {
                grpData.splice(j, 1);
            }
        }
        data += grpData.join("\n") + "\n";
    }
    data = data.split("\n");
    return data;
}


function ClearQuotaTables() {
    const qBuff = document.getElementById("QuotasBuffer");

    while (qBuff.firstChild) {
        qBuff.removeChild(qBuff.firstChild);
    }

    console.log("ClearQuotaTables: Quota tables cleared.");
}

function StrToQuotaTable(str) {
    const qBuff = document.getElementById("QuotasBuffer");
    let data = str.split("\n");
    let data_table = "";
    data = data.map(r => r.split("\t"));
    for (let a = 0; a < data.length; a++) {
        // If the length of the current row is 1, it's a header; End the current table and start a new one
        if (data[a].length == 1) {
            if (a > 0) {
                data_table += '</tbody>';
                data_table += '</table><br><br></div>';
                TABLE_COUNTER++;
            }
            let unbracketed_name = data[a][0].replace(/\([a-zA-Z0-9 %]*\)/gi,"");
            data_table += UITableHTML(unbracketed_name);
            data_table += '<thead>';
            data_table += '<tr>';
            data_table += '<th scope="col" colspan="5" contenteditable="true">' + data[a][0] + '</th>';
            data_table += '</tr>';
            data_table += '</thead>';
            data_table += '<tbody>';
        } else {
            data_table += '<tr>';
            data[a].forEach(td => {
                data_table += '<td contenteditable="true">' + td + '</td>';
            });
            data_table += '</tr>';
        }
    }
    data_table += '</tbody>';
    data_table += '</table>';
    qBuff.innerHTML += data_table + "<br><br>";
    TABLE_COUNTER++;
}

function ImportQuotas(event) {
    let qFileInput = document.getElementById("quotaImportFile");
    qFileInput.click();
    qFileInput.onchange = function () {
        let qFile = qFileInput.files[0];
        let reader = new FileReader();
        if (qFile.length === 0) {
            alert("This action requires a valid .dat file to be uploaded.");
        } else {
            ClearQuotaTables();
            reader.addEventListener("loadend", function (event) {
                StrToQuotaTable(event.target.result);
            });
            reader.readAsText(qFile);
        }

        console.log("ImportQuotas: Complete");
    }
}


function ExportQuotas() {
    let data = [];
    let today = new Date();

    data[0] = ReadQuotaTables().join("\n").replace(/\n\n+/, "\n").trim();

    if (data[0].length > 0) {
        let fBlob;
        fBlob = new Blob(data, {type:"text/csv"});
        let downloadLink = document.createElement("a");
        downloadLink.download = "ExportedQuotas_" + (today.getMonth() + 1).toString().padStart(2,"0") + today.getDate().toString() + ".dat";
        console.log("File Name:", downloadLink.download);
        downloadLink.href = window.URL.createObjectURL(fBlob);
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
    } else {
        alert("There is nothing to export.");
    }

    console.log("ExportQuotas: Complete");
}
