/*

ERRORS TO CHECK
1) Check if not all elements were replaced, if an unreplaced element was found during exporting, flag it as unchanged


*/
var IMPORTED_HEADER = "";
var SAMPLE_HEADER = "";
var TOTAL_RECORDS_IN_SAMPLE = 0;
var VALID_PHONENUMBERS = 0;
var INVALID_PHONENUMBERS = 0;
var PHONE_RATIO = 0;
var DELETESMAP = undefined;
const invalidDomains = [".gov"];
var PHONE_SAMPLE = [];
var EMAIL_SAMPLE = [];
var EMAIL_TO_PHONE_SAMPLE = [];
var TEXT_PHONES_SAMPLE = [];
var TEXT_EMAIL_SAMPLE = [];
var NAME_OVERRIDE = undefined;

class FlaggedColumn {
    constructor(columnName, index) {
        this.name = columnName.toUpperCase();
        this.additions = [];
        this.index = index;
        this.changes = []; // what should be in the flagged column
        this.originalValue = []; // what should values are being mapped from
        this.breakdown = new Map();
        this.breakdownNames = "";
        this.isCopied = false;
        this.createCol = true;
        this.invalids = [];
        this.cellRecords = [];
        this.overrideName = undefined;
        if (NAME_OVERRIDE != undefined) {
            this.overrideName = NAME_OVERRIDE;
        }
        // from column name, populate additions column
        let colID = CalcIndexColumn(columnName) - 1;
        for (let i = 0; i < SAMPLE.records.length; i++) {
            this.additions.push(SAMPLE.records[i][colID]);
        }
        this.parentName = SAMPLE.records[0][colID];
    }


    UseAsIs() {
        for (let i = 0; i < this.additions.length; i++) {
            this.changes.push(this.additions[i]);
        }
        this.isCopied = true;
    }


    InsertIntoSample() {
        let parentColName = "";
        let cIndex = CalcIndexColumn(this.name);
        if (cIndex- 1 < UNCHANGED_ROWS) {
            parentColName = this.name;
            this.parentName = this.name;
        } else if (cIndex > SAMPLE.records.length) {
            parentColName = this.name;
            this.parentName = this.name;
        } else {
            parentColName = CalcColumnID(cIndex + (SAMPLE.flagged_start - UNCHANGED_ROWS));
        }

        if (this.createCol == false) {
            // only do breakdown
            this.breakdownNames = this.name;
            for (let i = 1; i < SAMPLE.records.length; i++) {
                let val = this.additions[i];
                if (this.breakdown.has(val)) {
                    this.breakdown.set(val, this.breakdown.get(val) + 1);
                } else {
                    this.breakdown.set(val, 1);
                }
            }
            return;
        }

        if (this.additions[0] === undefined) {
            this.additions[0] = this.parentName + "_Flagged";
            this.breakdownNames = this.parentName + "_Flagged";
        } else {
            this.additions[0] = this.parentName + "_Flagged_(" + parentColName + ")";
            this.breakdownNames = this.additions[0];
        }

        if (this.overrideName) {
            this.additions[0] = this.overrideName;
            this.breakdownNames = this.overrideName;
        }


        SAMPLE.records[0].splice(this.index, 0, this.additions[0]);
        let unaccounted = [];
        let addedBlank = false;
        console.log("insert parsing: ", this.name);
        // if the flag is copied, then no need for validation
        if (this.isCopied) {
            for (let i = 1; i < SAMPLE.records.length; i++) {
                if (this.additions[i] !== undefined) {
                    this.additions[i] = this.additions[i].replace(/ReplacementString/g, '');
                }
                SAMPLE.records[i].splice(this.index, 0, this.additions[i]);
            }
            console.log("Done parsing: ", this.name);
            return;
        }

        for (let i = 1; i < SAMPLE.records.length; i++) {
            if (!this.changes.includes(this.additions[i]) && !unaccounted.includes(this.additions[i])) {
                if (this.additions[i] === undefined || this.additions[i].trim() == '') {
                    this.additions[i] = "BLANK";
                    if (!addedBlank) {
                        addedBlank = true;
                        unaccounted.push(this.additions[i]);
                        WARNINGS.push("<b>WARNING:</b> In column '" + this.name + "' found unaccounted value '" + this.additions[i] + "'");
                        TEXTWARNINGS.push("WARNING: In column '" + this.name + "' found unaccounted value '" + this.additions[i] + "'");
                    }
                } else {
                    WARNINGS.push("<b>WARNING:</b> In column '" + this.name + "' found unaccounted value '" + this.additions[i] + "'");
                    TEXTWARNINGS.push("WARNING: In column '" + this.name + "' found unaccounted value '" + this.additions[i] + "'");
                    unaccounted.push(this.additions[i]);
                }
            }
            if (this.additions[i] !== undefined) {
                this.additions[i] = this.additions[i].replace(/ReplacementString/g, '');
            }
            let val = this.additions[i];
            SAMPLE.records[i].splice(this.index, 0, this.additions[i]);
            if (this.breakdown.has(val)) {
                this.breakdown.set(val, this.breakdown.get(val) + 1);
            } else {
                this.breakdown.set(val, 1);
            }
        }
        // check if duplicate flagging found
        let nonUnique = arrayNonUniq(this.changes);
        for (let i = 0; i < nonUnique.length; i++) {
            WARNINGS.push("<b>WARNING:</b> In column '" + this.name + "' multiple conversions set to code '" + nonUnique[i].replace("ReplacementString", "") + "'");
            TEXTWARNINGS.push("WARNING: In column '" + this.name + "' multiple conversions set to code '" + nonUnique[i].replace("ReplacementString", "") + "'");
        }
        console.log("Done parsing", this.name);
    }


