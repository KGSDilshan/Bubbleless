// each single-line command has a syntax
var Syntax = [
    {
        name: "//Comment",
        length : 1,
        validation: IsCommentCmd,
        callback: CommentCallback,
    },
    {
        name: "MERGEPHONENUMS",
        length : 3,
        validation: IsMerge,
        callback: MergeCallback,
    },
    {
        name: "DELETE",
        length : 1,
        validation: IsDeleteCmd,
        callback: DeleteCallback,
    },
    {
        name: "NamesList",
        length: 2,
        validation: IsNamesList,
        callback: NamesListCallback,
    },
    {
        name: "CopyColumn",
        length: 2,
        validation: IsCopyColumn,
        callback: CopyColumnCallback,
    },
    {
        name: "CreateTokens",
        length: 1,
        validation: IsTokenCmd,
        callback: MakeTokensCallback,
    },
    {
        name: "EvalEmails",
        length: 2,
        validation: IsEmailCmd,
        callback: EvalEmailsCallback,
    },
    {
        name: "ColNameSet",
        length: 2,
        validation: IsNameSet,
        callback: NameSetCallback,
    },
    {
        name: "GRAPH",
        length: 2,
        validation: IsGraphCmd,
        callback: GraphCmdCallback,
    },
    {
        name: "COUNTIF+1",
        length: 1,
        validation: IsCountIfPlusOneCmd,
        callback: CountIfPlusOneCmdCallback,
    },
    {
        name: "COUNTIF04",
        length: 1,
        validation: IsCountIf04Cmd,
        callback: CountIf04CmdCallback,
    },
    {
        name: "COUNTIF",
        length: 1,
        validation: IsCountIfCmd,
        callback: CountIfCmdCallback,
    },
    {
        name: "FilterDuplicate",
        length: 1,
        validation: IsFilterDuplicateCmd,
        callback: FilterDuplicateCmdCallback,
    },
    {
        name: "FIPS",
        length: 1,
        validation: IsFipsCmd,
        callback: FipsCmdCallback,
    },
    {
        name: "NeighborhoodDensity",
        length: 1,
        validation: IsNeighborhoodDensityCmd,
        callback: NeighborhoodDensityCmdCallback,
    },
    {
        name: "PartisanScore",
        length: 1,
        validation: IsPartisanCmd,
        callback: PartisanCmdCallback,
    },
    {
        name: "NCRegion",
        length: 1,
        validation: IsNCRegionCmd,
        callback: NCRegionCmdCallback,
    },
    {
        name: "FindAndReplace",
        length: 1,
        validation: IsDefault,
        callback: DefaultCallback,
    },
];


function IsNameSet(line) {
    return line.toUpperCase().startsWith("**");
}

function IsPartisanCmd(line) {
    return line.toUpperCase().includes("PARTISAN");
}

function IsFipsCmd(line) {
    return line.toUpperCase().includes("FIPS");
}

function IsNeighborhoodDensityCmd(line) {
    return line.toUpperCase().includes("NDENSITY");
}

function IsNCRegionCmd(line) {
    return line.toUpperCase().includes("NCREGION");
}

function IsFilterDuplicateCmd(line) {
    return line.toUpperCase().includes("RMDUPE");
}

function IsGraphCmd(line) {
    return line.toUpperCase().includes("GRAPH");
}


function IsCountIf04Cmd(line) {
    // COUNTIF04 max\tX,1\tY,2\tN,5...
    return line.toUpperCase().includes("COUNTIF04");
}

function IsCountIfPlusOneCmd(line) {
    // COUNTIF+1 max\tX,1\tY,2\tN,5...
    return line.toUpperCase().includes("COUNTIF+1");
}

function IsCountIfCmd(line) {
    // COUNTIF max\tX,1\tY,2\tN,5...
    return line.toUpperCase().includes("COUNTIF");
}


function IsCommentCmd(line) {
    return line.startsWith("//");
}


function IsMerge(line) {
    //MERGEPHONENUMS\tCOLUMNA,COLUMNB
    let val = line.split("\t");
    return val[0].toUpperCase().includes("MERGEPHONENUM");
}


function IsTokenCmd(line) {
    return line.toUpperCase().includes("CREATETOKENS");
}


function IsEmailCmd(line) {
    return line.toUpperCase().includes("EVALEMAILS");
}


function IsCopyColumn(line) {
    line = line.trim().split("\t");
    return line.length == 2 && line[0].toUpperCase().includes("COPYCOLUMN");
}


function IsDefault(line) {
    line = line.trim().split("\t");
    return line.length == 1 && line[0] != '';
}


function IsDeleteCmd(line) {
    return line.toUpperCase().includes("DELETE");
}


