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

        this.check = {
            genderCodesChecked: false,
            phoneTypeQuotasChecked: false,
            presVoteInactiveChecked: false
        };
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
                group.warnings.push("WARNING: " + curGroup.getName() + " - Other quota does not exist. Created. (Checklist)");
                let newQuota = new Quota(
                    group,
                    "Other OFFSETTER",
                    isRaw ? (group.totalN - offset).toString() : (100 - offset) + "%",
                    group.rawSubQuotas[0][2],
                    [group.rawSubQuotas.length + 1],
                    CLIENT
                    );
                newQuota.active = false;
                group.subQuotas.push(newQuota);
            }
        }

        // Balance all quotas by splits except Geo, Lang, Phonetype
        if ((!(curGroupName.includes("geo")
        || curGroupName.includes("lang")
        || curGroupName.includes("phone")))) {

            let showErrors = false;
            for (let i = 0; i < QUOTA_HEADERS.length; i++) {
                let quotaHeader = QUOTA_HEADERS[i].toLowerCase();
                if (!group.splits.includes(quotaHeader) && quotaHeader.includes("split") && quotaHeader != curGroupName) {
                    showErrors = true;
                    group.splits.push(QUOTA_HEADERS[i]);
                    group.hasSplits = true;
                }
            }

            if (showErrors) {
                console.log(group, "Error: Splits exist but quotas are not split");
                group.warnings.push("WARNING: " + curGroup.getName() + " quotas missing split quotas. Split quotas have been added for " + curGroupName + " (Checklist)");
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
            || curGroupName.includes("sex")) && !this.check.genderCodesChecked) {
                this.check.genderCodesChecked = true;
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if(quota.rawName.toLowerCase().startsWith("m") && quota.qCodes[0] == 1) {
                        console.log(curGroup, "Error: Gender - Male is coded as 1 instead of 2. Recoded as 2");
                        curGroup.warnings.push("WARNING: " + quota.name + " quota coded as 1, recoded to 2 (Checklist)");
                        quota.qCodes[0] = 2;
                    } else if (quota.rawName.toLowerCase().startsWith("f") && quota.qCodes[0] == 2) {
                        console.log(curGroup, "Error: Gender - Female is coded as 2 instead of 1. Recoded as 1");
                        curGroup.warnings.push("WARNING: " + quota.name + " quota coded as 2, recoded to 1 (Checklist)");
                        quota.qCodes[0] = 1;
                    }
                }
            }

            // Phone Type 50% LL, 50% Cell
            if (curGroupName.includes("phone") && !this.check.phoneTypeQuotasChecked) {
                this.check.phoneTypeQuotasChecked = true;
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    let n = quota.getRawNSize();
                    if(n !== curGroup.totalN / 2) {
                        console.log(curGroup, "Error: Phone Type - " + quota.name + " limit is not half of total N size");
                        curGroup.warnings.push("WARNING: " + quota.name + " quota not 50% of total N size. Changed to 50% of total N size (Checklist)");
                        quota.valLimit = 50;
                        quota.strLimit = "50%";
                        for (const property in quota.limits) {
                            if (quota.limits[property]) {
                                quota.limits[property] = curGroup.totalN / 2;
                            }
                        }
                    }
                }
            }

            // Presidential vote quota is inactive (??? - perhaps have the programmer add this in?)
            if ((curGroupName.includes("pres") || curGroupName.includes("vote 20")) && !this.check.presVoteInactiveChecked) {
                this.check.presVoteInactiveChecked = true;

                let warningDisplayed = false;
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (quota.active) {
                        if (!warningDisplayed) {
                            console.log(curGroup, "Error: Presidential Vote quota is active");
                            curGroup.warnings.push("WARNING: Presidential Vote quota is active. Deactivating. (Checklist)");
                            warningDisplayed = true;
                        }
                        quota.active = false;
                    }
                }
            }
        }

        if (!this.check.genderCodesChecked  && QUOTA_GROUPS.length > 0) {
            QUOTA_GROUPS[0].warnings.push("WARNING: Gender quota not defined");
        }
    }
}

class RNClient extends BaseClient {
    constructor() {
        super("RN");
    }

    clientSpecificWarnings() {
        for (let j = 0; j < QUOTA_GROUPS.length; j++) {
            let curGroup = QUOTA_GROUPS[j];
            let curGroupName = QUOTA_GROUPS[j].getName().toLowerCase();

            // All quotas are inactive save for splits/control messages
            if (!(curGroupName.includes("split") || curGroupName.includes("control"))) {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (quota.active) {
                        quota.active = false;
                        console.log(curGroup, "Error: A non-split/control message quota is active");
                        curGroup.warnings.push("WARNING: A non-split/control message quota is active. Deactivating " +
                                    quota.name + " (Checklist)");
                    }
                }
            } else {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (!quota.active) {
                        quota.active = true;
                        console.log(curGroup, "Error: A split/control message quota is inactive");
                        curGroup.warnings.push("WARNING: A split/control message quota is inactive. Activating " +
                                    quota.name + " (Checklist)");
                    }
                }
            }

