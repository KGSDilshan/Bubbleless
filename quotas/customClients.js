class ALClient extends BaseClient {
    constructor() {
        super("AL");
    }

    makeInActiveAL(group) {
        for (let i = 0; i < group.subQuotas.length; i++) {
            let q = group.subQuotas[i];
            q.active = false;
        }
    }

    clientSpecificWarnings() {
        if (RAN_CSWARNINGS)
            return;
        RAN_CSWARNINGS = true;
        // if all quotas except splits were not inactive, warn
        for (let i = 0; i < QUOTA_GROUPS.length; i++) {
            for (let j = 0; j < QUOTA_GROUPS[i].subQuotas.length; j++) {
                let q = QUOTA_GROUPS[i].subQuotas[j];
                if (q.active == true && !q.name.toLowerCase().includes("split") && q.counter == false) {
                    // warn quota is active
                    GLOBAL_WARNINGS.push({
                        message: "WARNING: " + QUOTA_GROUPS[i].getName() + ", quota is active. Must be inactive. (Checklist)",
                        callback: this.makeInActiveAL,
                        group: QUOTA_GROUPS[i],
                    });
                    break;
                }
            }
        }
        // check if Gender has split quotas
        let genderGrp = getQuotaByNames(["gender", "sex"]);
        if (genderGrp != undefined && !genderGrp.hasSplits) {
            GLOBAL_WARNINGS.push({
                message: "WARNING: Gender Quota missing split quota",
                callback: undefined,
                group: undefined,
            });
        }
        // check that gender is pulling from insurvey
        if (genderGrp && !isNOL()) {
            for (let i = 0; i < genderGrp.subQuotas.length; i++) {
                let qName = genderGrp.subQuotas[i].qName;
                if (qName.startsWith("p")) {
                    GLOBAL_WARNINGS.push({
                        message: "WARNING: Gender Quota should pull from survey when Non-listed",
                        callback: undefined,
                        group: undefined,
                    });
                    break;
                }
            }
        }
        let ageGrp = getQuotaByNames(["age"]);
        if (ageGrp && !isNOL()) {
            for (let i = 0; i < ageGrp.subQuotas.length; i++) {
                let qName = ageGrp.subQuotas[i].qName;
                if (qName.startsWith("p")) {
                    GLOBAL_WARNINGS.push({
                        message: "WARNING: Age Quota should pull from survey when Non-listed",
                        callback: undefined,
                        group: undefined,
                    });
                    break;
                }
            }
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
                    message: "WARNING: " + group.getName() + " - Other quota does not exist.(Checklist)",
                    callback: this.appendEthnicityOtherHandler,
                    group: group,
                    args: newQuota
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
                let quotaHeader = "(" + QUOTA_HEADERS[i].toLowerCase() + ")";
                if (!group.splits.includes(quotaHeader) &&
                    quotaHeader.includes("split") &&
                    quotaHeader != "(" + curGroupName + ")") {
                    showErrors = true;
                    splitsToAdd.push("(" + QUOTA_HEADERS[i] + ")");
                }
            }

            if (showErrors) {
                console.log(group, "Error: Splits exist but quotas are not split");
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.getName() + " quotas missing split quotas. (Checklist)",
                    callback: this.splitQuotasBySplitHandler,
                    group: group,
                    args: splitsToAdd
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
                let arrArgs = [];
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    // If either one is coded wrong...
                    if((quota.rawName.toLowerCase().startsWith("m") && quota.qCodes[0] == 1) ||
                        (quota.rawName.toLowerCase().startsWith("f") && quota.qCodes[0] == 2)) {
                        console.log(curGroup, "Error: Gender " + quota.rawName + " is coded " + quota.qCodes[0]);
                        // Don't know whether female shows up first or male, push a flipped qcode
                        arrArgs.push({
                            subQuotaIndex: i,
                            correctCode: quota.qCodes[0] == 1 ? 2 : 1
                        });
                    }
                }
                if (arrArgs.length > 0) {
                    GLOBAL_WARNINGS.push({
                        message: "WARNING: Gender quota option codes do not match the general case. (Checklist)",
                        callback: this.genderMiscodedHandler,
                        group: curGroup,
                        args: {
                            array: arrArgs
                        }
                    });
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
                            message: "WARNING: Phone type quotas are not 50% of total N size. (Checklist)",
                            callback: this.phoneTypeDefaultLimitHandler,
                            group: curGroup,
                            args: {}
                        });
                        break;
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
        group.subQuotas.push(args);
    }

    splitQuotasBySplitHandler(group, args) {
        args.forEach(split => group.splits.push(split));
        group.hasSplits = true;
    }

    genderMiscodedHandler(group, args) {
        args.array.forEach(obj => group.subQuotas[obj.subQuotaIndex].qCodes[0] = obj.correctCode);
    }

    phoneTypeDefaultLimitHandler(group) {
        group.subQuotas.forEach(sq => {
            sq.valLimit = "50";
            sq.isRaw = false;
        });
    }

    // We can just set all of them to false
    presVoteActiveHandler(group) {
        group.subQuotas.forEach(sq => sq.active = false);
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
                    if (quota.active && !quota.counter) {
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
                    if (!quota.active && !quota.counter) {
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
        group.subQuotas.forEach(sq => sq.active = false);
    }

    // Phonetype should be counters
    phonetypeCounterHandler(group) {
        group.subQuotas.forEach(sq => sq.counter = false);
    }

    // Splits should be active
    inactiveSplitsHandler(group) {
        group.subQuotas.forEach(sq => sq.active = true);
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
                                args: precodeName
                            });
                            break;
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
                                args: "QXCoded"
                            });
                            break;
                        }
                    }
                }

                if (curGroupName.includes("gender") ||
                    curGroupName.includes("sex") ||
                    curGroupName.includes("party") ||
                    curGroupName.includes("ethnic") ||
                    curGroupName.includes("race")) {
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
                                args: "QX"
                            });
                            break;
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
        group.subQuotas.forEach(sq => sq.qName = args);
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
                            args: "PartyCoded"
                        });
                        break;
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
                        break;
                    }
                }
            }
        }
    }

    pullingFromWrongPlaceHandler(group, args) {
        group.subQuotas.forEach(sq => sq.qName = args);
    }

    // We can just set all of them to false
    countyActiveHandler(group) {
        group.subQuotas.forEach(sq => sq.active = false);
    }
}

