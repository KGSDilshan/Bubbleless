class ALClient extends BaseClient {
    constructor() {
        super("AL");
    }

    clientSpecificWarnings() {
        if (RAN_CSWARNINGS)
            return;
        RAN_CSWARNINGS = true;
        // if all quotas except splits were not inactive, warn
        for (let i = 0; i < QUOTA_GROUPS.length; i++) {
            for (let j = 0; j < QUOTA_GROUPS[i].subQuotas.length; j++) {
                let q = QUOTA_GROUPS[i].subQuotas[j];
                if (q.active == true && !q.name.toLowerCase().includes("split")) {
                    // warn quota is active
                    QUOTA_GROUPS[i].warnings.push("WARNING: " + q.name + ", quota is active. Made inactive (Checklist)");
                    q.active = false;
                }
            }
        }
        // check if Gender has split quotas
        let checked = false;
        for (let i = 0; i < QUOTA_GROUPS.length; i++) {
            if (QUOTA_GROUPS[i].getName().toLowerCase().includes("gender") || QUOTA_GROUPS[i].getName().toLowerCase().includes("sex")) {
                checked = true;
                if (!QUOTA_GROUPS[i].hasSplits) {
                    console.log(QUOTA_GROUPS[i], "missing gender split");
                    QUOTA_GROUPS[i].warnings.push("WARNING: Gender Quota missing split quota");
                    break;
                }
            }
        }
        if (checked == false && QUOTA_GROUPS.length > 0) {
            QUOTA_GROUPS[0].warnings.push("WARNING: Gender Quota not defined");
        }
    }
}

class DBClient extends BaseClient {
    constructor() {
        super("DB");
    }

