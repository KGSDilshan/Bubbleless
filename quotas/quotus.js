// round up function
function rd(x) {
    let val = x.toString().split(".")
    if (val.length == 1)
        return val;
    else if (parseInt(val[1][0]) >= 5)
        return parseInt(x) + 1
    else
        return parseInt(x)
}

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


/*
    quotaConfig = {
        limit: null,
        client: null,
        nSize: null,
        isActive: true,
        isRaw : false,
        isCounter: false,
        isCounted: false,
        Mode: "phone",
    }

*/


class Quota {
    constructor(quotaGroup, quotaName, questionName, quotaPercentage, quotaCodes, quotaConfig) {
        this.config = quotaConfig;
        this.name = quotaGroup.name + " - " + quotaName;
        this.limit = quotaPercentage;
        this.qCodes = quotaCodes; // arr of codes ????
        this.qName = questionName; // arr of questions ????
    }
}