class TNClient extends BaseClient {
    constructor() {
        super("TN")
    }

    missingMode() {
        let configTemplate = getBaseConfigTemplate();
        let rawQuotas = [];
        let idealN = round05Ciel(TotalNSize / SurveyMode).toString();
        if (IncludesPhone) {
            rawQuotas.push(["Phone", idealN, "pMode", "1"]);
        }
        if (IncludesEmail) {
            rawQuotas.push(["Email", idealN, "pMode", "2"]);
        }
        if (IncludesText) {
            rawQuotas.push(["Text", idealN, "pMode", "3"]);
        }
        QUOTA_GROUPS.push(new QuotaGroup("Mode", configTemplate, rawQuotas));
    }

    modifyModeQuotaTN(group) {
        let idealN = round05Ciel(TotalNSize / SurveyMode);
        for (let i = 0; i < group.subQuotas.length; i++) {
            group.subQuotas[i].valLimit = idealN;
            group.subQuotas[i].isRaw = false;
        }
    }

    clientSpecificQuotaTransformations(group) {
        // make PT quotas out of phone N
        if (group.group_name.toLowerCase().includes("phone") && IncludesPhone) {
            group.totalN = getRawSizes()[0];
        }
    }


    clientSpecificWarnings() {
        if (RAN_CSWARNINGS)
            return;
        RAN_CSWARNINGS = true;
        // check mode quota is out of idealN
        // mode limits are off
        let modeGrp = getQuotaByNames(["mode"]);
        let idealN = round05Ciel(TotalNSize / SurveyMode).toString();
        if (modeGrp != undefined) {
            if (modeGrp.group_name.toLowerCase().includes("mode")) {
                for (let i = 0; i < modeGrp.rawSubQuotas.length; i++) {
                    console.log(modeGrp.rawSubQuotas[i][1]);
                    if (!(modeGrp.rawSubQuotas[i][1].includes(idealN))) {
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: " + modeGrp.group_name + " Quota limits not exactly even. (Checklist)",
                            callback : this.modifyModeQuotaTN,
                            group: modeGrp,
                        });
                        break;
                    }
                }
            }
        }
    }
}


