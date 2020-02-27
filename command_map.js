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
        name: "GRAPH",
        length: 2,
        validation: IsGraphCmd,
        callback: GraphCmdCallback,
    },
    {
        name: "FindAndReplace",
        length: 1,
        validation: IsDefault,
        callback: DefaultCallback,
    },
];


function IsGraphCmd(line) {
    return line.toUpperCase().includes("GRAPH");
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


function GraphCmdCallback(contents, index) {
    // GRAPH/tcol
    let line = contents[index].split("\t");
    if (line.length > 2) {
        let name = line[2].split(" ").join("").trim();
        if (name != "")
            SAMPLE.VisualizationQueueCol(line[1].trim().toString(), name);
    } else {
        SAMPLE.VisualizationQueueCol(line[1].trim().toString());
    }
    return index;
}


function CopyColumnCallback(contents, index) {
    // COPYCOLUMN/tcol
    let line = contents[index].split("\t");
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
    while (!contents[i].toUpperCase().includes("STOP NAMES")) {
        comparisons.push(contents[i].toUpperCase().split(" ").join("").trim());
        i++;
    }
    for (let j = SAMPLE.records.length - 1; j >= 0; j--) {
        // build comparison string
        result = "";
        for (let l = 0; l < combinedCols.length; l++) {
            result += SAMPLE.records[j][combinedCols[l]];
        }
        result = result.split(" ").join("").trim().toUpperCase();
        for (let k = 0; k < comparisons.length; k++) {
            // compare
            if (comparisons[k] == result) {
                SAMPLE.DeleteRecordByIndex(combinedCols[0], j);
                break;
            }
        }
    }
    return i;
}


function EvalEmailsCallback(contents, index) {
    // EVALEMAILS\tCname1,Cname2,...
    let line = contents[index].split("\t");
    let emailCols = line[1].split(" ").join("").split(",");
    for (let i = 0; i < emailCols.length; i++) {
        emailCols[i] = CalcIndexColumn(emailCols[i].toString()) - 1;
    }
    console.log("email cols: ", emailCols);
    SAMPLE.CreateEmails("EMAIL", emailCols);
    return index;
}


function MergeCallback(contents, index) {
    // MERGEPHONENUM\ColA, ColB
    let line = contents[index].split("\t");
    let cols = line[1].split(" ").join("").split(",");
    console.log(line, cols);
    SAMPLE.MergePhone(cols);
    return index;
}


function MakeTokensCallback(contents, index) {
    // CREATETOKENS
    console.log("run make tokens CB");
    SAMPLE.GenerateTokens("TOKEN");
    return index;
}


function DefaultCallback(contents, index) {
    // do default command behaviour
    let currentCol = undefined;
    for (let i = index; i < contents.length; i++) {
        // we need to know if this is a column or a find and replacement
        let line = contents[i].trim().split("\t");
        if (line.length == 1) {
            if (currentCol !== undefined) {
                // this could be a combine
                if (contents[i].toUpperCase().includes("COMBINE")) {
                    i = CombineCallback(contents, i, currentCol);
                } else {
                    return i;
                }
            } else {
                currentCol = line[0];
            }
        } else {
            // find and replacement
            let original = line[0].toUpperCase().split(",");
            let replacement = line[1];
            for (let j = 0; j < original.length; j++) {
                if (original[j].includes("-")) {
                    // this is a range
                    SAMPLE.FindAndReplaceRange(currentCol, original[j].split("-"), replacement);
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
    for (let i = index + 1; i < contents.length; i++) {
        let line = contents[i].trim().split("\t");
        let deleteVal = line[0].toUpperCase();

        if (deleteVal.includes(",")) {
            // list
            deleteVal = deleteVal.split(",");
            for (let j = 0; j < deleteVal.length; j++) {
                SAMPLE.DeleteRecords(currentCol, deleteVal[j]);
            }
        } else if (deleteVal.includes("STOP DELETE")) {
            // stop deletion
            return i;
        } else {
            // single delete
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
            let vmax = rangeVals.length > 1 ? rangeVals[1] : rangeVals[0];
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
            return Syntax[i].callback(contents, index);
        }
    }
    return index;
}
