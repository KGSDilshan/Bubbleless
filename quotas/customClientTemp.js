class FMClient extends BaseClient {
    constructor() {
        super("FM");
    }

    clientSpecificQuotaTransformations(group) {
        // no group should have dual mode
        if (this.mode > 1) {
            group.isDual = false;
            group.isTri = false;
            group.nSizes = [group.totalN, group.totalN, group.totalN];
            group.warnings.push("WARNING: In group: " + group.group_name + ", Client dual modes are on two links. Full N used.");
        }

        // phone mode quotas should contain counter for LL and max for cell
        if (group.group_name.toLowerCase().includes("phone")) {
            let redo = false;
            let seen = false;
            let hasMode = 0;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                let name = group.rawSubQuotas[i][0];
                let lname = name.toLowerCase();
                let percent = group.rawSubQuotas[i][1];
                let question = group.rawSubQuotas[i][2];
                if (lname.startsWith("l") && !lname.includes("counter") ||
                    (lname.includes("counter") && !percent.includes("30"))) {
                    redo = true;
                    break;
                }
                if (lname.startsWith("c") && !percent.includes("70")) {
                    redo = true;
                    break;
                }
                if (lname.startsWith("c") || lname.startsWith("l")) {
                    seen = true;
                }
                if (question == "pMode") {
                    hasMode++;
                }
            }
            if (group.isFlex || group.isRaw) {
                group.warnings.push("WARNING: PhoneType flex removed. (Checklist)");
            }
            group.isFlex = false;
            group.flexAmount = 0;
            group.isRaw = false;
            if (redo || !seen) {
                group.warnings.push("WARNING: PhoneType is always 30%(min) LL and 70% cell. (Checklist)");
                group.rawSubQuotas = [];
                group.isStandard = false;
                group.rawSubQuotas.push(["Landline(counter)", "30%", "pPhoneType", "1"]);
                group.rawSubQuotas.push(["Cell", "70%", "pPhoneType", "2"]);
                let q = new Quota(group, "Landline(counter)", "30%", "pPhoneType", [1], CLIENT);
                q.active = false;
                this.subQuotas.push(q);
                q = new Quota(group, "Cell", "70%", "pPhoneType", [2], CLIENT);
                q.active = false;
                this.subQuotas.push(q);
            }

            if (hasMode < 2 && group.includesPhone) {
                // should have a mode attached to phone type
                let q = new Quota(group, "Landline(counter)", "30%", "pMode", [1], CLIENT);
                q.active = false;
                group.subQuotas.push(q);
                q = new Quota(group, "Cell", "70%", "pMode", [1], CLIENT);
                q.active = false;
                group.hasSplits = true;
                group.splits.push("(mode)");
            }
        } else if (group.group_name.toLowerCase().includes("split") && group.isPhone == true) {
            // should be flex should be flat 5
            if (group.flexAmount != 5 || !group.isRawFlex) {
                group.warnings.push("WARNING: Split quotas need to have 5n Flex. (Checklist)");
                group.isFlex = true;
                group.flexAmount = 5;
                group.isRawFlex = true;
            }
        } else if (group.isPhone) {
            // all quotas need 5% flex, if quota doesn't contain a counter
            let hasCounter = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                let name = group.rawSubQuotas[i][0];
                let lname = name.toLowerCase();
                if (!lname.includes("counter")) {
                    hasCounter = true;
                } else {
                    // groups with counters shouldn't have flex.
                    if (group.isFlex || group.isRawFlex) {
                        group.warnings.push("WARNING: Shouldn't have flex in " + group.group_name + " because it's a counter. (Checklist)");
                        group.isFlex = false;
                        group.isRawFlex = false;
                    }
                }
            }
            if (!hasCounter && (group.flexAmount != 5 || !group.isFlex || group.isRawFlex)) {
                group.warnings.push("WARNING: 5% flex added to group" + group.group_name + ". (Checklist)");
                group.isFlex = true;
                group.flexAmount = 5;
                group.isRawFlex = true;
            }
        } else {
            // no flex in online modes
            if (group.isFlex || group.isRawFlex) {
                group.warnings.push("WARNING: Shouldn't have flex in " + group.group_name + " for online. **Unchanged** (Checklist)");
            }
        }
    }

    clientSpecificWarnings() {
        if (this.randCSWarns)
            return;
        this.ranCSWarns = true;

        // check if phone type quota exists
        let seenPT = false;
        let warnActivePT = false;
        for (let i = 0; i < QUOTA_GROUPS.length; i++) {
            if (QUOTA_GROUPS[i].getName().toLowerCase().includes("phonetype")) {
                // make inactive
                for (let j = 0; j < QUOTA_GROUPS[i].length; j++) {
                    if (QUOTA_GROUPS[i].subQuotas.active) {
                        QUOTA_GROUPS[i].subQuotas.active = false;
                        warnActivePT = true;
                    }
                }
                seenPT = true;
                break;
            }
        }

        if (!seenPT && QUOTA_GROUPS[0].includesPhone) {
            // create Phonetype quota
            let configTemplate = getBaseConfigTemplate();
            let rawQuotas = [
                ["Landline(counter)", "30%", "pPhoneType", "1"],
                ["Cell", "70%", "pPhoneType", "2"],
            ];
            let grp = new QuotaGroup("PhoneType", configTemplate, rawQuotas);
            QUOTA_GROUPS.push(grp);
            for (let i = 0; i < grp.subQuotas.length; i++) {
                grp.subQuotas[i].active = false;
            }
        }
    }

}

