/*

ERRORS TO CHECK
1) Check if not all elements were replaced, if an unreplaced element was found during exporting, flag it as unchanged


*/


class FlaggedColumn {
    constructor(columnName, index) {
        this.name = columnName;
        this.additions = [];
        this.index = index;
        this.changes = []; // what should be in the flagged column
        this.breakdown = new Map();
        this.breakdownNames = "";
        this.isCopied = false;

        // from column name, populate additions column
        let colID = CalcIndexColumn(columnName) - 1;
        for (let i = 0; i < SAMPLE.records.length; i++) {
            this.additions.push(SAMPLE.records[i][colID]);
        }
        this.parentName = SAMPLE.records[0][colID];
    }


    UseAsIs() {
        for (let i = 0; i < this.additions.length; i++) {
            this.changes.push(this.additions[i])
        }
        this.isCopied = true;
    }


    InsertIntoSample() {
        let parentColName = "";
        if (CalcIndexColumn(this.name) - 1 < UNCHANGED_ROWS) {
            parentColName = this.name;
        } else {
            parentColName = CalcColumnID(CalcIndexColumn(this.name) + (SAMPLE.flagged_start - UNCHANGED_ROWS));
        }

        if (this.additions[0] === undefined) {
            this.additions[0] = this.name + "_Flagged";
            this.breakdownNames = this.name + "_Flagged";
        } else {
            this.additions[0] = this.name + "_Flagged_(" + parentColName + ")";
            this.breakdownNames = this.additions[0];
        }
        let unaccounted = [];
        let addedBlank = false;
        for (let i = 0; i < SAMPLE.records.length; i++) {
            if (!this.changes.includes(this.additions[i]) && !unaccounted.includes(this.additions[i]) && i > 0) {
                if (this.additions[i] === undefined || this.additions[i].trim() == '') {
                    this.additions[i] = "BLANK";
                    if (!addedBlank) {
                        addedBlank = true;
                        unaccounted.push(this.additions[i]);
                        WARNINGS.push("<b>WARNINGS:</b> In column '" + this.name + "' found unaccounted value '" + this.additions[i] + "'");
                        TEXTWARNINGS.push("WARNINGS: In column '" + this.name + "' found unaccounted value '" + this.additions[i] + "'");
                    }
                } else {
                    WARNINGS.push("<b>WARNINGS:</b> In column '" + this.name + "' found unaccounted value '" + this.additions[i] + "'");
                    TEXTWARNINGS.push("WARNINGS: In column '" + this.name + "' found unaccounted value '" + this.additions[i] + "'");
                    unaccounted.push(this.additions[i]);
                }
            }

            this.additions[i] = this.additions[i].replace(/ReplacementString/g, '');
            let val = this.additions[i];
            SAMPLE.records[i].splice(this.index, 0, this.additions[i]);
            if (i > 0) {
                if (this.breakdown.has(val)) {
                    this.breakdown.set(val, this.breakdown.get(val) + 1);
                } else {
                    this.breakdown.set(val, 1);
                }
            }
        }
    }


    FindAndReplace(find, replace) {
        let replaced = false;
        this.changes.push("ReplacementString" + replace);
        for (let i = 0; i < this.additions.length; i++) {
            if (this.additions[i] !== undefined && this.additions[i].split(" ").join("") == find) {
                this.additions[i] = "ReplacementString" + replace;
                replaced = true;
            }
        }
        if (replaced == false) {
            WARNINGS.push("<b>WARNINGS:</b> In column '" + this.name + "' could not find value '" + find + "'");
            TEXTWARNINGS.push("WARNINGS: In column '" + this.name + "' could not find value '" + find + "'");
        }
    }


    OtherReplace(replacementCode) {
        let replaced = false;
        let undefined_replacement = false;
        this.changes.push("ReplacementString" + replacementCode);
        for (let i = 1; i < this.additions.length; i++) {
            if (this.additions[i] === undefined) {
                this.additions[i] = "ReplacementString" + replacementCode;
                replaced = true;
                undefined_replacement = true;
            } else if (!this.additions[i].includes("ReplacementString")) {
                this.additions[i] = "ReplacementString" + replacementCode;
                replaced = true;
            }
        }
        if (replaced == false) {
            WARNINGS.push("<b>WARNINGS:</b> In column '" + this.name + "' no values categorized into 'OTHER'");
            TEXTWARNINGS.push("WARNINGS: In column '" + this.name + "' no values categorized into 'OTHER'");
        }
        if (undefined_replacement == true) {
            WARNINGS.push("<b>WARNINGS:</b> Column '" + this.name + "' does not exist. Blank slate used.");
            TEXTWARNINGS.push("WARNINGS: Column '" + this.name + "' does not exist. Blank slate used.");
        }
    }