function IsNamesList(line) {
    return line.toUpperCase().includes("NAMESLIST");
}


function CommentCallback(contents, index) {
    /* //comment */
    return index;
}


function NameSetCallback(contents, index) {
    NAME_OVERRIDE = contents[index].replace("**", "").trim();
    console.log(NAME_OVERRIDE);
    return index;
}


function GraphCmdCallback(contents, index) {
    // GRAPH/tcol
    let line = contents[index].split("\t");
    if (line.length > 2) {
        let name = line[2].split(" ").join("").trim();
        if (name != "")
            SAMPLE.VisualizationQueueColGraph(line[1].trim().toString(), name);
    } else {
        SAMPLE.VisualizationQueueColGraph(line[1].trim().toString());
    }
    return index;
}


function FilterDuplicateCmdCallback(contents, index) {
    // RMDUPE/tcol
    let line = contents[index].split("\t");
    let name = line[1].split(" ").join("").trim();
    SAMPLE.FilterDuplicate(name);
    return index;
}

function FipsCmdCallback(contents, index) {
    // FIPS/tState/tcol
    let line = contents[index].split("\t");
    let stateCol = line[1].split(" ").join("").trim();
    let col = line[2].split(" ").join("").trim();
    SAMPLE.CodeFips(stateCol, col);
    return index;
}

function NeighborhoodDensityCmdCallback(contents, index) {
    // NDensity/tcol
    let line = contents[index].split("\t");
    let col = line[1].split(" ").join("").trim();
    SAMPLE.CodeNDensity(col);
    return index;
}

function PartisanCmdCallback(contents, index) {
    // PARTISAN/tcol
    let line = contents[index].split("\t");
    let col = line[1].split(" ").join("").trim();
    SAMPLE.CodePartisanScore(col);
    return index;
}

function NCRegionCmdCallback(contents, index) {
    // NCREGION/tcol
    let line = contents[index].split("\t");
    let col = line[1].split(" ").join("").trim();
    SAMPLE.CodeNCRegion(col);
    return index;
}


function CountIfCmdCallback(contents, index) {
    // COUNTIF Max\tX,1\tY,2\tN,5...
    let line = contents[index].toUpperCase().split(" ").join("").split("\t");
    let max = line.splice(0, 1)[0].split("COUNTIF")[1];
    for (let i = 0; i < line.length; i++) {
        line[i] = [CalcIndexColumn(line[i].split(",")[0]) - 1,(line[i].split(",")[1]).toUpperCase()]
    }
    console.log(line);
    // create a new flag
    let name = "CountIfSeries";
    if (NAME_OVERRIDE) {
        name = NAME_OVERRIDE;
    }
    let flag = SAMPLE.FlagExists(CURRENT_COL);
    console.log(flag, CURRENT_COL);
    if (flag.flag === undefined) {
        flag = new FlaggedColumn(CURRENT_COL, SAMPLE.flagged_start);
    }
    for (let i = 0; i <= line.length; i++) {
        flag.changes.push("ReplacementString" + i);

    }
    for (let j = 0; j < SAMPLE.records.length; j++) {
        let counter = 0;
        for (let i = 0; i < line.length; i++) {
            // get what we're looking for
            let col = line[i][0];
            let value = line[i][1];
            // loop through each record and check each
            if ((SAMPLE.records[j][col]).toUpperCase() == value) {
                counter++;
            }
        }
        if (counter > max) {
            counter = max;
        }
        flag.additions[j] = "ReplacementString" + counter;
    }
    SAMPLE.flagged_start++;
    SAMPLE.flagged_additions.push(flag);
    return index;
}

function CountIfPlusOneCmdCallback(contents, index) {
    // COUNTIF+1 Max\tX,1\tY,2\tN,5...
    let line = contents[index].toUpperCase().split(" ").join("").split("\t");
    let max = line.splice(0, 1)[0].split("COUNTIF+1")[1];
    for (let i = 0; i < line.length; i++) {
        line[i] = [CalcIndexColumn(line[i].split(",")[0]) - 1,(line[i].split(",")[1]).toUpperCase()]
    }
    // create a new flag
    let name = "CountIfSeries";
    if (NAME_OVERRIDE) {
        name = NAME_OVERRIDE;
    }
    let flag = SAMPLE.FlagExists(CURRENT_COL);
    console.log(flag, CURRENT_COL);
    if (flag.flag === undefined) {
        flag = new FlaggedColumn(CURRENT_COL, SAMPLE.flagged_start);
    }
    for (let i = 0; i <= line.length; i++) {
        flag.changes.push("ReplacementString" + i);

    }
    for (let j = 0; j < SAMPLE.records.length; j++) {
        let counter = 0;
        for (let i = 0; i < line.length; i++) {
            // get what we're looking for
            let col = line[i][0];
            let value = line[i][1];
            // loop through each record and check each
            if ((SAMPLE.records[j][col]).toUpperCase() == value) {
                counter++;
            }
        }
        counter += 1;
        if (counter > max) {
            counter = max;
        }
        flag.additions[j] = "ReplacementString" + counter;
    }
    SAMPLE.flagged_start++;
    SAMPLE.flagged_additions.push(flag);
    return index;
}