class PBClient extends BaseClient {
    constructor() {
        super("PB");
    }

    clientSpecificQuotaTransformations(group) {
        // Phone type is all 999 counters
        let setToCounter = false;
        if (group.group_name.toLowerCase().includes("phonetype")) {
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                // for each sub quota add the "(counter)" key word to it
                let name = group.rawQuotas[i][0];
                if (!name.includes("(counter)")) {
                    group.rawQuotas[i][0] = name + "(counter)";
                    group.rawQuotas[i][1] =  "0%";
                    setToCounter = true;
                }
            }
            if (setToCounter) {
                group.warnings.push("WARNING: " + group.group_name + " Quotas made as counter and inactive. (Checklist)");
            }
        }
    }

    finalName(quota, qname, limit) {
        // flex name modification
        let name = qname;
        if (quota.group.isFlex) {
            name += " (" + (quota.group.isRawFlex ? "" : "Flex ") + quota.group.flexAmount + (quota.group.isRawFlex ? "" : "%") + " added)";
        }
        // counter name modification
        if (quota.counter == true) {
            if (!limit == 0 && !quota.group.name.toLowerCase().includes("phonetype"))
                name += " (Min : " + limit + ")";
            quota.active = false;
        }
        return name;
    }

    clientSpecificWarnings() {
        if (this.randCSWarns)
            return;
        this.ranCSWarns = true;

        // check existance of PT quota
        if (QUOTA_GROUPS[0].includesPhone) {
            let seenPT = false;
            for (let i = 0; i < QUOTA_GROUPS.length; i++) {
                let grp = QUOTA_GROUPS[i];
                if (grp.group_name.toLowerCase().includes("phonetype")) {
                    seenPT = true;
                }
            }
            if (!seenPT) {
                QUOTA_GROUPS[0].warnings.push("WARNING: Missing Phonetype quotas")
                // create Phonetype quota
                let configTemplate = getBaseConfigTemplate();
                let rawQuotas = [
                    ["Landline(counter)", "0%", "pPhoneType", "1"],
                    ["Cell(counter)", "0%", "pPhoneType", "2"],
                ];
                QUOTA_GROUPS.push(new QuotaGroup("PhoneType", configTemplate, rawQuotas));
            }
        }

        // if tri mode, mode quotas need to be 1/3
        if (QUOTA_GROUPS[0].mode == 3) {
            let modeGrp = getQuotaByNames(["mode"]);
            let expectedN = round05Ciel(QUOTA_GROUPS[0].totalN / 3);
            for (let i = 0; i < modeGrp.subQuotas.length; i++) {
                modeGrp.subQuotas.isRaw = true;
                modeGrp.subQuotas.valLimit = expectedN;
                modeGrp.subQuotas.strLimit = expectedN;
            }
            modeGrp.warnings.push("");
        }
    }
}


class WLClient extends BaseClient {
    constructor() {
        super("WL");
    }