    FindAndReplaceRange(min, max, replace) {
        let replaced = false;
        this.changes.push("ReplacementString" + replace);
        for (let i = 0; i < this.additions.length; i++) {
            if (parseInt(this.additions[i]) <= max && parseInt(this.additions[i]) >= min) {
                this.additions[i] = "ReplacementString" + replace;
                replaced = true;
            }
        }
        if (replaced == false) {
            WARNINGS.push("<b>WARNINGS:</b> In column '" + this.name + "' could not find value between'" + min + "' and '" + max + "'");
            TEXTWARNINGS.push("WARNINGS: In column '" + this.name + "' could not find value between'" + min + "' and '" + max + "'");
        }
    }

}


class Sample {
    constructor(data) {
        this.records = [];
        this.modifiedCols = [];
        this.flagged_additions = [];
        this.flagged_start = UNCHANGED_ROWS;
        this.backup = [];
        this.deletedRecords = new Map();

        // this.sampleWorker = new Worker("sampleProcess_worker.js");
		// this.sampleWorker.onmessage = function(event) {
		// 	this.records = event.data;
		// };
		// this.sampleWorker.postMessage(data);
        for (let i = 0; i < data.length; i++) {
            this.records[i] = $.csv.toArray(data[i]);
            if (this.records[i] === undefined)
                this.records.splice(i, 1);
        }
        this.replacements = [];
    }


    GenerateTokens(cname) {
        const tokenFlag = new FlaggedColumn(cname, this.flagged_start);
        let size = TOKENHASHES.length - this.records.length;
        let startIndex = GetRandomInt(0, size - 1);
        tokenFlag.changes = ["token_flagged"].concat(TOKENHASHES.slice(startIndex, startIndex + this.records.length - 1));
        tokenFlag.additions = ["token_flagged"].concat(TOKENHASHES.slice(startIndex, startIndex + this.records.length - 1));
        this.flagged_start++;
        tokenFlag.isCopied = true;
        this.flagged_additions.push(tokenFlag);
    }


    ValidateEmail(email) {
        //return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email));

        if (!email || email.length > 256) return false;
        var tester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
        return tester.test(email);
    }


