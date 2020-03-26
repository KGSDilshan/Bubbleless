var QUOTA_GROUPS = [];

var QUOTA_PROPERTIES = [
    {
        name: "(tri)",
        validation: IncludesNameTri,
        callback: RemoveNameTri,
    },
    {
        name: "(dual)",
        validation: IncludesNameDual,
        callback: RemoveNameDual,
    },
    {
        name: "(flex)",
        validation: IncludesNameFlex,
        callback: RemoveNameFlex,
    },
];


function IncludesNameTri(name) {
    return name.toLowerCase().includes("(tri)");
}

function IncludesNameDual(name) {
    return name.toLowerCase().includes("(dual)");
}

function IncludesNameFlex(name) {
    return name.toLowerCase().includes("(flex");
}

function RemoveNameTri(name, tObj) {
    let title = name.slice().split("(tri)").join("");
    let obj = JSON.parse(JSON.stringify(tObj));
    obj.isTri = true;
    return {template: obj, name: title};
}

function RemoveNameDual(name, tObj) {
    let title = name.slice().split("(dual)").join("");
    let obj = JSON.parse(JSON.stringify(tObj));
    obj.isDual = true;
    return {template: obj, name: title};
}

function RemoveNameFlex(name, tObj) {
    let flex = name.match("flex ([0-9][0-9]*%*)")[0].replace("flex", "").trim();
    let title = name.slice().replace(/\(flex [0-9][0-9]*%*\)/gi,"");
    let obj = JSON.parse(JSON.stringify(tObj));
    obj.isFlex = true;
    obj.isRawFlex = !flex.includes("%");
    obj.flexAmount = parseInt(flex.split("%").join(""));
    return {template: obj, name: title};
}



function NameGroupValidation(OriginalName, template) {
    let name = OriginalName.slice();
    let templateObj = template;
    for (let i = 0; i < QUOTA_PROPERTIES.length; i++) {
        if (QUOTA_PROPERTIES[i].validation(name)) {
            let retObj = QUOTA_PROPERTIES[i].callback(name, templateObj);
            templateObj = retObj.template;
            name = retObj.name.slice();
        }
    }
    return {
        template: templateObj,
        name: name,
    };
}



function CreateQuotaGroup(QGname, quotaObj, rawSizes) {
    if (QGname == "" || QGname == undefined) {
        return;
    }

    let configTemplate = {
        nSizes: rawSizes.slice(),
        isTri: false,
        isDual: false,
        isFlex: false,
        isRawFlex: false,
        flexAmount: false,
    };
    // from the name, derrive group properties
    let retObj = NameGroupValidation(QGname, configTemplate);
    let config = retObj.template;
    let name = retObj.name;
    console.log("group details", name, config);
    QUOTA_GROUPS.push(new QuotaGroup(name, config, quotaObj));
}


function ReadQuotaArr() {
    let rawSizes = document.getElementById("QNSize").value;
    if (rawSizes == "" || !rawSizes) {
        alert("Missing N-sizes. Please specify this manditory field to continue");
        return;
    }
    rawSizes = rawSizes.split("-");
    for (let i = 0; i < rawSizes.length; i++) {
        rawSizes[i] = parseInt(rawSizes[i]);
    }
    let content = ReadQuotaTables();
    let i = 0;
    let qGName = "";
    let qGQuotas = [];
    while (i < content.length) {
        let line = content[i].trim().split("\t");
        if (line == undefined) {
            continue;
        } else if (line.length == 1 && line[0] != undefined) {
            // line should contain a new quota group. Attempt to serialize previous data
            CreateQuotaGroup(qGName, qGQuotas, rawSizes);
            qGName = line[0];
            qGQuotas = [];
        } else if (line.length > 1) {
            // must be a sub quota
            qGQuotas.push(line);
        } else {
            console.log(line, "doesn't fall into categories");
        }
        i++;
    }

    // when quotas have been generated, run validation
    let counter = 0;
    let alertMsg = "";
    for (let i = 0; i < QUOTA_GROUPS.length; i++) {
        if (!QUOTA_GROUPS[i].validateQuotas()) {
            alertMsg += QUOTA_GROUPS[i].displayWarnings();
            counter++;
        }
    }
    if (counter == 0) {
        // no errors
        console.log("no errors");
    } else {
        alert(alertMsg);
    }
}


function downloadQuotas() {
    let full_data = "";
    for (let i = 0; i < QUOTA_GROUPS.length; i++) {
        full_data += QUOTA_GROUPS[i].displayQuotas();
    }
    // download
    if (window.Blob == undefined || window.URL == undefined || window.URL.createObjectURL == undefined) {
        alert("Your browser doesn't support Blobs");
        return;
    }

    let csvFile = new Blob([full_data], {type:"text/csv"});
    let downloadLink = document.createElement("a");
    downloadLink.download = "quotas.csv";
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}
