class FlaggedColumn {
    constructor(columnName, index) {
        this.name = columnName;
        this.additions = [];
        this.index = index;
    }

    Add(value) {
        this.additions.push(value);
    }

    InsertIntoSample() {
        this.additions[0] = "FLAGGED_" + this.additions[0];
        for (let i = 0; i < SAMPLE.records.length; i++) {
            SAMPLE.records[i].splice(this.index, 0, this.additions[i].replace(/ReplacementString/g, ''));
        }
    }

    FindAndReplace(find, replace) {
        for (let i = 0; i < this.additions.length; i++) {
            if (this.additions[i] == find)
                this.additions[i] = "ReplacementString" + replace;
        }
    }

}


class Sample {
    constructor(data) {
        this.records = [];
        this.modifiedCols = [];
        this.warnings = [];
        this.flagged_additions = [];
        this.flagged_start = UNCHANGED_ROWS;
        for (let i = 0; i < data.length; i++) {
            this.records.push(data[i].split(","));
            if (this.records[i] == "")
                this.records.splice(i, 1);
        }
    }

    FindAndReplace(col, item, value) {
        // in column X replace Item with Value for all records
        item = item.toString();
        value = value.toString();
        let flaggedCol = this.FlagExists(col);
        let colID = CalcIndexColumn(col) - 1;
        console.log("For col", col, "flagged column is", flaggedCol, colID);
        if (flaggedCol == -1) {
            console.log("Flagged Col not found");
            // Flagged column doesn't exist
            // loop through records and do the replacements
            let flag = new FlaggedColumn(col, this.flagged_start);
            this.flagged_start++;
            for (let i = 0; i < this.records.length; i++) {
                if (this.records[i][colID] == item) {
                    flag.Add("ReplacementString" + value);
                } else {
                    flag.Add(this.records[i][colID]);
                }
            }
            console.log(flag);
            this.flagged_additions.push(flag);
        } else {
            // Flagged column exists
            console.log("Flagged Col found");
            this.flagged_additions[flaggedCol].FindAndReplace(item, value);
        }
    }

    FlagExists(colName) {
        console.log("Running");
        for (let i = 0; i < this.flagged_additions.length; i++) {
            console.log("fname is ", this.flagged_additions[i].name, "name searching", colName);
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

}