    clientSpecificQuotaTransformations(group) {
        let curGroupName = group.group_name.toLowerCase();

        // Add other offsetter for ethnicity quota
        if (curGroupName.includes("ethnicity") || curGroupName.includes("race")) {
            let offset = 0;
            let otherExists = false;
            let isRaw = !group.rawSubQuotas[0][1].includes("%");

            // Check for other option existing in current quotas
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                let quota = group.rawSubQuotas[i];
                if(quota[0].toLowerCase().includes("other")) {
                    otherExists = true;
                    break;
                } else {
                    offset += parseInt(quota[1].split("%").join(""));
                }
            }

            // Create an other-offsetter quota if the other quota does not exist
            if (!otherExists && ((isRaw && offset == group.totalN) || (!isRaw && offset == 100))) {
                console.log(group, "Error: Ethnicity - Other quota does not exist");
                let newQuota = new Quota(
                    group,
                    "Other OFFSETTER",
                    isRaw ? (group.totalN - offset).toString() : (100 - offset) + "%",
                    group.rawSubQuotas[0][2],
                    [group.rawSubQuotas.length + 1],
                    CLIENT
                    );
                newQuota.active = false;

                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.getName() + " - Other quota does not exist. Created. (Checklist)",
                    callback: this.appendEthnicityOtherHandler,
                    group: group,
                    args: {
                        newQuota: newQuota
                    }
                });
            }
        }

        // Balance all quotas by splits except Geo, Lang, Phonetype
        if ((!(curGroupName.includes("geo")
        || curGroupName.includes("lang")
        || curGroupName.includes("phone")))) {

            let showErrors = false;
            let splitsToAdd = [];
            for (let i = 0; i < QUOTA_HEADERS.length; i++) {
                let quotaHeader = QUOTA_HEADERS[i].toLowerCase();
                if (!group.splits.includes(quotaHeader) && quotaHeader.includes("split") && quotaHeader != curGroupName) {
                    showErrors = true;
                    splitsToAdd.push("(" + QUOTA_HEADERS[i] + ")");
                }
            }

            if (showErrors) {
                console.log(group, "Error: Splits exist but quotas are not split");
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.getName() + " quotas missing split quotas. Add split quotas for " + curGroupName + "? (Checklist)",
                    callback: this.splitQuotasBySplitHandler,
                    group: group,
                    args: {
                        splits: splitsToAdd
                    }
                });
            }
        }
    }

    clientSpecificWarnings() {
        if (RAN_CSWARNINGS)
            return;
        RAN_CSWARNINGS = true;
        for (let j = 0; j < QUOTA_GROUPS.length; j++) {
            let curGroup = QUOTA_GROUPS[j];
            let curGroupName = QUOTA_GROUPS[j].getName().toLowerCase();

            // Gender codes are reversed
            /*
            - If gender starts with an "m", it's male
            - If gender starts with an "f", it's female
            */
            if ((curGroupName.includes("gender")
            || curGroupName.includes("sex"))) {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if(quota.rawName.toLowerCase().startsWith("m") && quota.qCodes[0] == 1) {
                        console.log(curGroup, "Error: Gender - Male is coded as 1 instead of 2. Recoded as 2");
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: " + quota.name + " quota coded as 1, recode to 2? (Checklist)",
                            callback: this.genderMiscodedHandler,
                            group: curGroup,
                            args: {
                                subQuotaIndex: i,
                                correctCode: 2
                            }
                        });
                    } else if (quota.rawName.toLowerCase().startsWith("f") && quota.qCodes[0] == 2) {
                        console.log(curGroup, "Error: Gender - Female is coded as 2 instead of 1. Recoded as 1");
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: " + quota.name + " quota coded as 2, recode to 1? (Checklist)",
                            callback: this.genderMiscodedHandler,
                            group: curGroup,
                            args: {
                                subQuotaIndex: i,
                                correctCode: 1
                            }
                        });
                    }
                }
            }

            // Phone Type 50% LL, 50% Cell
            if (curGroupName.includes("phone")) {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    let n = quota.getRawNSize();
                    if(n !== curGroup.totalN / 2) {
                        console.log(curGroup, "Error: Phone Type - " + quota.name + " limit is not half of total N size");
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: " + quota.name + " quota not 50% of total N size. Changed to 50% of total N size? (Checklist)",
                            callback: this.phoneTypeDefaultLimitHandler,
                            group: curGroup,
                            args: {
                                subQuotaIndex: i
                            }
                        });
                    }
                }
            }

            // Presidential vote quota is inactive (??? - perhaps have the programmer add this in?)
            if ((curGroupName.includes("pres") || curGroupName.includes("vote 20"))) {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (quota.active) {
                        console.log(curGroup, "Error: Presidential Vote quota is active");
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: A presidential vote quota is active. Deactivate? (Checklist)",
                            callback: this.presVoteActiveHandler,
                            group: curGroup,
                            args: {}
                        });
                        break;
                    }
                }
            }
        }
    }

    appendEthnicityOtherHandler(group, args) {
        console.log("Ethnicity Other added!");
        if (args) {
            group.subQuotas.push(args.newQuota);
        } else {
            throw "Error: No quota object provided to add!";
        }
    }

    splitQuotasBySplitHandler(group, args) {
        for (let i = 0; i < args.splits.length; i++) {
            group.splits.push(args.splits[i]);
        }
        group.hasSplits = true;
    }

    genderMiscodedHandler(group, args) {
        group.subQuotas[args.subQuotaIndex].qCodes[0] = args.correctCode;
    }

    phoneTypeDefaultLimitHandler(group, args) {
        group.subQuotas[args.subQuotaIndex].valLimit = "50";
    }

    // We can just set all of them to false
    presVoteActiveHandler(group) {
        for (var i = 0; i < group.subQuotas.length; i++) {
            group.subQuotas[i].active = false;
        }
    }

}

class RNClient extends BaseClient {
    constructor() {
        super("RN");
    }

