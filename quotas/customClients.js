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

    clientSpecificWarnings() {
        if (RAN_CSWARNINGS)
            return;
        RAN_CSWARNINGS = true;

        for (let i = 0; i < QUOTA_GROUPS.length; i++) {
            let curGroup = QUOTA_GROUPS[i];
            let curGroupName = QUOTA_GROUPS[i].getName().toLowerCase();

            // Balance all quotas by splits except Geo, Lang, Phonetype
            if (!(curGroupName.includes("geo")
            || curGroupName.includes("lang")
            || curGroupName.includes("phone"))) {
                this.check.splitQuotasChecked = true;
                if (!curGroup.hasSplits) {
                    console.log(curGroup, "missing split quotas");
                    curGroup.warnings.push("WARNING: " + curGroupName + " Quotas missing split quotas");
                }
            }
            
            // Gender codes are reversed
            /*
            - If gender starts with an "m", it's male
            - If gender starts with an "f", it's female
            */
            if (curGroupName.includes("gender")
            || curGroupName.includes("sex")) {
                this.check.genderCodesChecked = true;
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if(quota.name.toLowerCase().startsWith("m") && quota.qCodes[0] == 1) {
                        console.log(curGroup, "Gender - Male is coded as 1 instead of 2. Recoded as 2");
                        curGroup.warnings.push("WARNING: " + quota.name + " Quota coded as 1, recoded to 2 (Checklist)");
                        quota.qCodes[0] = 2;
                    } else if (quota.name.toLowerCase().startsWith("f")) {
                        console.log(curGroup, "Gender - Female is coded as 2 instead of 1. Recoded as 1");
                        curGroup.warnings.push("WARNING: " + quota.name + " Quota coded as 2, recoded to 1 (Checklist)");
                        quota.qCodes[0] = 1;
                    }
                }
            }

            // Phone Type 50% LL, 50% Cell
            if (curGroupName.includes("phone")) {
                this.check.phoneTypeQuotasChecked = true;
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    let n = quota.valLimit * curGroup.totalN;
                    if(n !== curGroup.totalN / 2) {
                        console.log(curGroup, "Phone Type - " + quota.name + " limit is not half of total N size");
                        curGroup.warnings.push("WARNING: " + quota.name + " Quota not 50% of total N size. Changed to 50% of total N size (Checklist)");
                        quota.valLimit = 0.5;
                        quota.strLimit = "50%";
                        for (const property in quota.limits) {
                            if (property) {
                                quota.limits[property] = curGroup.totalN / 2;
                            }
                        }
                    }
                }
            }

            // Add other offsetter for ethnicity quota
            if (curGroupName.includes("ethnicity") || curGroupName.includes("race")) {
                this.check.ethnicityOtherOffsetterChecked = true;

                let otherExists = false;
                let offsetN = curGroup.totalN;
                // Update the offsetN if the quota doesn't include 'other'
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    if(curGroup.subQuotas[i].name.includes("other")) {
                        otherExists = true;
                    } else {
                        for (const property in quota.limits) {
                            if (property) {
                                offsetN -= quota.limits[property];
                            }
                        }
                    }
                }
                
                // Create an other-offsetter quota if the other quota does not exist
                if (!otherExists) {
                    console.log(curGroup, "Ethnicity - Other quota does not exist");
                    curGroup.warnings.push("WARNING: Ethnicity - Other quota does not exist. Created Ethnicity - Other offsetter quota (Checklist)");
                    curGroup.subQuotas.push(new Quota(
                        curGroup,
                        curGroupName + " - Other OFFSETTER" + (curGroup.isFlex ? " (flex=" + curGroup.getRawFlex() + ")" : ""),
                        offsetN.toString(),
                        curGroup.subQuotas[0].qName,
                        [curGroup.subQuotas.length],
                        this.clientId
                        )
                    );
                    
                }
            }

            // Presidential vote quota is inactive (??? - perhaps have the programmer add this in?)
            if (curGroupName.includes("pres") || curGroupName.includes("vote 20")) {
                this.check.presVoteInactiveChecked = true;

                let warningDisplayed = false;
                for (let i = 0; i < curGroup.subQuotas.length; i++) {
                    let quota = curGroup.subQuotas[i];
                    if (quota.active) {
                        if (!warningDisplayed) {
                            console.log(curGroup, "Presidential Vote quota is active (Checklist)");
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