    FindAndReplace(find, replace) {
        let replaced = false;
        this.changes.push("ReplacementString" + replace);
        this.originalValue.push({f: find, r: replace});
        for (let i = 0; i < this.additions.length; i++) {
            if (this.additions[i] !== undefined && this.additions[i].split(" ").join("").toUpperCase() == find) {
                this.additions[i] = "ReplacementString" + replace;
                replaced = true;
            }
        }
        if (replaced == false) {
            WARNINGS.push("<b>WARNING:</b> In column '" + this.name + "' could not find value '" + find + "'");
            TEXTWARNINGS.push("WARNING: In column '" + this.name + "' could not find value '" + find + "'");
        }
    }


    OtherReplace(replacementCode) {
        let replaced = false;
        let undefined_replacement = false;
        let cIndex = CalcIndexColumn(this.name);
        if (cIndex > SAMPLE.records.length) {
            undefined_replacement = true;
        }
        this.changes.push("ReplacementString" + replacementCode);
        this.originalValue.push({f:"Other", r:replacementCode});
        for (let i = 1; i < this.additions.length; i++) {
            if (this.additions[i] === undefined || !this.additions[i].includes("ReplacementString")) {
                this.additions[i] = "ReplacementString" + replacementCode;
                replaced = true;
            }
        }
        if (replaced == false) {
            WARNINGS.push("<b>WARNING:</b> In column '" + this.name + "' no values categorized into 'OTHER'");
            TEXTWARNINGS.push("WARNING: In column '" + this.name + "' no values categorized into 'OTHER'");
        }
        if (undefined_replacement == true) {
            WARNINGS.push("<b>WARNING:</b> Column '" + this.name + "' does not exist. Blank slate used.");
            TEXTWARNINGS.push("WARNING: Column '" + this.name + "' does not exist. Blank slate used.");
        }
    }


    FindAndReplaceRange(min, max, replace) {
        let replaced = false;
        this.changes.push("ReplacementString" + replace);
        this.originalValue.push({f : min.toString() + "-" + max.toString(), r: replace});
        for (let i = 0; i < this.additions.length; i++) {
            if (parseInt(this.additions[i]) <= max && parseInt(this.additions[i]) >= min) {
                this.additions[i] = "ReplacementString" + replace;
                replaced = true;
            }
        }
        if (replaced == false) {
            WARNINGS.push("<b>WARNING:</b> In column '" + this.name + "' could not find value between'" + min + "' and '" + max + "'");
            TEXTWARNINGS.push("WARNING: In column '" + this.name + "' could not find value between'" + min + "' and '" + max + "'");
        }
    }

}