class FMClient extends BaseClient {
    constructor() {
        super("FM");
    }

    missingPhoneType() {
        let configTemplate = getBaseConfigTemplate();
        let rawQuotas = [
            ["Landline(counter)(inactive)", "30%", "pPhoneType", "1"],
            ["Cell(inactive)", "70%", "pPhoneType", "2"],
        ];
        QUOTA_GROUPS.push(new QuotaGroup("PhoneType", configTemplate, rawQuotas));
    }

    missingGender() {
        let configTemplate = getBaseConfigTemplate();
        if (SurveyMode == 1 && IncludesPhone == true) {
            configTemplate.isFlex = true;
            configTemplate.isRawFlex = false;
            configTemplate.flexAmount = 5;
        }
        let rawQuotas = [
            ["Male(counter)", "0%", "pGender", "1"],
            ["Female(counter)", "0%", "pGender", "2"],
        ];
        QUOTA_GROUPS.push(new QuotaGroup("Gender", configTemplate, rawQuotas));
    }

    missingParty() {
        let configTemplate = getBaseConfigTemplate();
        if (SurveyMode == 1 && IncludesPhone == true) {
            configTemplate.isFlex = true;
            configTemplate.isRawFlex = false;
            configTemplate.flexAmount = 5;
        }
        let rawQuotas = [
            ["Democrat(counter)", "0%", "pParty", "1"],
            ["Republican(counter)", "0%", "pParty", "2"],
            ["NPP(counter)", "0%", "pParty", "3"],
            ["Other(counter)", "0%", "pParty", "4"],
        ];
        QUOTA_GROUPS.push(new QuotaGroup("Party", configTemplate, rawQuotas));
    }

    missingEthnicity() {
        let configTemplate = getBaseConfigTemplate();
        if (SurveyMode == 1 && IncludesPhone == true) {
            configTemplate.isFlex = true;
            configTemplate.isRawFlex = false;
            configTemplate.flexAmount = 5;
        }
        let rawQuotas = [
            ["White(counter)", "0%", "pEthnicity", "1"],
            ["Latino(counter)", "0%", "pEthnicity", "2"],
            ["African American(counter)", "0%", "pEthnicity", "3"],
            ["Asian(counter)", "0%", "pEthnicity", "4"],
            ["Other(counter)", "0%", "pEthnicity", "5"],
        ];
        QUOTA_GROUPS.push(new QuotaGroup("Ethnicity", configTemplate, rawQuotas));
    }

    fixSplitFlexFM(group) {
        group.isFlex = true;
        group.flexAmount = 5;
        group.isRawFlex = true;
    }

    fixPhoneQuotasFlexFM(group) {
        group.isFlex = true;
        group.flexAmount = 5;
        group.isRawFlex = false;
        console.log(group);
    }

    removeFlexQuotaFM(group) {
        group.isFlex = false;
        group.flexAmount = 0;
        group.isRawFlex = false;
    }

    fixPTQuotaFM(group) {
        group.isFlex = true;
        group.isRawFlex = false;
        group.flexAmount = 5;
        for (let i = 0; i < group.subQuotas.length; i++) {
            let subQ = group.subQuotas[i];
            subQ.active = false;
            // percentages LL
            if (subQ.rawName.toLowerCase().includes("l")) {
                subQ.counter = true;
                subQ.isRaw = false;
                subQ.valLimit = 30;
            }
            // percentages cell
            if (subQ.rawName.toLowerCase().includes("cell")) {
                subQ.isRaw = false;
                subQ.valLimit = 70;
                subQ.iscounter = false;
            }
        }
    }

