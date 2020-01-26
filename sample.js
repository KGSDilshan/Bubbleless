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
    }

    Add(value) {
        this.additions.push(value);
    }

    InsertIntoSample() {
        this.additions[0] = "FLAGGED_" + this.additions[0];
        let unaccounted = [];
        for (let i = 0; i < SAMPLE.records.length; i++) {
            if (!this.changes.includes(this.additions[i])) {
                if (!unaccounted.includes(this.additions[i]) && i > 0) {
                    WARNINGS.push("<b>WARNINGS:</b> In column '" + this.name + "' found unaccounted value '" + this.additions[i] + "'");
                    unaccounted.push(this.additions[i]);
                }
            }
            SAMPLE.records[i].splice(this.index, 0, this.additions[i].replace(/ReplacementString/g, ''));
        }
    }

    FindAndReplace(find, replace) {
        this.changes.push("ReplacementString" + replace);
        for (let i = 0; i < this.additions.length; i++) {
            if (this.additions[i] == find)
                this.additions[i] = "ReplacementString" + replace;
        }
    }

    OtherReplace(replacementCode) {
        this.changes.push("ReplacementString" + replacementCode);
        for (let i = 1; i < this.additions.length; i++) {
            if (!this.additions[i].includes("ReplacementString"))
                this.additions[i] = "ReplacementString" + replacementCode;
        }
    }

    FindAndReplaceRange(min, max, replace) {
        this.changes.push("ReplacementString" + replace);
        for (let i = 0; i < this.additions.length; i++) {
            if (parseInt(this.additions[i]) <= max && parseInt(this.additions[i]) >= min)
                this.additions[i] = "ReplacementString" + replace;
        }
    }

}


class Sample {
    constructor(data) {
        this.records = [];
        this.modifiedCols = [];
        this.flagged_additions = [];
        this.flagged_start = UNCHANGED_ROWS;

        for (let i = 0; i < data.length; i++) {
            this.records.push(data[i].split(","));
            if (this.records[i] == "")
                this.records.splice(i, 1);
        }
        this.replacements = [];
    }

    DeleteRecords(col, name) {
        let colID = CalcIndexColumn(col) - 1;
        for (let i = this.records.length - 1; i >= 0; i--) {
            // delete matching records
            if (this.records[i][colID].toUpperCase() == name) {
                this.records.splice(i, 1);
                // delete row from flagged column
                for (let j = 0; j < this.flagged_additions.length; j++) {
                    this.flagged_additions[j].additions.splice(i, 1);
                }
            }
        }
    }

    FindAndReplaceRange(col, rangedArr, value) {
        value = value.toString();
        let min = parseInt(rangedArr[0]);
        let max = parseInt(rangedArr[1]);
        let flaggedCol = this.FlagExists(col);
        let colID = CalcIndexColumn(col) - 1;
        if (flaggedCol == -1) {
            // Flagged column doesn't exist
            // loop through records and do the replacements
            let flag = new FlaggedColumn(col, this.flagged_start);
            this.flagged_start++;
            for (let i = 0; i < this.records.length; i++) {
                if (parseInt(this.records[i][colID]) >= min && parseInt(this.records[i][colID]) <= max) {
                    flag.Add("ReplacementString" + value);
                } else {
                    flag.Add(this.records[i][colID]);
                }
            }
            flag.changes.push("ReplacementString" + value);
            this.flagged_additions.push(flag);
        } else {
            // Flagged column exists
            this.flagged_additions[flaggedCol].FindAndReplaceRange(min, max, value);
        }
    }

    FindAndReplace(col, item, value) {
        // in column X replace Item with Value for all records
        item = item.toString();
        value = value.toString();
        let flaggedCol = this.FlagExists(col);
        let colID = CalcIndexColumn(col) - 1;
        if (flaggedCol == -1) {
            // Flagged column doesn't exist
            // loop through records and do the replacements
            let flag = new FlaggedColumn(col, this.flagged_start);
            flag.changes.push("ReplacementString" + value);
            this.flagged_start++;
            if (item.toUpperCase() == "OTHER") {
                flag.OtherReplace(value);
                this.flagged_additions.push(flag);
                return;
            }
            for (let i = 0; i < this.records.length; i++) {
                if (this.records[i][colID] == item) {
                    flag.Add("ReplacementString" + value);
                } else {
                    flag.Add(this.records[i][colID]);
                }
            }
            this.flagged_additions.push(flag);
        } else {
            // Flagged column exists
            if (item.toUpperCase() == "OTHER") {
                this.flagged_additions[flaggedCol].OtherReplace(value);
                return;
            }
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

    PrepareExport() {
        for (let i = 0; i <this.flagged_additions.length; i++) {
            this.flagged_additions[i].InsertIntoSample();
        }
        for (let i = 0; i < this.records.length; i++) {
            this.records[i] = this.records[i].join(",");
        }
    }

    DownloadCSV(filename="YourFilename.csv") {
        let csvFile;
        let downloadLink;

    	if (window.Blob == undefined || window.URL == undefined || window.URL.createObjectURL == undefined) {
    		alert("Your browser doesn't support Blobs");
    		return;
    	}

        csvFile = new Blob(this.records, {type:"text/csv"});
        downloadLink = document.createElement("a");
        downloadLink.download = filename;
        downloadLink.href = window.URL.createObjectURL(csvFile);
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
    }

}