var sampleWorker;
class Sample {
    constructor(data) {
        this.records = [];
        this.modifiedCols = [];
        this.flagged_additions = [];
        this.flagged_start = UNCHANGED_ROWS;
        this.backup = [];
        this.deletedRecords = new Map();

        sampleWorker = new Worker("sampleProcess_worker.js");
		sampleWorker.onmessage = function(event) {
            SAMPLE.records = event.data.slice();
            sampleWorker.terminate();
            $("div#loadingStatusMsg").remove();
            $("div#sampleuploadtimer").remove();
            SAMPLE_HEADER = SAMPLE.records[0].slice();
            TOTAL_RECORDS_IN_SAMPLE = SAMPLE.records.length;
		};
		sampleWorker.postMessage(data);
        document.getElementById("loadingStatusMsg").innerText = "Working on converting Sample";
        // for (let i = 0; i < data.length; i++) {
        //     this.records[i] = $.csv.toArray(data[i]);
        //     if (this.records[i] === undefined)
        //         this.records.splice(i, 1);
        // }
        this.replacements = [];
    }

    FilterDuplicate(cname) {
        let colId = CalcIndexColumn(cname) - 1;
        let colMap = new Map();
        for (var i = this.records.length - 1; i >= 0; i--) {
            var rec = this.records[i][colId];
            if (colMap.get(rec) == undefined) {
                colMap.set(rec, 1);
            } else if (rec == "" || parseInt(rec) == "0") {
                // don't remove empty rows
                continue;
            } else {
                this.DeleteRecordByIndex(colId, i);
            }
        }
    }

    CheckClusters() {
        let clusterCol = document.getElementById("bubbless-cluster-col");
        if (clusterCol == undefined || clusterCol.value == "") {
            return;
        }

        this.VisualizationQueueCol(clusterCol.value, "Clusters in sample");
    }

    VisualizationQueueCol(cname, name=undefined) {
        // create a flag for the column
        const visualFlag = new FlaggedColumn(cname, 0);
        visualFlag.createCol = false;
        if (name !== undefined) {
            visualFlag.name = name;
        }
        const cellCol = document.getElementById("bubbless-cell-col");
        if (cellCol == undefined || cellCol.value =="") {
            return;
        }
        // visualFlag.UniqueCellClusters(cellCol.value);
        this.flagged_additions.push(visualFlag);
        console.log(visualFlag);
        // Mark the flag as DO NOT ADD
    }

    VisualizationQueueColGraph(cname, name=undefined) {
        // create a flag for the column
        const visualFlag = new FlaggedColumn(cname, 0);
        visualFlag.createCol = false;
        if (name !== undefined) {
            visualFlag.name = name;
        }
        // visualFlag.UniqueCellClusters(cellCol.value);
        this.flagged_additions.push(visualFlag);
        console.log(visualFlag);
        // Mark the flag as DO NOT ADD
    }


    GenerateTokens(cname) {
        const tokenFlag = new FlaggedColumn(cname, this.flagged_start);
        let size = TOKENHASHES.length - this.records.length;
        let startIndex = GetRandomInt(0, size - 1);
        tokenFlag.changes = ["token_flagged"].concat(TOKENHASHES.slice(startIndex, startIndex + this.records.length - 1));
        tokenFlag.additions = ["token_flagged"].concat(TOKENHASHES.slice(startIndex, startIndex + this.records.length - 1));
        this.flagged_start++;
        for (let i = 0; i < tokenFlag.additions.length; i++) {
            tokenFlag.changes[i] = "STRTOKENPREFIX" + tokenFlag.changes[i];
            tokenFlag.additions[i] = "STRTOKENPREFIX" + tokenFlag.additions[i];
        }
        tokenFlag.isCopied = true;
        this.flagged_additions.push(tokenFlag);
    }


    ValidateEmail(email) {
        // returns 1 if bad domain, returns 0 if good email, returns 2 if bad email
        //return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email));
        if (!email || email.length > 256) return false;
        var tester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
        if (tester.test(email)) {
            for (var em = 0; em < invalidDomains.length; em++) {
                if (email.toLowerCase().endsWith(invalidDomains[em])) {
                    return 1;
                }
            }
            return 0;
        } else {
            return 2;
        }
    }