    CreateEmails(cname, cols) {
        let emailFlag = new FlaggedColumn(cname, this.flagged_start);
        emailFlag.changes.push("ReplacementStringrf@rf.com");
        console.log("start emails", SAMPLE.records.length, cols.length);
        for (let j = 1; j < SAMPLE.records.length; j++) {
            // check each record at specified column
            for (let i = 0; i < cols.length; i++) {
                let recordEmail = SAMPLE.records[j][cols[i]];
                if (recordEmail)
                    recordEmail = recordEmail.trim();
                if (this.ValidateEmail(recordEmail)) {
                    emailFlag.additions[j] = "ReplacementString" + recordEmail;
                    emailFlag.changes.push(emailFlag.additions[j]);
                    break;
                }
            }
            if (emailFlag.additions[j] === undefined) {
                emailFlag.additions[j] = "ReplacementStringrf@rf.com";
            }
        }
        console.log("fin eval");
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
                for (let j = 0; j < this.flagged_additions.length; j++) {
                    this.flagged_additions[j].additions.splice(i, 1);
                }
            }
        }
        if (colDeleted == false) {
            WARNINGS.push("<b>WARNINGS:</b> In column '" + col + "' didn't contain deletes of value '" + name + "'");
            TEXTWARNINGS.push("WARNINGS: In column '" + col + "' didn't contain deletes of value '" + name + "'");
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
        let flaggedCol = this.FlagExists(col);
        if (flaggedCol == -1) {
            // Flagged column doesn't exist
            // loop through records and do the replacements
            let flag = new FlaggedColumn(col, this.flagged_start);
            this.flagged_start++;
            this.flagged_additions.push(flag);
            flaggedCol = this.flagged_additions.length - 1;
        }
        this.flagged_additions[flaggedCol].FindAndReplaceRange(min, max, value);
    }


    FindAndReplace(col, item, value) {
        // in column X replace Item with Value for all records
        item = item.toString();
        value = value.toString();
        let flaggedCol = this.FlagExists(col);
        if (flaggedCol == -1) {
            // Flagged column doesn't exist, create one
            let flag = new FlaggedColumn(col, this.flagged_start);
            this.flagged_start++;
            this.flagged_additions.push(flag);
            flaggedCol = this.flagged_additions.length - 1;
        }
        if (item.toUpperCase() == "OTHER") {
            this.flagged_additions[flaggedCol].OtherReplace(value);
        } else {
            this.flagged_additions[flaggedCol].FindAndReplace(item, value);
        }
    }


    FlagExists(colName) {
        for (let i = 0; i < this.flagged_additions.length; i++) {
            if (this.flagged_additions[i].name == colName)
                return i;
        }
        return -1;
    }


    VLookUp(conds, currentCol, replacement) {
        let flaggedCol = SAMPLE.FlagExists(currentCol);
        let col = CalcIndexColumn(currentCol) - 1;
        console.log("vlookup data: ",conds, currentCol, replacement);
        if (flaggedCol == -1) {
            // column is empty, create it
            console.log("No flagged column exists for this vlookup!");
            SAMPLE.flagged_additions.push(new FlaggedColumn(currentCol, SAMPLE.flagged_start));
            SAMPLE.flagged_start++;
            flaggedCol = SAMPLE.flagged_additions.length - 1;
        }
        SAMPLE.flagged_additions[flaggedCol].changes.push("ReplacementString" + replacement);
        let replaced = false;
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
                    if (SAMPLE.records[k][colID].split(" ").join("") != min) {
                        setRecord = false;
                        break;
                    }
                }
            }
            if (setRecord) {
                replaced = true;
                SAMPLE.flagged_additions[flaggedCol].additions[k] = ("ReplacementString" + replacement);
            }
        }
        if (replaced == false) {
            WARNINGS.push("<b>WARNINGS:</b> Found nothing which matched combine condition for: '" + currentCol + "'.");
            TEXTWARNINGS.push("WARNINGS: Found nothing which matched combine condition for: '" + currentCol + "'.");
        }
    }


    PrepareExport() {
        for (let i = 0; i <this.flagged_additions.length; i++) {
            this.flagged_additions[i].InsertIntoSample();
        }
        for (let i = 0; i < this.records.length; i++) {
            this.records[i] = this.records[i].join(",");
        }
    }


    ExportDeleted() {
        let fullData = [];
    	for (const [key, value] of SAMPLE.deletedRecords.entries()) {
    		fullData.push("Deleted from filter in column: "  + key.toString() + "\n");
            fullData.push(this.records[0]);
            for (let i = 0; i < value.length; i++) {
                fullData.push(value[i].join(","));
            }
    	}
        this.DownloadCSV(fullData, "deletedRecords.csv");
    }


    DownloadCSV(csvVar) {
    	if (window.Blob == undefined || window.URL == undefined || window.URL.createObjectURL == undefined) {
    		alert("Your browser doesn't support Blobs");
    		return;
    	}
        let fBlob;
        if (INITIAL_FILETYPE == "csv") {
            fBlob = new Blob(csvVar, {type:"text/csv"});
            let downloadLink = document.createElement("a");
            downloadLink.download = "RENAME_ME." + INITIAL_FILETYPE;
            downloadLink.href = window.URL.createObjectURL(fBlob);
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
            downloadLink.click();
        } else {

            let fileExporter = new Worker("export_worker.js");
            let buff;
    		fileExporter.onmessage = function(event) {
    			fBlob = new Blob([event.data], {type:"application/octet-stream"});
                let downloadLink = document.createElement("a");
                downloadLink.download = "RENAME_ME.xlsx";
                downloadLink.href = window.URL.createObjectURL(fBlob);
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                fileExporter.terminate();
    		};
            for (var i = 0; i < csvVar.length; i++) {
                csvVar[i] = $.csv.toArray(csvVar[i]);
            }
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