    clientSpecificWarnings() {
        if (RAN_CSWARNINGS)
            return;
        RAN_CSWARNINGS = true;
        for (let j = 0; j < QUOTA_GROUPS.length; j++) {
            let curGroup = QUOTA_GROUPS[j];
            let curGroupName = QUOTA_GROUPS[j].getName().toLowerCase();

            // All quotas are inactive save for splits/control messages
            if (!(curGroupName.includes("split") || curGroupName.includes("control"))) {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (quota.active) {
                        console.log(curGroup, "Error: A non-split/control message quota is active");
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: A non-split/control message quota is active. Deactivate " + quota.name + "? (Checklist)",
                            callback: this.activeQuotasHandler,
                            group: curGroup
                        });
                        break;
                    }
                }
            } else {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (!quota.active) {
                        quota.active = true;
                        console.log(curGroup, "Error: A split/control message quota is inactive");
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: A split/control message quota is inactive. Activating " + quota.name + " (Checklist)",
                            callback: this.inactiveSplitsHandler,
                            group: curGroup
                        });
                        break;
                    }
                }
            }

            // Phone type quotas are counters
            if (curGroupName.includes("phone")) {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (!quota.counter) {
                        console.log("Error: Phone type " + quota.rawName + "quota is not a counter.");
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: Phone type " + quota.rawName + " quota is not a counter. Changed to a counter. (Checklist)",
                            callback: this.phonetypeCounterHandler,
                            group: curGroup
                        });
                    }
                    break;
                }
            }
        }
    }

    // Quotas should be inactive; just deactivate the whole thing
    activeQuotasHandler(group) {
        for (var i = 0; i < group.subQuotas.length; i++) {
            group.subQuotas[i].active = false;
        }
    }

    // Phonetype should be counters
    phonetypeCounterHandler(group) {
        for (var i = 0; i < group.subQuotas.length; i++) {
            group.subQuotas[i].counter = true;
        }
    }

    // Splits should be active
    inactiveSplitsHandler(group) {
        for (var i = 0; i < group.subQuotas.length; i++) {
            group.subQuotas[i].active = true;
        }
    }

    finalName(quota, qname, limit) {
        // flex name modification
        let name = qname;
        if (quota.group.isFlex) {
            name += " (" + (quota.group.isRawFlex ? "" : "Flex ") + quota.group.flexAmount +
                (quota.group.isRawFlex ? "" : "%") + " added)";
        }
        return name;
    }
}

class EMClient extends BaseClient {
    constructor() {
        super("EM");
    }

    clientSpecificWarnings() {
        if (RAN_CSWARNINGS)
            return;
        RAN_CSWARNINGS = true;
        for (let j = 0; j < QUOTA_GROUPS.length; j++) {
            let curGroup = QUOTA_GROUPS[j];
            let curGroupName = QUOTA_GROUPS[j].getName().toLowerCase();

            // Group includes counters but does not have flex specified
            if (curGroup.includesCounters()) {
                if (!curGroup.isFlex) {
                    console.log("Error: " + curGroupName + " quotas have counters but no flex.");
                    GLOBAL_WARNINGS.push({
                        message: "WARNING: " + curGroup.getName() + " quotas have counters but no flex. Add default 5% flex? (Checklist)",
                        callback: this.counterWithNoFlexHandler,
                        group: curGroup,
                        args: {}
                    });
                }
            }

            // Check for listed specific stuff
            if (isNOL()) {
                // Everything should be pulling from sample
                if (!curGroupName.includes("split")) {
                    for (let i = 0; i < curGroup.subQuotas.length; i++) {
                        let quota = curGroup.subQuotas[i];
                        // Everything should be pulling from sample
                        if (!quota.qName.startsWith("p")) {
                            let precodeName = "p" + curGroup.getName().split(" ").join("");
                            console.log("Error: " + curGroupName + " quotas are not pulling from a precode.");
                            GLOBAL_WARNINGS.push({
                                message: "WARNING: NOL - " + curGroup.getName() +
                                    " quotas are pulling from a question (" + quota.qName + "). Pull from " +
                                    precodeName + "? (Checklist)",
                                callback: this.pullingFromWrongPlaceHandler,
                                group: curGroup,
                                args: {
                                    subQuotaIndex: i,
                                    qName: precodeName
                                }
                            });
                        }
                    }
                }
            } else {
                // Check for unlisted specific stuff
                if (curGroupName.includes("age")) {
                    for (let i = 0; i < curGroup.subQuotas.length; i++) {
                        let quota = curGroup.subQuotas[i];
                        // The age should be coded in some form
                        if (!quota.qName.toLowerCase().includes("coded")) {
                            console.log("Error: " + curGroupName + " quotas are not pulling from a coded question.");
                            GLOBAL_WARNINGS.push({
                                message: "WARNING: Unlisted - " + curGroup.getName() +
                                    " quotas are not pulling from a coded question. Pull from QXCoded? (Checklist)",
                                callback: this.pullingFromWrongPlaceHandler,
                                group: curGroup,
                                args: {
                                    subQuotaIndex: i,
                                    qName: "QXCoded"
                                }
                            });
                        }
                    }
                }

                if (curGroupName.includes("gender") || curGroupName.includes("sex")) {
                    for (let i = 0; i < curGroup.subQuotas.length; i++) {
                        let quota = curGroup.subQuotas[i];
                        // The gender should be pulling from the qst
                        if (!quota.qName.toLowerCase().startsWith("q")) {
                            console.log("Error: " + curGroupName + " quotas are not pulling from a question.");
                            GLOBAL_WARNINGS.push({
                                message: "WARNING: Unlisted - " + curGroup.getName() +
                                    " quotas are pulling from a precode (" + quota.qName + "). Pull from QX? (Checklist)",
                                callback: this.pullingFromWrongPlaceHandler,
                                group: curGroup,
                                args: {
                                    subQuotaIndex: i,
                                    qName: "QX"
                                }
                            });
                        }
                    }
                }
            }
        }
    }