    MergePhone(cols) {
        // make a flag object
        let phoneFlag = new FlaggedColumn("PhoneNumbers", this.flagged_start);
        phoneFlag.isCopied = true;
        // // read in priority col
        // let colID_prio = CalcIndexColumn(cols[0]) - 1;
        // let colID_secd = CalcIndexColumn(cols[1]) - 1;
        let colData = [];
        for (let i = 0; i < cols.length; i++) {
            colData.push(CalcIndexColumn(cols[i]) - 1);
        }
        for (let i = 1; i < SAMPLE.records.length; i++) {
            let set = false;
            for (let j = 0; j < colData.length; j++) {
                let current = SAMPLE.records[i][colData[j]];
                // apply formatting
                current = current.split("(").join("").split(")").join("").split("-").join("").split(" ").join("");
                if (current != undefined && current.trim() !== '' && parseInt(current) != 0 && current.length > 1) {
                    set = true;
                    phoneFlag.additions[i] = "ReplacementString" + current;
                    phoneFlag.changes.push(phoneFlag.additions[i]);
                    PHONE_SAMPLE.push(i);
                    if (j == 0) {
                        TEXT_PHONES_SAMPLE.push(i);
                    }
                    break;
                }
            }
            if (set == false && !(SAMPLE.records[i] == undefined)) {
                phoneFlag.additions[i] = "invalid";
                phoneFlag.invalids.push(i + 1);
            }
        }
        //     let prio = SAMPLE.records[i][colID_prio];
        //     let secnd = SAMPLE.records[i][colID_secd];
        //     if (prio != undefined && prio.trim() !== '' && parseInt(prio) != 0 && prio.length > 1) {
        //         phoneFlag.additions[i] = "ReplacementString" + prio;
        //         phoneFlag.changes.push(phoneFlag.additions[i]);
        //         PHONE_SAMPLE.push(i);
        //         TEXT_PHONES_SAMPLE.push(i);
        //     } else if (secnd != undefined && secnd.trim() !== '' && parseInt(secnd) != 0 && secnd.length > 1) {
        //         // anything that priority col has empty, check second col
        //         phoneFlag.additions[i] = "ReplacementString" + secnd;
        //         phoneFlag.changes.push(phoneFlag.additions[i]);
        //         PHONE_SAMPLE.push(i);
        //     } else {
        //         // if data is invalid in second col, do warning, otherwise set as blank
        //         if (prio === undefined && secnd == undefined) {
        //             continue;
        //         }
        //         phoneFlag.additions[i] = "invalid";
        //         phoneFlag.invalids.push(i + 1);
        //
        //     }
        // }
        VALID_PHONENUMBERS = SAMPLE.records.length - phoneFlag.invalids.length;
        INVALID_PHONENUMBERS = phoneFlag.invalids.length;
        PHONE_RATIO = VALID_PHONENUMBERS / TOTAL_RECORDS_IN_SAMPLE;


        if (phoneFlag.invalids.length > 50) {
            WARNINGS.push("<b>WARNING:</b> " + phoneFlag.invalids.length + " records with no valid phone numbers found");
            for (let i = 0; i < phoneFlag.invalids.length; i++) {
                TEXTWARNINGS.push("WARNING: In lines '" + phoneFlag.invalids[i] + " no valid phone number was found");
            }
        } else {
            for (let i = 0; i < phoneFlag.invalids.length; i++) {
                WARNINGS.push("WARNING: In lines '" + phoneFlag.invalids[i] + " no valid phone number was found");
                TEXTWARNINGS.push("WARNING: In lines '" + phoneFlag.invalids[i] + " no valid phone number was found");
            }
        }
        this.flagged_start++;
        this.flagged_additions.push(phoneFlag);
    }


    CreateEmails(cname, cols) {
        let emailFlag = new FlaggedColumn(cname, this.flagged_start);
        emailFlag.changes.push("ReplacementStringrf@rf.com");
        for (let j = SAMPLE.records.length-1; j >= 1; j--) {
            // check each record at specified column
            for (let i = 0; i < cols.length; i++) {
                let recordEmail = SAMPLE.records[j][cols[i]];
                if (recordEmail)
                    recordEmail = recordEmail.trim().toLowerCase();
                var emStatus = false;
                switch (this.ValidateEmail(recordEmail)) {
                    case 0:
                        // valid email, don't delete
                        emailFlag.additions[j] = "ReplacementString" + recordEmail;
                        emailFlag.changes.push(emailFlag.additions[j]);
                        EMAIL_SAMPLE.push(j);
                        emStatus = true;
                        break;
                    case 1:
                        // filtered email. Record ought to be deleted
                        console.log("Domain filtered email: ", recordEmail, j);
                        this.DeleteRecordByIndex(cname, j);
                        emailFlag.additions.splice(j, 1);
                        emStatus = true;
                        EMAIL_SAMPLE.forEach((item, index, arr) => arr[index] -= 1);
                        break;
                    default:
                        // invalid email
                        break;
                }
                if (emStatus) {
                    break;
                }
            }
            if (emailFlag.additions[j] === undefined) {
                emailFlag.additions[j] = "ReplacementStringrf@rf.com";
            }
        }
        this.flagged_start++;
        this.flagged_additions.push(emailFlag);
    }

