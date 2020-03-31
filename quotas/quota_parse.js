var QUOTA_GROUPS = [];
var QUOTA_HEADERS = [];

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
    let hasSplits = false;
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
    let grps = [];
    for (let i = 0; i < QUOTA_GROUPS.length; i++) {
        for (let j = 0; j < nameList.length; j++) {
            if (QUOTA_GROUPS[i].group_name.toLowerCase().includes(nameList[j].toLowerCase())) {
                grp.push(QUOTA_GROUPS[i]);
            }
        }
    }
    return grp;
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
    let configTemplate = {
        id: generateId(),
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
        id: generateId(),
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

function ReadQuotaArr() {
    // clear warning area
    const warningBuffer = document.getElementById("QuotaWarningsBuffer");
    while (warningBuffer.firstChild) {
        warningBuffer.removeChild(warningBuffer.firstChild);
    }

    let rawSizes = getRawSizes()
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
    RAN_CSWARNINGS = false;
    CLIENT = CreateClient(parseInt(document.getElementById("clientSelect").value));
    document.getElementById("QuotaWarningsBuffer").innerHTML = "";
    // Grab all the headers
    content.forEach(row => {
        if (!row.includes("\t") && row.length > 0 && row[0].trim() != "") {
            QUOTA_HEADERS.push(row.toLowerCase().replace(/\s+/g, '').split("(")[0].trim());
        }
    });

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
    let counter = 0;
    let alertMsg = "";
    document.getElementById("QuotaWarningsBuffer").innerHTML = "";
    // Check client specific warnings
    CLIENT.clientSpecificWarnings();
    for (let i = 0; i < QUOTA_GROUPS.length; i++) {
        if (!QUOTA_GROUPS[i].validateQuotas()) {
            alertMsg += QUOTA_GROUPS[i].displayWarnings();
            counter++;
        }
    }

    if (counter == 0) {
        // no errors
        console.log("no errors");
        document.getElementById("QuotaWarningsBuffer").innerHTML += '<button type="submit" class="btn btn-success mb-2" onClick=downloadQuotas() >Download Quotas</button>';

    } else {
        alert(alertMsg);
        document.getElementById("QuotaWarningsBuffer").innerHTML += '<button type="submit" class="btn btn-danger mb-2" onClick=downloadQuotas() >Awknowledge Warnings and Download Quotas</button>';
    }

    // create split quotas after validation
    for (let i = 0; i < QUOTA_GROUPS.length; i++) {
        QUOTA_GROUPS[i].createSplitQuotas();
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

function generateId() {
    let newId = QUOTA_GROUPS.length;

    while (QUOTA_GROUPS.find(x => x.id === newId)) {
        newId++;
    }
    return newId;
}
