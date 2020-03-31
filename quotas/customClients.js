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

        this.clientId = 3;
        this.check = {
            splitQuotasChecked: false,
            genderCodesChecked: false,
            phoneTypeQuotasChecked: false,
            ethnicityOtherOffsetterChecked: false,
            presVoteInactiveChecked: false
        };
    }

    clientSpecificQuotaTransformations(group) {
        let curGroupName = group.group_name.toLowerCase();

        // Add other offsetter for ethnicity quota
        if (curGroupName.includes("ethnicity") || curGroupName.includes("race")) {
            let offsetterNSize = 0;
            let otherExists = false;
            let isRaw = !group.rawSubQuotas[0][1].includes("%");

            // Check for other option existing in current quotas
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                let quota = group.rawSubQuotas[i];
                if(quota[0].toLowerCase().includes("other")) {
                    otherExists = true;
                } else {
                    offsetterNSize += parseInt(quota[1].split("%").join(""));
                }
            }

            // Create an other-offsetter quota if the other quota does not exist
            if (!otherExists) {
                console.log(group, "Error: Ethnicity - Other quota does not exist");
                group.warnings.push("WARNING: Ethnicity - Other quota does not exist. Created Ethnicity - Other offsetter quota (Checklist)");
                let newQuota = new Quota(
                    group,
                    "Other OFFSETTER",
                    isRaw ? (group.totalN - offsetterNSize).toString() : (100 - offsetterNSize) + "%",
                    group.rawSubQuotas[0].qName,
                    [group.rawSubQuotas.length + 1],
                    CLIENT
                    );
                newQuota.active = false;
                group.subQuotas.push(newQuota);                    
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

            // Balance all quotas by splits except Geo, Lang, Phonetype
            if ((!(curGroupName.includes("geo")
            || curGroupName.includes("lang")
            || curGroupName.includes("phone")))) {
                this.check.splitQuotasChecked = true;

                let splitsExist = false;
                for (let i = 0; i < QUOTA_HEADERS.length; i++) {
                    if (QUOTA_HEADERS[i].toLowerCase().includes("split")) {
                        splitsExist = true;
                    }
                }

                if (!curGroup.hasSplits && splitsExist) {
                    console.log(curGroup, "Error: Splits exist but quotas are not split");
                    curGroup.warnings.push("WARNING: " + curGroupName + " Quotas missing split quotas");
                }
            }
            
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
                        curGroup.warnings.push("WARNING: " + quota.name + " Quota coded as 1, recoded to 2 (Checklist)");
                        quota.qCodes[0] = 2;
                    } else if (quota.rawName.toLowerCase().startsWith("f") && quota.qCodes[0] == 2) {
                        console.log(curGroup, "Error: Gender - Female is coded as 2 instead of 1. Recoded as 1");
                        curGroup.warnings.push("WARNING: " + quota.name + " Quota coded as 2, recoded to 1 (Checklist)");
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
                        curGroup.warnings.push("WARNING: " + quota.name + " Quota not 50% of total N size. Changed to 50% of total N size (Checklist)");
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
                            curGroup.warnings.push("WARNING: Presidential Vote quota is active. Deactivating quota (Checklist)");
                            warningDisplayed = true;
                        }
                        quota.active = false;    
                    }
                }
            }
        }
    }
}