    clientSpecificQuotaTransformations(group) {
        // phone mode quotas should contain counter for LL and max for cell
        if (group.group_name.toLowerCase().includes("split") && group.Phone == true) {
            // should be flex should be flat 5
            if (group.flexAmount != 5 || !group.isRawFlex) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: Split quotas need to have 5n Flex. (Checklist)",
                    callback : this.fixSplitFlexFM,
                    group: group,
                });
            }
        } else if (group.Phone) {
            // all quotas need 5% flex, if quota doesn't contain a counter
            let needsFlex = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                let name = group.rawSubQuotas[i][0];
                let lname = name.toLowerCase();
                if (!lname.includes("counter")) {
                    needsFlex = true;
                    break;
                }
            }
            if (needsFlex && (group.flexAmount != 5 || !group.isFlex || group.isRawFlex) && !group.group_name.toLowerCase().includes("phone")) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.group_name + " requires 5% flex. (Checklist)",
                    callback : this.fixPhoneQuotasFlexFM,
                    group: group,
                });

            }
        } else {
            // no flex in online modes
            console.log(group.Phone);
            if (group.isFlex || group.isRawFlex) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: Shouldn't have flex in " + group.group_name + " for online. (Checklist)",
                    callback : this.removeFlexQuotaFM,
                    group: group,
                });
            }
        }
    }

    clientSpecificWarnings() {
        if (this.randCSWarns)
            return;
        this.ranCSWarns = true;
        // no group should have dual mode
        if (SurveyMode > 1) {
            GLOBAL_WARNINGS.push({
                message: "WARNING: Survey detected as multi-mode. Client dual modes are on two links.",
                callback: undefined,
            });
        }

        // check if phone type quota exists
        let phoneTypeGrp = getQuotaByNames(["phone"]);
        if (phoneTypeGrp != undefined) {
            // check activity
            let msg = [];
            let showWarn = false;
            for (let i = 0; i < phoneTypeGrp.subQuotas.length; i++) {
                let subQ = phoneTypeGrp.subQuotas[i];
                // PT should be inactive
                if (subQ.active && !subQ.counter) {
                    showWarn = true;
                    break;
                }
                // counter LL
                if (subQ.rawName.toLowerCase().includes("l") && !subQ.counter && !subQ.rawName.toLowerCase().includes("cell")) {
                    showWarn = true;
                    break;
                }
                // percentages LL
                if (subQ.valLimit != 30 && subQ.rawName.toLowerCase().includes("l") && !subQ.rawName.toLowerCase().includes("cell")) {
                    showWarn = true;
                    break;
                }
                // percentages cell
                if (subQ.valLimit != 70 && subQ.rawName.toLowerCase().includes("ce")) {
                    showWarn = true;
                    break;
                }
            }
            if (showWarn) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: Phonetype Quota incorrect. (Checklist)",
                    callback: this.fixPTQuotaFM,
                    group: phoneTypeGrp,
                });
            }
        }
    }

}

class PBClient extends BaseClient {
    constructor() {
        super("PB");
    }

    missingMode() {
        let configTemplate = getBaseConfigTemplate();
        let rawQuotas = [];
        let idealN = round05Ciel(TotalNSize / SurveyMode).toString();
        if (IncludesPhone) {
            rawQuotas.push(["Phone", idealN, "pMode", "1"]);
        }
        if (IncludesEmail) {
            rawQuotas.push(["Email", idealN, "pMode", "2"]);
        }
        if (IncludesText) {
            rawQuotas.push(["Text", idealN, "pMode", "3"]);
        }
        QUOTA_GROUPS.push(new QuotaGroup("Mode", configTemplate, rawQuotas));
    }

    modifyPTQuotaPB(group) {
        for (let i = 0; i < group.subQuotas.length; i++) {
            group.subQuotas[i].counter = true;
        }
    }

    modifyModeQuotaPB(group) {
        let idealN = round05Ciel(TotalNSize / SurveyMode);
        for (let i = 0; i < group.subQuotas.length; i++) {
            group.subQuotas[i].valLimit = idealN;
            group.subQuotas[i].isRaw = false;
        }
    }

    clientSpecificQuotaTransformations(group) {
        // Phone type is all 999 counters
        if (group.group_name.toLowerCase().includes("phone")) {
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (!group.rawSubQuotas[i][0].includes("(counter)")) {
                    GLOBAL_WARNINGS.push({
                        message: "WARNING: " + group.group_name + " Quotas made as counter and inactive. (Checklist)",
                        callback : this.modifyPTQuotaPB,
                        group: group,
                    });
                    break;
                }
            }
        }