            // Phone type quotas are counters
            if (curGroupName.includes("phone")) {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (!quota.counter) {
                        quota.counter = true;
                        console.log("Error: Phone type " + quota.rawName + "quota is not a counter.");
                        curGroup.warnings.push("WARNING: Phone type " + quota.rawName + 
                                        " quota is not a counter. Changed to a counter. (Checklist)");
                    }
                }
            }
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

    clientSpecificQuotaTransformations(group) {
        return;
    }

    clientSpecificWarnings() {
        for (let j = 0; j < QUOTA_GROUPS.length; j++) {
            let curGroup = QUOTA_GROUPS[j];
            let curGroupName = QUOTA_GROUPS[j].getName().toLowerCase();

            // Group includes counters but does not have flex specified
            if (curGroup.includesCounters()) {
                if (!curGroup.isFlex) {
                    console.log("Error: " + curGroupName + " quotas have counters but no flex.");
                    curGroup.warnings.push("WARNING: " + curGroup.getName() + " quotas have counters but no flex. Default 5% flex added (Checklist)");

                    curGroup.isFlex = true;
                    curGroup.isRawFlex = true;
                    curGroup.flexAmount = 5;
                }
            }

            // Check for listed specific stuff
            if (isNOL()) {
                let showListedWarning = false;
                // Everything should be pulling from sample
                if (!curGroupName.includes("split")) {
                    for (let i = 0; i < curGroup.subQuotas.length; i++) {
                        let quota = curGroup.subQuotas[i];
                        // Everything should be pulling from sample
                        if (!quota.qName.startsWith("p")) {
                            let precodeName = "p" + curGroup.getName().split(" ").join("");
                            if (!showListedWarning) {
                                console.log("Error: " + curGroupName + " quotas are not pulling from a precode.");
                                curGroup.warnings.push("WARNING: " + curGroup.getName() +
                                                " quotas are not pulling from a coded question. Changed to pull from " +
                                                precodeName + " (Checklist)");
                                showListedWarning = true;
                            }
                            quota.qName = precodeName;
                        }
                    }
                }
            } else {
                // Check for unlisted specific stuff
                if (curGroupName.includes("age")) {
                    let showAgeWarning = false;
                    for (let i = 0; i < curGroup.subQuotas.length; i++) {
                        let quota = curGroup.subQuotas[i];
                        // The age should be coded in some form
                        if (!quota.qName.toLowerCase().includes("coded")) {
                            if (!showAgeWarning) {
                                console.log("Error: " + curGroupName + " quotas are not pulling from a coded question.");
                                curGroup.warnings.push("WARNING: " + curGroup.getName() + " quotas are not pulling from a coded question. Changed to pull from QXCoded (Checklist)");
                                showAgeWarning = true;
                            }
                            quota.qName = "QXCoded";
                        }
                    }
                }
            }
        }
    }
    
    finalName(quota, qname, limit) {
        // flex name modification
        let name = qname;
        let flexAmt;
        try {
            flexAmt = quota.group.getRawFlex().toString();
        } 
        catch (e) {
            console.log(e + " Defaulting to 5% flex.");
            flexAmt = Math.ceil(quota.group.totalN * 0.05).toString();
        }
        // counter name modification
        if (quota.counter) {
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
        for (let j = 0; j < QUOTA_GROUPS.length; j++) {
            let curGroup = QUOTA_GROUPS[j];
            let curGroupName = QUOTA_GROUPS[j].getName().toLowerCase();

            // Party must pull from a coded question
            if (curGroupName.includes("party")) {
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (!quota.qName.toLowerCase().includes("coded")) {
                        quota.qName = "PartyCoded";
                        console.log("Error: Party " + quota.rawName + "quota is not pulling from a coded question.");
                        curGroup.warnings.push("WARNING: Party " + quota.rawName + 
                                        " quota is not pulling from a coded question. Changed to pull from PartyCoded (Checklist)");
                    }
                }
            }

            // County quota (if not raw), should be inactive
            if (curGroupName.includes("county")) {
                let showCountyWarning = false;
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (quota.active) {
                        if (!showCountyWarning) {
                            console.log("Error: Active " + curGroupName + " quota found.");
                            curGroup.warnings.push("WARNING: One or more " + curGroup.getName() + 
                                            " quotas are active. Deactivated quotas (Checklist)");
                        }
                        quota.active = false;
                        showCountyWarning = true;
                    }
                }
            }
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