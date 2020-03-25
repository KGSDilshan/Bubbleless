function CreateNewQuota_DOM(len) {
	const qBuff = document.getElementById("QuotasBuffer");
    let data_table = '<table class="table table-bordered">';
    data_table += '<thead>';
    data_table += '<tr>';
    data_table += '<th scope="col" colspan="5" contenteditable="true">QUOTA_GROUP_NAME</th>';
    data_table += '</tr>';
    for (let i = 0; i < len; i++) {
        data_table += '<tr>';
        data_table += '<td contenteditable="true">QUOTA_NAME</td>';
        data_table += '<td contenteditable="true">X%</td>';
        data_table += '<td contenteditable="true">pPrecodeName</td>';
        data_table += '<td contenteditable="true">' + (i + 1) + '</td>';
        data_table += '</tr>';
    }
    data_table += '</thead>';
    data_table += '<tbody>';
    data_table += '</tbody>';
    data_table += '</table>';
    qBuff.innerHTML += data_table + "<br><br>";
}

function ReadQuotaTables() {
    const qBuff = document.getElementById("QuotasBuffer");
    let data = "";
    for (let i = 0; i < qBuff.childNodes.length; i++) {
        if (qBuff.childNodes[i].tagName == "TABLE") {
            // get the table's head
            data += qBuff.childNodes[i].childNodes[0].innerText + "\n";
        }
    }
    data = data.split("\n");
    console.log(data);
    return data;
}