        // mode limits are off
        let idealN = round05Ciel(TotalNSize / SurveyMode).toString();
        if (group.group_name.toLowerCase().includes("mode")) {
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                console.log(group.rawSubQuotas[i][1]);
                if (!(group.rawSubQuotas[i][1].includes(idealN))) {
                    GLOBAL_WARNINGS.push({
                        message: "WARNING: " + group.group_name + " Quota limits not exactly even. (Checklist)",
                        callback : this.modifyPTQuotaPB,
                        group: group,
                    });
                    break;
                }
            }
        }
    }

    clientSpecificWarnings() {
        // passive warning, always show.
        GLOBAL_WARNINGS.push({
            message: "WARNING: Quotas should pull from the same place the cross-tabs mention (QST or sample). (Checklist)",
            callback : undefined,
        });
    }

    finalName(quota, qname, limit) {
        // flex name modification
        let name = qname;
        if (quota.group.isFlex && !quota.counter) {
            name += " (" + (quota.group.isRawFlex ? "" : "Flex ") + quota.group.flexAmount + (quota.group.isRawFlex ? "" : "%") + " added)";
        }
        // counter name modification
        if (quota.counter == true) {
            if (!limit == 0 && !quota.group.group_name.toLowerCase().includes("phone"))
                name += " (Min : " + limit + ")";
            quota.active = false;
        }
        return name;
    }
}


class WLClient extends BaseClient {
    constructor() {
        super("WL");
    }

    missingEthnicity() {
        let configTemplate = getBaseConfigTemplate();
        let rawQuotas = [
            ["White(counter)", "0%", "QX", "1"],
            ["Latino(counter)", "0%", "QX", "2"],
            ["African American(counter)", "0%", "QX", "3"],
            ["Asian(counter)", "0%", "QX", "4"],
            ["Other(counter)", "0%", "QX", "5"],
        ];
        QUOTA_GROUPS.push(new QuotaGroup("Ethnicity", configTemplate, rawQuotas));
    }

    clientSpecificQuotaTransformations(group) {
        let gname = group.group_name.toLowerCase();
        if (gname.includes("ethnic") || gname.includes("race")) {
            // Ethnicity quota go off survey
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (group.rawSubQuotas[i][2].startsWith("p")) {
                    GLOBAL_WARNINGS.push({
                        message: "WARNING: " + group.group_name + " should be pulling from survey. (Checklist)",
                        callback : undefined,
                    });
                }
            }
        } else {
            // not ethnicity quota, go off sample
            let setToSample = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (!group.rawSubQuotas[i][2].startsWith("p") && !gname.includes("split")) {
                    GLOBAL_WARNINGS.push({
                        message: "WARNING: " + group.group_name + " needs to pull from sample. (Checklist)",
                        callback : undefined,
                    });
                    break;
                }
            }
        }
    }
}

class KTClient extends BaseClient {
    constructor() {
        super("KT");
    }

    clientSpecificQuotaTransformations(group) {
        if (group.group_name.toLowerCase().includes("split")) return;
        // every quota go off sample
        let setToSample = false;
        for (let i = 0; i < group.rawSubQuotas.length; i++) {
            if (!group.rawSubQuotas[i][2].startsWith("p")) {
                setToSample = true;
                break;
            }
        }
        if (setToSample) {
            GLOBAL_WARNINGS.push({
                message: "WARNING: " + group.group_name + " needs to pull from sample. (Checklist)",
                callback : undefined,
            });
        }
    }
}


class LRClient extends BaseClient {
    constructor() {
        super("LR");
    }

    clientSpecificQuotaTransformations(group) {
        // quotas pull from sample (including Splits) when LISTED
        if (isNOL()) {
            let setToSample = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (!group.rawSubQuotas[i][2].startsWith("p")) {
                    setToSample = true;
                    break;
                }
            }
            if (setToSample) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.group_name + " needs to pull from sample. (Checklist)",
                    callback : undefined,
                });
            }
        }
    }


    clientSpecificWarnings() {
        if (this.randCSWarns)
            return;
        this.ranCSWarns = true;

        // Add “DLCC Support”, “DLCC Turnout”, AND “VoteSelect” as counters if exists in sample
        let dlccSupportGrp = getQuotaByNames(["dlcc support", "support"]);
        let dlccTurnoutGrp = getQuotaByNames(["dlcc turnout", "turnout"]);
        let VoteSelect = getQuotaByNames(["vote select, voteselect"]);
        if (dlccSupportGrp == undefined) {
            GLOBAL_WARNINGS.push({
                message: "WARNING: Missing DLCC Support Quota. If in sample, must have as a counter quota (Checklist)",
                callback : undefined,
            });
        }
        if (dlccTurnoutGrp == undefined) {
            GLOBAL_WARNINGS.push({
                message: "WARNING: Missing DLCC Turnout Quota. If in sample, must have as a counter quota (Checklist)",
                callback : undefined,
            });
        }
        if (VoteSelect == undefined) {
            GLOBAL_WARNINGS.push({
                message: "WARNING: Missing VoteSelect Quota. If in sample, must have as a counter quota (Checklist)",
                callback : undefined,
            });
        }

        // Always keep the quotas with 2 or more conditions inactive (i.e. Gender – Male Region 1)
        // handled in split quotas
    }
}

