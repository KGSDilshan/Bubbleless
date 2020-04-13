var QUOTA_GROUPS = [];
var QUOTA_HEADERS = [];
var QUOTA_MODE = undefined;
var GLOBAL_WARNINGS = [];
var IncludesPhone = undefined;
var IncludesEmail = undefined;
var IncludesText = undefined;
var ModeOnline = undefined;
var ModePhone = undefined;
var SurveyMode = undefined;
var TotalNSize = undefined;

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
    {
        name: "Custom N size",
        validation: IncludesCustomN,
        callback: SetCustomNSize,
    },
    {
        // Always should be last in array, happens at lowest priority
        name: "(split)",
        validation: IncludesNameSplit,
        callback: RemoveNameSplits,
    },
];

function IncludesCustomN(name) {
    let customN = document.getElementById("customN" + QUOTA_GROUPS.length);
    if (customN)
        customN = customN.value;
    else
        return false;
    return (customN.trim() != "" && Number.isInteger(parseInt(customN)));
}

function IncludesNameTri(name) {
    return name.toLowerCase().includes("(tri)");
}

function IncludesNameDual(name) {
    return name.toLowerCase().includes("(dual)");
}

function IncludesNameFlex(name) {
    return name.toLowerCase().includes("(flex");
}

function IncludesNameSplit(name) {
    let bracketedContent = name.match(/\(.*?\)/g);
    return (bracketedContent != null && bracketedContent.length > 0);
}