    counterWithNoFlexHandler(group) {
        group.isFlex = true;
        group.isRawFlex = true;
        group.flexAmount = 5;
    }

    pullingFromWrongPlaceHandler(group, args) {
        group.subQuotas[args.subQuotaIndex].qName = args.qName;
    }

    finalName(quota, qname, limit) {
        // flex name modification
        let name = qname;
        let flexAmt;
        // counter name modification
        if (quota.counter) {
            try {
                flexAmt = quota.group.getRawFlex().toString();
            }
            catch (e) {
                console.log(e + " Defaulting to 5% flex.");
                flexAmt = Math.ceil(quota.group.totalN * 0.05).toString();
            }
            name += " (Max " + limit + " +/- " + flexAmt + ")";
        }
        return name;
    }
}

class NRClient extends BaseClient {
    constructor() {
        super("NR");
    }

    clientSpecificWarnings() {
        if (RAN_CSWARNINGS)
            return;
        RAN_CSWARNINGS = true;
        for (let j = 0; j < QUOTA_GROUPS.length; j++) {
            let curGroup = QUOTA_GROUPS[j];
            let curGroupName = QUOTA_GROUPS[j].getName().toLowerCase();

            // Party must pull from a coded question
            if (curGroupName.includes("party")) {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (!quota.qName.toLowerCase().includes("coded")) {
                        console.log("Error: Party " + quota.rawName + "quota looks like it's pulling from a precode.");
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: Party " + quota.rawName +
                                " quota is pulling from a precode (" + quota.qName + "). Pull from PartyCoded? (Checklist)",
                            callback: this.pullingFromWrongPlaceHandler,
                            group: curGroup,
                            args: {
                                subQuotaIndex: i,
                                qName: "PartyCoded"
                            }
                        });
                    }
                }
            }

            // County quota (if not raw), should be inactive
            if (curGroupName.includes("county")) {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (quota.active) {
                        console.log("Error: Active " + curGroupName + " quota found.");
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: One or more " + curGroup.getName() +
                                " quotas are active. Deactivate? (Checklist)",
                            callback: this.countyActiveHandler,
                            group: curGroup,
                            args: {}
                        });
                    }
                }
            }
        }
    }

    pullingFromWrongPlaceHandler(group, args) {
        group.subQuotas[args.subQuotaIndex].qName = args.qName;
    }

    // We can just set all of them to false
    countyActiveHandler(group) {
        for (var i = 0; i < group.subQuotas.length; i++) {
            group.subQuotas[i].active = false;
        }
    }
}

class TNClient extends BaseClient {
    constructor() {
        super("TN")
    }