class LPClient extends BaseClient {
    constructor() {
        super("LP");
    }

    clientSpecificQuotaTransformations(group) {
        if (group.group_name.toLowerCase().includes("split")) return;
        // every quota go off sample
        let setToSample = false;
        for (let i = 0; i < group.rawSubQuotas.length; i++) {
            if (!group.rawSubQuotas[i][2].startsWith("p")) {
                setToSample = true;
                break;
            }
        }
        if (setToSample) {
            GLOBAL_WARNINGS.push({
                message: "WARNING: " + group.group_name + " needs to pull from sample. (Checklist)",
                callback : undefined,
            });
        }
    }
}

class NRCClient extends BaseClient {
    constructor() {
        super("NRC");
    }

    partyQuotaFromSurveyNRC(group) {
        for (let i = 0; i < group.subQuotas.length; i++) {
            group.subQuotas[i].qName = "PartyCoded";
        }
    }

    missingParty() {
        let configTemplate = getBaseConfigTemplate();
        let rawQuotas = [
            ["Democrat(counter)", "0%", "PartyCoded", "1"],
            ["Republican(counter)", "0%", "PartyCoded", "2"],
            ["NPP(counter)", "0%", "PartyCoded", "3"],
            ["Other(counter)", "0%", "PartyCoded", "4"],
        ];
        QUOTA_GROUPS.push(new QuotaGroup("Party", configTemplate, rawQuotas));
    }

    clientSpecificQuotaTransformations(group) {
        if (group.group_name.toLowerCase().includes("split")) return;
        // every quota go off sample except Party
        let gname = group.group_name.toLowerCase();
        if (gname.includes("party")) {
            let showWarn = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (group.rawSubQuotas[i][2].startsWith("p") && !group.rawSubQuotas[i][2].toLowerCase().startsWith("party")) {
                    showWarn = true;
                    break;
                }
            }
            if (showWarn) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.group_name + " pulls from survey. (Checklist)",
                    callback : partyQuotaFromSurveyNRC,
                    group: group,
                });
            }
        } else {
            let setToSample = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (!group.rawSubQuotas[i][2].startsWith("p")) {
                    setToSample = true;
                    break;
                }
            }
            if (setToSample) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.group_name + " needs to pull from sample. (Checklist)",
                    callback : undefined,
                });
            }
        }
    }
}

class FBClient extends BaseClient {
    constructor() {
        super("FB");
    }

    clientSpecificQuotaTransformations(group) {
        if (group.group_name.toLowerCase().includes("split")) return;
        // every quota go off sample
        let setToSample = false;
        for (let i = 0; i < group.rawSubQuotas.length; i++) {
            if (!group.rawSubQuotas[i][2].startsWith("p")) {
                setToSample = true;
                break;
            }
        }
        if (setToSample) {
            GLOBAL_WARNINGS.push({
                message: "WARNING: " + group.group_name + " needs to pull from sample. (Checklist)",
                callback : undefined,
            });
        }
    }
}


class SXClient extends BaseClient {
    constructor() {
        super("SX");
    }

    missingPhoneType() {
        let configTemplate = getBaseConfigTemplate();
        let rawQuotas = [
            ["Landline(counter)", "35%", "pPhoneType", "1"],
            ["Cell", "65%", "pPhoneType", "2"],
        ];
        QUOTA_GROUPS.push(new QuotaGroup("PhoneType", configTemplate, rawQuotas));
    }