function SetCustomNSize(name, tObj) {
    let obj = JSON.parse(JSON.stringify(tObj));
    obj.nOverride = true;
    obj.nOverrideVal = parseInt(document.getElementById("customN" + QUOTA_GROUPS.length).value);
    return {template: obj, name: name};
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

function RemoveNameSplits(name, tObj) {
    let title = name;
    let obj = JSON.parse(JSON.stringify(tObj));
    let splits = name.toLowerCase().match(/\(.*?\)/g);

    if (splits.length > 0) {
        for (let i = 0; i < splits.length; i++) {
            title = title.replace(/\(.*?\)/gi, "");
            splits[i] = splits[i].toLowerCase();
        }
        obj.hasSplits = true;
        obj.splits = splits;
    } else {
        obj.hasSplits = false;
        obj.splits = undefined;
    }

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

function getQuotaByNames(nameList) {
    for (let i = 0; i < QUOTA_GROUPS.length; i++) {
        for (let j = 0; j < nameList.length; j++) {
            if (QUOTA_GROUPS[i].group_name.toLowerCase().includes(nameList[j].toLowerCase())) {
                return QUOTA_GROUPS[i];
            }
        }
    }
    return undefined;
}

function isNOL() {
    return document.getElementById("NOL").checked;
}

function getRawSizes() {
    let rawSizes = document.getElementById("QNSize").value;
    if (rawSizes == "" || !rawSizes) {
        alert("Missing N-sizes. Please specify this manditory field to continue");
        return;
    }
    rawSizes = rawSizes.split("-");
    for (let i = 0; i < 3; i++) {
        if (rawSizes.length <= i) {
            rawSizes[i] = 0;
        } else {
            rawSizes[i] = parseInt(rawSizes[i]);
        }
    }
    return rawSizes;
}

function getBaseConfigTemplate() {
    return {
        nSizes: getRawSizes().slice(),
        isTri: false,
        isDual: false,
        isFlex: false,
        isRawFlex: false,
        flexAmount: false,
        hasSplits: false,
        nOverride: false,
        nOverrideVal: undefined,
        splits: []
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
        hasSplits: false,
        nOverride: false,
        nOverrideVal: undefined,
        splits: []
    };
    // from the name, derive group properties
    let retObj = NameGroupValidation(QGname, configTemplate);
    let config = retObj.template;
    let name = retObj.name;
    QUOTA_GROUPS.push(new QuotaGroup(name, config, quotaObj));
}

function ReadQuotaArr(showAlert=true) {
    // clear warning area
    const warningBuffer = document.getElementById("QuotaWarningsBuffer");
    while (warningBuffer.firstChild) {
        warningBuffer.removeChild(warningBuffer.firstChild);
    }
    console.log("REPROCESSING ALL!");
    let rawSizes = getRawSizes();
    TotalNSize = rawSizes.reduce((a, b) => a + b, 0);
    let content = ReadQuotaTables();
    if (content.length <= 1 && content[0] =="") {
        alert("Nothing to process...");
        return;
    }
    let i = 0;
    let qGName = "";
    let qGQuotas = [];

    // Initialize quota groups/headers
    QUOTA_GROUPS = [];
    QUOTA_HEADERS = [];
    GLOBAL_WARNINGS = [];
    RAN_CSWARNINGS = false;
    QUOTA_MODE = 0;
    CLIENT = CreateClient(parseInt(document.getElementById("clientSelect").value));
    document.getElementById("QuotaWarningsBuffer").innerHTML = "";
    // Grab all the headers
    content.forEach(row => {
        if (!row.includes("\t") && row.length > 0 && row[0].trim() != "") {
            QUOTA_HEADERS.push(row.toLowerCase().replace(/\s+/g, '').split("(")[0].trim());
        }
    });

    // set the mode
    IncludesPhone = false;
    IncludesEmail = false;
    IncludesText = false;
    ModeOnline = false;
    for (let i = 0; i < rawSizes.length; i++) {
        if (rawSizes[i] > 0 && i == 0) {
            IncludesPhone = true;
        }
        if (rawSizes[i] > 0 && i == 1) {
            IncludesEmail = true;
            ModeOnline = true;
        }
        if (rawSizes[i] > 0 && i == 2) {
            IncludesText = true;
            ModeOnline = true;
        }
    }
    ModePhone = ModeOnline ? false : true;
    SurveyMode = (IncludesPhone + IncludesEmail + IncludesText);
    while (i < content.length) {
        let line = content[i].trim().split("\t");
        if (line == undefined) {
            i++;
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
    let alertMsg = "";
    document.getElementById("QuotaWarningsBuffer").innerHTML = "";
    // Check client specific warnings
    CLIENT.clientSpecificWarnings();
    for (let i = 0; i < QUOTA_GROUPS.length; i++) {
        QUOTA_GROUPS[i].validateQuotas()
    }

    // global warnings
    CLIENT.checkMissingQuotas();
    CLIENT.checkActiveLimits();
    alertMsg = displayWarnings(GLOBAL_WARNINGS) + "\n" + alertMsg;

    if (GLOBAL_WARNINGS.length == 0) {
        // no errors
        console.log("no errors");
        document.getElementById("QuotaWarningsBuffer").innerHTML += '<button type="submit" class="btn btn-success mb-2" onClick=downloadQuotas() >Download Quotas</button>';

    } else {
        if (showAlert) {
            alert(alertMsg);
        }
        document.getElementById("QuotaWarningsBuffer").innerHTML += '<button type="submit" class="btn btn-danger mb-2" onClick=downloadQuotas() >Acknowledge Warnings and Download Quotas</button>';
    }

    // create split quotas after validation
    for (let i = 0; i < QUOTA_GROUPS.length; i++) {
        QUOTA_GROUPS[i].createSplitQuotas();
    }
}

function displayWarnings(warnings) {
    let message = "<form>";
    let alertMsg = "";
    for (let i = 0; i < warnings.length; i++) {
        let htmlAlert = '<div class="row" id="warningRow' + i + '">';
        htmlAlert += '<div class="col">';
        htmlAlert += '<div class="alert alert-danger alert-dismissible fade show" role="alert">';
        htmlAlert += warnings[i].message + "<br>";
        htmlAlert += '<button type="button" class="close" data-dismiss="alert" aria-label="Close">';
        htmlAlert += '<span aria-hidden="true">&times;</span></button></div>';
        htmlAlert += '</div>';
        if (warnings[i].callback != undefined) {
            htmlAlert += '<div class="col-xs-2" id="warningButton' + i + '">';
            htmlAlert += '<button type="button" class="btn btn-warning btn-lg" onClick="execWarningCB(' + i + ')">Apply Changes</button>';
            htmlAlert += '</div>';
        }
        htmlAlert += '</div>';
        message += htmlAlert;
        alertMsg += warnings[i].message.split("<b>").join("").split("</b>").join("") + "\n"
    }
    message += "</form>"
    // write
    document.getElementById("QuotaWarningsBuffer").innerHTML += message;
    return alertMsg;
}

function execWarningCB(i) {
    GLOBAL_WARNINGS[i].callback(GLOBAL_WARNINGS[i].group, GLOBAL_WARNINGS[i].args);
    // reload UI with changes
    ClearQuotaTables();
    StrToQuotaTable(SerializeTableFromObjects());
    RemoveAlert(i);
    ReadQuotaArr(false);
}

function SerializeTableFromObjects() {
    let arrData = "";
    let customNrow = "~";
    for (let i = 0; i < QUOTA_GROUPS.length; i++) {
        qGrp = QUOTA_GROUPS[i];
        /*
          Header = Name (flex N[%])(Splits)
        */
        let header = qGrp.group_name;
        // flex text
        if (qGrp.isFlex) {
            header += "(flex " + qGrp.flexAmount.toString() + (qGrp.isRawFlex ? ")" : "%)");
        }
        // split text
        for (let j = 0; j < qGrp.splits.length; j++) {
            header += qGrp.splits[j];
        }
        /*
          Sub Quota text = Name\tpercentage\tquestion\tcodes(csv)
        */
        let lines = "";
        for (let j = 0; j < qGrp.subQuotas.length; j++) {
            let q = qGrp.subQuotas[j];
            let name =  q.rawName;
            // name change based on counter status
            if (q.counter) {
                // is a counter, check if name contains (counter)
                if (!q.rawName.includes("(counter)")) {
                    name += "(counter)";
                }
            } else {
                // is not a counter, make sure name doesn't contain (counter)
                if (q.rawName.includes("(counter)")) {
                    name = name.split("(counter)").join("");
                }
            }
            // name change based on activity status
            if (!q.active && !q.counter) {
                // is a counter, check if name contains (counter)
                if (!q.rawName.includes("(inactive)")) {
                    name += "(inactive)";
                }
            } else {
                // is not a counter, make sure name doesn't contain (counter)
                if (q.rawName.includes("(inactive)")) {
                    name = name.split("(inactive)").join("");
                }
            }
            lines += name + "\t";
            lines += q.valLimit + (q.isRaw ? "\t" : "%\t");
            lines += q.qName + "\t";
            lines += q.qCodes.join(",");
            lines += "\n";
        }
        arrData += header + "\n" + lines;
        customNrow += (qGrp.isCustomN ? qGrp.totalN : "") + "|";
    }

    arrData += customNrow.replace(/\|$/,"~");
    return arrData;
}

function downloadQuotas() {
    let full_data = '"Quota Name",Type,"Question Code","Option Code","Quota Limit","Quota Settings"' + "\n";
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