    clientSpecificQuotaTransformations(group) {
        let curGroupName = group.group_name.toLowerCase();

        // Internally mode limits should add up to the full n
        // If there are single/dual/tri mode limits specified, and mode limits are percentages
        // it needs to be updated before being made a quota
        // Additionally this means that mode valLimit will always be usable as an n size
        if (curGroupName.includes("mode") && group.rawSubQuotas[0][1].toString().includes("%")) {
            let fullN = getRawSizes();
            fullN = fullN.reduce((accumulator, currentValue) => accumulator + currentValue);
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                let nSize = parseFloat(group.rawSubQuotas[i][1].split("%").join("")) / 100;
                nSize = Math.round(nSize * fullN);
                group.rawSubQuotas[i][1] = nSize.toString();
            }
            // Shouldn't display a warning to user because technically the percentage they enter is correct
            console.log("Mode quotas were percentage; Recalculated so they're using the correct full N.");
        }
    }

    clientSpecificWarnings() {
        if (RAN_CSWARNINGS)
            return;
        RAN_CSWARNINGS = true;
        let modeCounterChecked = false;
        let isMultiMode = false;
        let isPhone = false;
        let isEmail = false;
        let isTexting = false;

        let fullN = 0;
        let roundingOffset = Math.round(fullN / 100);   // 1% of full N
        let numModes = 0;
        let rawSizes = getRawSizes();
        for (let x = 0; x < rawSizes.length; x++) {
            if (rawSizes[x] > 0) {
                numModes++;
            }
        }
        fullN = rawSizes.reduce((accumulator, currentValue) => accumulator + currentValue);

        for (let j = 0; j < QUOTA_GROUPS.length; j++) {
            let curGroup = QUOTA_GROUPS[j];
            let curGroupName = QUOTA_GROUPS[j].getName().toLowerCase();

            // Mode quotas default to equal splits of full N
            if (curGroupName.includes("mode")) {
                modeCounterChecked = true;
                // If there's a mode group use the length of the subquotas to determine number of modes
                let modeSplitN = Math.round(fullN / curGroup.subQuotas.length);
                let quotaNCount = 0;
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    // Compare the limits to the full N split by mode evenly, within 1% of the n size due to rounding
                    // quota.valLimit should always be 'raw' due to the check in clientSpecificQuotaTransformations
                    if (quota.valLimit < modeSplitN - roundingOffset || quota.valLimit > modeSplitN + roundingOffset) {
                        // Can't tell whether the n-sizes are correct here so just issue a warning
                        console.log("Warning: Mode limits are not in range of the default.");
                        //curGroup.warnings.push("WARNING: Mode - " + quota.rawName +
                            //" limit (" + quota.valLimit + ") does not match the default (" + modeSplitN +
                            //"). Please confirm the N-size. No change has been made. (Checklist)");
                    }
                    quotaNCount += quota.valLimit;
                }
                // Mode limits should add up to *around* full N, with an error margin of 1%
                if (quotaNCount < fullN - roundingOffset || quotaNCount > fullN + roundingOffset) {
                    console.log("Error: Mode limits do not add up to the full N-size.");
                    //curGroup.warnings.push("WARNING: Mode limits do not add up to the full N-size. Please confirm N-sizes. No change has been made. (Checklist)");
                }
            }

            if (curGroup.mode > 1 || numModes > 1) {
                isMultiMode = true;
            }
            if (curGroup.includesPhone) {
                isPhone = true;
            }
            if (curGroup.includesEmail) {
                isEmail = true;
            }
            if (curGroup.includesText) {
                isTexting = true;
            }
        }

        // If there is no mode quota and the survey is multi mode
        if (!modeCounterChecked && isMultiMode) {
            console.log("Error: Mode quotas not found.");
            QUOTA_GROUPS[0].warnings.push("WARNING: Mode quotas not found but there are quotas with multiple modes. Mode quotas at their default n-size have been added. (Checklist)");
            let modes = [];
            if (numModes > 1) {
                for (let x = 0; x < rawSizes.length; x++) {
                    let qName, limit;
                    if (rawSizes[x] > 0) {
                        switch (x) {
                            case 0:
                                qName = "Phone";
                                break;
                            case 1:
                                qName = "Email";
                                break;
                            case 2:
                                qName = "Texting";
                                break;
                        }
                        modes.push([qName, rawSizes[x].toString(), "pMode", (x + 1).toString()]);
                    }
                }
            } else {
                numModes = isPhone + isEmail + isTexting;
                let defaultModeN = Math.round(fullN / numModes).toString();
                if (isPhone) {
                    modes.push(["Phone", defaultModeN, "pMode", "1"]);
                }
                if (isEmail) {
                    modes.push(["Email", defaultModeN, "pMode", "2"]);
                }
                if (isTexting) {
                    modes.push(["Texting", defaultModeN, "pMode", "3"]);
                }
            }

            CreateQuotaGroup("Mode", modes, rawSizes);
        }
    }
}