    CopyCol(col) {
        let flag = new FlaggedColumn(col, this.flagged_start);
        flag.UseAsIs();
        this.flagged_start++;
        this.flagged_additions.push(flag);
    }


    DeleteRecords(col, name) {
        let colID = CalcIndexColumn(col) - 1;
        let colDeleted = false;
        for (let i = this.records.length - 1; i >= 0; i--) {
            // delete matching records
            if (this.records[i][colID].toUpperCase().trim() == name) {
                colDeleted = true;
                if (this.deletedRecords.has(col)) {
                    this.deletedRecords.get(col).push(this.records.splice(i, 1)[0]);
                } else {
                    this.deletedRecords.set(col, this.records.splice(i, 1));
                }
                // delete row from flagged column
                DELETESMAP.set(name, (DELETESMAP.get(name) + 1 || 1));
                for (let j = 0; j < this.flagged_additions.length; j++) {
                    this.flagged_additions[j].additions.splice(i, 1);
                }
            }
        }
        if (colDeleted == false) {
            WARNINGS.push("<b>WARNING:</b> In column '" + col + "' didn't contain deletes of value '" + name + "'");
            TEXTWARNINGS.push("WARNING: In column '" + col + "' didn't contain deletes of value '" + name + "'");
        }
    }


    DeleteRecordByIndex(col, index) {
        let colName = CalcColumnID(col);
        if (this.deletedRecords.has(colName)) {
            this.deletedRecords.get(colName).push(this.records.splice(index, 1)[0]);
        } else {
            this.deletedRecords.set(colName, this.records.splice(index, 1));
        }
        // delete row from flagged column
        for (let j = 0; j < this.flagged_additions.length; j++) {
            this.flagged_additions[j].additions.splice(index, 1);
        }
    }


    FindAndReplaceRange(col, rangedArr, value) {
        value = value.toString();
        let min = parseInt(rangedArr[0]);
        let max = parseInt(rangedArr[1]);
        let flag = this.FlagExists(col).flag;
        if (flag === undefined) {
            // Flagged column doesn't exist
            // loop through records and do the replacements
            flag = new FlaggedColumn(col, this.flagged_start);
            this.flagged_start++;
            this.flagged_additions.push(flag);
        }
        flag.FindAndReplaceRange(min, max, value);
    }


    FindAndReplace(col, item, value) {
        // in column X replace Item with Value for all records
        item = item.toString();
        value = value.toString();
        let flag = this.FlagExists(col).flag;
        if (flag === undefined) {
            // Flagged column doesn't exist, create one
            flag = new FlaggedColumn(col, this.flagged_start);
            this.flagged_start++;
            this.flagged_additions.push(flag);
        }
        if (item.toUpperCase() == "OTHER") {
            flag.OtherReplace(value);
        } else {
            flag.FindAndReplace(item, value);
        }
    }


    FlagExists(colName) {
        console.log("checking found for", colName, "with NAME_OVERRIDE:", NAME_OVERRIDE);
        for (let i = 0; i < this.flagged_additions.length; i++) {
            if (this.flagged_additions[i].name == colName && this.flagged_additions[i].overrideName == NAME_OVERRIDE) {
                return {index : i, flag : this.flagged_additions[i]};
            }
        }
        return {index : -1, flag: undefined};
    }