    adjustPhoneTypeSX(group) {
        for (let i = 0; i < group.subQuotas.length; i++) {
            let name = group.subQuotas[i].rawName.toLowerCase();
            let percentage = group.subQuotas[i].valLimit;
            if (name.startsWith("l")) {
                // min 35%
                if (!name.includes("counter")) {
                    group.subQuotas[i].counter = true;
                }
                if (group.subQuotas[i].strLimit != "35%") {
                    group.subQuotas[i].valLimit = "35";
                    group.subQuotas[i].isRaw = false;
                    group.subQuotas[i].strLimit = "35%";
                }
            } else if (name.startsWith("c")) {
                // 65% max
                if (group.subQuotas[i].strLimit != "65%") {
                    group.subQuotas[i].valLimit = "65";
                    group.subQuotas[i].isRaw = false;
                    group.subQuotas[i].strLimit = "65%";
                }
            }
        }
    }

    clientSpecificQuotaTransformations(group) {
        // phone type is max 65% cell
        if (group.group_name.toLowerCase().includes("phone")) {
            let showWarn = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                let name = group.rawSubQuotas[i][0].toLowerCase();
                let percentage = group.rawSubQuotas[i][1];
                if (name.startsWith("l")) {
                    // min 35%
                    if (!name.includes("counter")) {
                        showWarn = true;
                        break;
                    }
                } else if (name.startsWith("c")) {
                    // 65% max
                    if (!percentage.toString().startsWith("65")) {
                        showWarn = true;
                        break;
                    }
                }
            }
            if (showWarn) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.group_name + " Cell is max 65% and LL is min 35%. (Checklist)",
                    callback : this.adjustPhoneTypeSX,
                    group: group,
                });
            }
        }
    }
}


class GSGClient extends BaseClient {
    constructor() {
        super("GSG");
    }

    addSplitsToGenderGSG(grp) {
        grp.splits.push("(region)");
        grp.hasSplits = true;
    }

    addTrailingHardQuota(grp) {
        grp.group_name = "HARD QUOTA - " + grp.group_name;
    }

    clientSpecificQuotaTransformations(group) {
        // need gender by region quotas
        if (group.group_name.toLowerCase().includes("gender")) {
            // check if the splits include region
            let names = ["(region)", "(district)", "(geo)"];
            let isSplit = false;
            if (group.hasSplits) {
                loopNested:
                for (let i = 0; i < group.splits.length; i++) {
                    for (let j = 0; j < names.length; j++) {
                        if (group.splits[i].toLowerCase() == names[j].toLowerCase()) {
                            isSplit = true;
                            break loopNested;
                        }
                    }
                }
            }
            if (!isSplit) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.group_name + " Requires region splits as well. (Checklist)",
                    callback : this.addSplitsToGenderGSG,
                    group: group,
                });
            }
        }
        // main splits. label HARD QUOTA to name
        if (group.group_name.toLowerCase().includes("split") && !group.group_name.includes("HARD QUOTA")) {
            GLOBAL_WARNINGS.push({
                message: "WARNING: Main splits require label 'HARD QUOTA'. (Checklist)",
                callback : this.addTrailingHardQuota,
                group: group,
            });
        }
    }

    setAllQuotasInactiveGSG() {
        for (let i = 0; i < QUOTA_GROUPS.length; i++) {
            for (let j = 0; j < QUOTA_GROUPS[i].subQuotas.length; j++) {
                QUOTA_GROUPS[i].subQuotas[j].active = false;
            }
        }
    }

    clientSpecificWarnings() {
        if (this.randCSWarns)
            return;
        this.ranCSWarns = true;
        // all quotas inactive including splits
        let setInactive = false;
        for (let i = 0; i < QUOTA_GROUPS.length; i++) {
            for (let j = 0; j < QUOTA_GROUPS[i].subQuotas.length; j++) {
                if (QUOTA_GROUPS[i].subQuotas[j].active) {
                    setInactive = true;
                }
            }
        }
        if (setInactive) {
            GLOBAL_WARNINGS.push({
                message: "WARNING: All quotas set inactive. (Checklist)",
                callback: this.setAllQuotasInactiveGSG,
                group: undefined,
            });
        }
    }
}