function CountIf04CmdCallback(contents, index) {
    // COUNTIF+1 Max\tX,1\tY,2\tN,5...
    let line = contents[index].toUpperCase().split(" ").join("").split("\t");
    let max = line.splice(0, 1)[0].split("COUNTIF04")[1];
    for (let i = 0; i < line.length; i++) {
        line[i] = [CalcIndexColumn(line[i].split(",")[0]) - 1,(line[i].split(",")[1]).toUpperCase()]
    }
    // create a new flag if one doesn't exist
    let name = "CountIfSeries";
    if (NAME_OVERRIDE) {
        name = NAME_OVERRIDE;
    }
    let flag = SAMPLE.FlagExists(CURRENT_COL);
    if (flag.flag === undefined) {
        flag = new FlaggedColumn(CURRENT_COL, SAMPLE.flagged_start);
    }
    for (let i = 0; i <= line.length; i++) {
        flag.changes.push("ReplacementString" + i);

    }
    for (let j = 0; j < SAMPLE.records.length; j++) {
        let counter = 0;
        for (let i = 0; i < line.length; i++) {
            // get what we're looking for
            let col = line[i][0];
            let value = line[i][1];
            // loop through each record and check each
            if ((SAMPLE.records[j][col]).toUpperCase() == value) {
                counter++;
            }
        }
        if (counter == 0)
            counter = 4;
        if (counter > max) {
            counter = max;
        }
        flag.additions[j] = "ReplacementString" + counter;
    }
    SAMPLE.flagged_start++;
    SAMPLE.flagged_additions.push(flag);
    return index;
}


function CopyColumnCallback(contents, index) {
    // COPYCOLUMN/tcol
    let line = contents[index].toUpperCase().split("\t");
    SAMPLE.CopyCol(line[1].trim().toString());
    return index;
}


function NamesListCallback(contents, index) {
    // NAMESLIST\tCname,Cname2
    let line = contents[index].split("\t");
    let combinedCols = line[1].split(" ").join("").split(",");
    for (let i = 0; i < combinedCols.length; i++) {
        combinedCols[i] = CalcIndexColumn(combinedCols[i].toString()) - 1;
    }
    let i = index + 1;
    let comparisons = [];
    if (DELETESMAP == undefined) {
        DELETESMAP = new Map();
    }
    while (!contents[i].toUpperCase().includes("STOP NAMES")) {
        let cmpVal = contents[i].toUpperCase().split(" ").join("").trim();
        comparisons.push(cmpVal);
        DELETESMAP.set(cmpVal, 0);
        i++;
    }

    for (let j = SAMPLE.records.length - 1; j >= 0; j--) {
        // build comparison string
        let result = "";
        for (let l = 0; l < combinedCols.length; l++) {
            result += SAMPLE.records[j][combinedCols[l]];
        }
        result = result.split(" ").join("").trim().toUpperCase();
        for (let k = 0; k < comparisons.length; k++) {
            // compare
            if (comparisons[k] == result) {
                DELETESMAP.set(comparisons[k], (DELETESMAP.get(comparisons[k]) + 1) || 1);
                SAMPLE.DeleteRecordByIndex(combinedCols[0], j);
                break;
            }
        }
        for (var m = 0; m < BANNED_NAMES.length; m++) {
            if (BANNED_NAMES[m] == result) {
                DELETESMAP.set(BANNED_NAMES[m], (DELETESMAP.get(BANNED_NAMES[m]) + 1) || 1);
                SAMPLE.DeleteRecordByIndex(combinedCols[0], j);
                break;
            }
        }
    }
    console.log("DELETES MAP:", DELETESMAP);
    return i;
}


function EvalEmailsCallback(contents, index) {
    // EVALEMAILS\tCname1,Cname2,...
    let line = contents[index].split("\t");
    let emailCols = line[1].split(" ").join("").split(",");
    for (let i = 0; i < emailCols.length; i++) {
        emailCols[i] = CalcIndexColumn(emailCols[i].toString()) - 1;
    }
    //console.log("email cols: ", emailCols);
    SAMPLE.CreateEmails("EMAIL", emailCols);
    return index;
}