    VLookUp(conds, currentCol, replacement) {
        let flag = SAMPLE.FlagExists(currentCol).flag;
        let col = CalcIndexColumn(currentCol) - 1;
        console.log("vlookup data: ",conds, currentCol, replacement);
        if (flag === undefined) {
            // column is empty, create it
            console.log("No flagged column exists for this vlookup!");
            flag = new FlaggedColumn(currentCol, SAMPLE.flagged_start);
            SAMPLE.flagged_start++;
            SAMPLE.flagged_additions.push(flag);
        }
        flag.changes.push("ReplacementString" + replacement);
        let replaced = false;
        for (let k = 0; k < SAMPLE.records.length; k++) {
            let setRecord = true;
            let min, max;
            for (let j = 0; j < conds.length; j++) {
                let colID = conds[j].col;
                min = conds[j].min;
                max = conds[j].max;
                if (max != min) {
                    if (!(parseInt(SAMPLE.records[k][colID]) >= min && parseInt(SAMPLE.records[k][colID]) <= max)) {
                        setRecord = false;
                        break;
                    }
                } else {
                    // normal comparison
                    min = min.split(" ").join("").split(",");
                    if (min.toUpperCase() == "BLANK") {
                        let comp = SAMPLE.records[k][colID].split(" ").join("");
                        if (comp != undefined || comp != "") {
                            setRecord = false;
                            break;
                        }
                    } else {
                        let comp = SAMPLE.records[k][colID].split(" ").join("");
                        if (!min.includes(comp)) {
                            setRecord = false;
                            break;
                        }
                    }
                }
            }
            if (setRecord) {
                replaced = true;
                flag.additions[k] = ("ReplacementString" + replacement);
                if (min == max) {
                    let fset = false;
                    for (let k = 0; k < flag.originalValue.length; k++) {
                        if (flag.originalValue[k].f == min) {
                            fset = true;
                            break;
                        }
                    }
                    if (fset) {
                        flag.originalValue.push({f: min, r: replacement});
                    }
                } else {
                    let nme = min.toString() + "-" + max.toString();
                    let fset = false;
                    for (let k = 0; k < flag.originalValue.length; k++) {
                        if (flag.originalValue[k].f == nme) {
                            fset = true;
                            break;
                        }
                    }
                    if (fset) {
                        flag.originalValue.push({f: nme, r: replacement});
                    }
                }
            }
        }
        if (replaced == false) {
            WARNINGS.push("<b>WARNING:</b> Found nothing which matched combine condition for: '" + currentCol + "', trying to set to " + replacement);
            TEXTWARNINGS.push("WARNING: Found nothing which matched combine condition for: '" + currentCol + "', trying to set to " + replacement);
        }
    }


    PrepareExport() {
        if (document.getElementById("IncludePhoneSample").checked ||
            document.getElementById("IncludeEmailSample").checked ||
            document.getElementById("IncludeTextSample").checked) {
                NAME_OVERRIDE = "Mode Internal";
                let flag = new FlaggedColumn("Mode Internal", SAMPLE.flagged_start);
                console.log(flag);
                SAMPLE.flagged_start++;
                flag.isCopied = true;
                SAMPLE.flagged_additions.push(flag);
                for (let i = 0; i < flag.additions.length; i++) {
                    flag.additions[i] = "STRPREFIXModeInternalFill";
                }
        }
        for (let i = 0; i <this.flagged_additions.length; i++) {
            this.flagged_additions[i].InsertIntoSample();
        }

        //if (INITIAL_FILETYPE == "csv") {
            // for (let i = 0; i < this.records.length; i++) {
            //     this.records[i] = $.csv.fromArrays([this.records[i]]);
            // }
            sampleWorker = new Worker("samplePrepExport.js");
    		sampleWorker.onmessage = function(event) {
                $("div#loadingStatusMsg").css("display", "block");
                $("div#loadingStatusMsg").show();
                SAMPLE.records = event.data.slice();
                sampleWorker.terminate();
                document.getElementById("loadingStatusMsg").innerText = "Step 1/5";
                SetTextRecords();
                document.getElementById("loadingStatusMsg").innerText = "Step 2/5";
                console.log("step 2");
                SetPhoneRecords();
                document.getElementById("loadingStatusMsg").innerText = "Step 3/5";
                console.log("step 3");
                SetEmailRecords();
                document.getElementById("loadingStatusMsg").innerText = "Step 4/5";
                console.log("step 4");
                RemovePrefixesInRecords();
                document.getElementById("loadingStatusMsg").innerText = "Step 5/5";
                console.log("Fin");
                ContinueExportProcess();

    		};
    		sampleWorker.postMessage(this.records);
        //}
    }