    clientSpecificQuotaTransformations(group) {
        // every quota go off sample except ethnicity

        let gname = group.group_name.toLowerCase();
        if (gname.includes("ethnicity") || gname.includes("race")) {
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (group.rawSubQuotas[i][2].startsWith("p")) {
                    group.warnings.push("WARNING: " + group.group_name + " should be pulling from survey. (Checklist)");
                    return;
                }
            }
        } else {
            let setToSample = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (!group.rawSubQuotas[i][2].startsWith("p")) {
                    setToSample = true;
                    group.rawSubQuotas[i][2] = "p" + group.rawSubQuotas[i][2];
                }
            }
            if (setToSample) {
                group.warnings.push("WARNING: " + group.group_name + " needs to pull from sample. (Checklist)");
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
                group.rawSubQuotas[i][2] = "p" + group.rawSubQuotas[i][2];
            }
        }
        if (setToSample) {
            group.warnings.push("WARNING: " + group.group_name + " needs to pull from sample. (Checklist)");
        }
    }
}


class LRClient extends BaseClient {
    constructor() {
        super("LR");
    }

    clientSpecificQuotaTransformations(group) {
        // quotas pull from sample (including Splits) when LISTED
        if (isNol) {
            let setToSample = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (!group.rawSubQuotas[i][2].startsWith("p")) {
                    setToSample = true;
                    group.rawSubQuotas[i][2] = "p" + group.rawSubQuotas[i][2];
                }
            }
            if (setToSample) {
                group.warnings.push("WARNING: " + group.group_name + " needs to pull from sample. (Checklist)");
            }
        }

    }

    finalName(quota, qname, limit) {
        // flex name modification
        let name = qname;
        if (quota.group.isFlex) {
            name += " (" + (quota.group.isRawFlex ? "" : "Flex ") + quota.group.flexAmount + (quota.group.isRawFlex ? "" : "%") + " added)";
        }

        if (quota.counter == true) {
            if (limit > 0)
                name += " (Min : " + limit + ")";
            quota.active = false;
        }
        return name;
    }

    clientSpecificWarnings() {
        if (this.randCSWarns)
            return;
        this.ranCSWarns = true;

        // “Gender”, “Party”, “Age”, “Race”, must be quotas as counters if non-existant
        let genderGrp = getQuotaByNames(["gender", "sex"]);
        let partyGrp = getQuotaByNames(["party"]);
        let ageGrp = getQuotaByNames(["age"]);
        let ethGrp = getQuotaByNames(["race", "ethnicity"]);
        let configTemplate = getBaseConfigTemplate();
        if (genderGrp == undefined) {
            // create gender quota
            QUOTA_GROUPS[0].warnings.push("WARNING: Missing Gender quotas, added as counters (checklist)");
            let rawQuotas = [
                ["Male(counter)", "0%", "pGender", "1"],
                ["Female(counter)", "0%", "pGender", "2"],
            ];
            QUOTA_GROUPS.push(new QuotaGroup("Gender", configTemplate, rawQuotas));
        }
        if (partyGrp == undefined) {
            // create party quota
            QUOTA_GROUPS[0].warnings.push("WARNING: Missing Party quotas, added as counters (checklist)");
            let rawQuotas = [
                ["Democrat", "0%", "pParty", "1"],
                ["Republican", "0%", "pParty", "2"],
                ["NPP/Other", "0%", "pParty", "3"],
            ];
            QUOTA_GROUPS.push(new QuotaGroup("Party", configTemplate, rawQuotas));
        }
        if (ageGrp == undefined) {
            // create age quota
            QUOTA_GROUPS[0].warnings.push("WARNING: Missing Age quotas, added as counters (checklist)");
            let rawQuotas = [
                ["18-24", "0%", "pParty", "1"],
                ["Republican", "0%", "pParty", "2"],
                ["NPP/Other", "0%", "pParty", "3"],
            ];
            QUOTA_GROUPS.push(new QuotaGroup("Party", configTemplate, rawQuotas));
        }
        if (ethGrp == undefined) {
            // create eth quota
            return;
        }



        // Add “DLCC Support”, “DLCC Turnout”, AND “VoteSelect” as counters if exists in sample
        // Always keep the quotas with 2 or more conditions inactive (i.e. Gender – Male Region 1)
        // check existance of PT quota
        if (QUOTA_GROUPS[0].includesPhone) {
            let seenPT = false;
            for (let i = 0; i < QUOTA_GROUPS.length; i++) {
                let grp = QUOTA_GROUPS[i];
                if (grp.group_name.toLowerCase().includes("phonetype")) {
                    seenPT = true;
                }
            }
            if (!seenPT) {
                return;
            }
        }
    }
}