function MergeCallback(contents, index) {
    // MERGEPHONENUM\ColA, ColB, ColC, ..
    let line = contents[index].split("\t");
    let cols = line[1].split(" ").join("").split(",");
    console.log(line, cols);
    SAMPLE.MergePhone(cols);
    return index;
}


function MakeTokensCallback(contents, index) {
    // CREATETOKENS
    //console.log("run make tokens CB");
    SAMPLE.GenerateTokens("TOKEN");
    return index;
}


function DefaultCallback(contents, index) {
    // do default command behaviour
    let currentCol = undefined;
    for (let i = index; i < contents.length; i++) {
        // other command
        for (let s = 0; s < Syntax.length - 1; s++) {
            if (Syntax[s].validation(contents[i])) {
                return i - 1;
            }
        }

        // we need to know if this is a column or a find and replacement
        let line = contents[i].trim().toUpperCase().split("\t");
        if (line.length == 1) {
            if (line[0].includes("COMBINE") || (currentCol !== undefined)) {
                currentCol = CURRENT_COL;
                // this could be a combine
                if (contents[i].toUpperCase().includes("COMBINE")) {
                    i = CombineCallback(contents, i, currentCol);
                } else {
                    return i;
                }
            } else {
                currentCol = line[0].toUpperCase();
                CURRENT_COL = currentCol;
            }
        } else {
            // find and replacement
            let original = line[0].toUpperCase().split(" ").join("").split(",");
            let replacement = line[1].split(" ").join("");
            //console.log(original, replacement);
            for (let j = 0; j < original.length; j++) {
                if (original[j].toUpperCase() == "BLANK") {
                    original[j] = "";
                }
                if (original[j].includes("-")) {
                    // this is a range maybe
                    let val1 = original[j].split("-");
                    if (Number.isInteger(parseInt(val1))) {
                        SAMPLE.FindAndReplaceRange(currentCol, original[j].split("-"), replacement);
                    } else {
                        SAMPLE.FindAndReplace(currentCol, original[j], replacement);
                    }
                } else {
                    SAMPLE.FindAndReplace(currentCol, original[j], replacement);
                }
            }
        }
    }
}


function DeleteCallback(contents, index) {
    // get column to delete from
    let currentCol = contents[index].toUpperCase().split("\t").join("").split("DELETE").join("").trim();
    // delete every column
    if (DELETESMAP == undefined) {
        DELETESMAP = new Map();
    }
    for (let i = index + 1; i < contents.length; i++) {
        let line = contents[i].trim().split("\t");
        let deleteVal = line[0].toUpperCase();

        if (deleteVal.includes(",")) {
            // list
            deleteVal = deleteVal.split(",");
            for (let j = 0; j < deleteVal.length; j++) {
                DELETESMAP.set(deleteVal[j], (DELETESMAP.get(deleteVal[j]) | 0));
                SAMPLE.DeleteRecords(currentCol, deleteVal[j]);
            }
        } else if (deleteVal.includes("STOP DELETE")) {
            // stop deletion
            return i;
        } else {
            // single delete
            //DELETESMAP.set(deleteVal, (DELETESMAP.get(deleteVal) ? 0 : DELETESMAP.get(deleteVal)));
            SAMPLE.DeleteRecords(currentCol, deleteVal);
        }
    }
    return contents.length;
}


function CombineCallback(contents, index, currentCol) {
    // get the replacement
    let line = contents[index].trim().split("\t");
    let replacement =  line[0].toUpperCase().split("COMBINE").join("").trim();
    let j = index + 1;
    let conds = [];
    while (true) {
        let temp = contents[j].trim().toUpperCase().split("\t");
        if (temp.includes("STOP COMBINE")) {
            i = j;
            break;
        } else {
            let rangeVals = temp[1].split("-");
            let vmin = rangeVals[0];
            let vmax;
            if (Number.isInteger(parseInt(vmin))) {
                vmax = rangeVals.length > 1 ? rangeVals[1] : rangeVals[0];
            } else {
                vmax = temp[1];
                vmin = temp[1];
            }
            if (vmin != vmax) {
                // is an actual range
                vmin = parseInt(vmin);
                vmax = parseInt(vmax);
            }
            conds.push({col: (CalcIndexColumn(temp[0]) - 1), min: vmin, max : vmax});
            j++;
        }
    }
    if (conds.length > 0) {
        SAMPLE.VLookUp(conds, currentCol, replacement);
    }
    return j;
}


function RunCommand(contents, index) {
    for (let i = 0; i < Syntax.length; i++) {
        if (Syntax[i].validation(contents[index])) {
            try {
                return Syntax[i].callback(contents, index);
            }
            catch (e) {
                alert("Error in executing command: " + contents[index]);
                console.log(e);
                return -1;
            }
        }
    }
    return index;
}