    DownloadPhoneSamples() {
        this.DownloadCSV(PHONE_SAMPLE, "phones");
        this.DownloadCSV(EMAIL_TO_PHONE_SAMPLE, "EmailToPhone");
    }

    DownloadTextingSamples() {
        this.DownloadTextChunks(TEXT_PHONES_SAMPLE, "PhoneToText");
        this.DownloadTextChunks(TEXT_EMAIL_SAMPLE, "EmailToText");
    }

    DownloadTextChunks(sample, name) {
        let counter = 1;
        while (sample.length > 1) {
            let chunk = [SAMPLE.records[0]];
            for (let i = sample.length - 1, j = 0; i >= 1 && j < 10000; i--, j++) {
                chunk.push(sample.splice(i, 1)[0]);
            }
            this.DownloadCSV(chunk, name + "_" + counter + "_." + INITIAL_FILETYPE);
            counter++;
        }
    }

    ExportDeleted() {
        let fullData = [];
    	for (const [key, value] of SAMPLE.deletedRecords.entries()) {
    		fullData.push("Deleted from filter in column: "  + key.toString() + "\n");
            fullData.push("\n");
            fullData.push("\n");
            fullData.push(SAMPLE_HEADER.join(",") + "\n");
            fullData.push("\n");
            for (let i = 0; i < SAMPLE.deletedRecords.get(key).length; i++) {
                fullData.push(value[i].join(",") + "\n");
            }
    	}
        console.log("fdata", fullData);
        this.DownloadCSV(fullData, "deletedRecords.csv");
    }

    ExportHeader() {
        let fBlob = new Blob([SAMPLE_HEADER.join(",")], {type:"text/csv"});
        let downloadLink = document.createElement("a");
        downloadLink.download = "headers.csv";
        downloadLink.href = window.URL.createObjectURL(fBlob);
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        $("div#loadingStatusMsg").remove();
        $("div#sampleuploadtimer").remove();
    }


    DownloadCSV(csvVar, fname="") {
    	if (window.Blob == undefined || window.URL == undefined || window.URL.createObjectURL == undefined) {
    		alert("Your browser doesn't support Blobs");
    		return;
    	}
        let fBlob;
        AltLoadBar("LoadingMessages");
        if (INITIAL_FILETYPE == "csv" || fname.includes(".csv")) {
            fBlob = new Blob(csvVar, {type:"text/csv"});
            let downloadLink = document.createElement("a");
            if (fname == "") {
                fname = "RENAME_ME.csv";
            } else {
                if (!fname.includes(".csv")) {
                    fname = fname + ".csv";
                }
            }
            downloadLink.download = fname;
            downloadLink.href = window.URL.createObjectURL(fBlob);
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            $("div#loadingStatusMsg").remove();
			$("div#sampleuploadtimer").remove();
        } else {

            let fileExporter = new Worker("export_worker.js");
            let buff;
    		fileExporter.onmessage = function(event) {
                if (event.data[0] == 6) {
                    fBlob = new Blob([event.data[1]], {type:"application/octet-stream"});
                    let downloadLink = document.createElement("a");
                    downloadLink.download = (fname == "" ? "RENAME_ME" : fname) + ".xlsx";
                    downloadLink.href = window.URL.createObjectURL(fBlob);
                    downloadLink.style.display = "none";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    fileExporter.terminate();
                    $("div#loadingStatusMsg").remove();
        			$("div#sampleuploadtimer").remove();
                } else {
                    try {
                        document.getElementById("loadingStatusMsg").innerText = event.data[1];
                    } catch (e) {
                        console.log(e);
                    }
                }

    		};
    		fileExporter.postMessage(csvVar);
        }

        // download warnings too
        if (TEXTWARNINGS[0].includes("ALL OK")) {
            return;
        }

        let hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:attachment/text,' + encodeURI(TEXTWARNINGS.join("\n"));
        hiddenElement.target = '_blank';
        hiddenElement.download = 'WARNINGS.txt';
        hiddenElement.click();
    }

}

const arrayNonUniq = array => {
    if (!Array.isArray(array)) {
        throw new TypeError("An array must be provided!")
    }

    return array.filter((value, index) => array.indexOf(value) === index && array.lastIndexOf(value) !== index)
}
