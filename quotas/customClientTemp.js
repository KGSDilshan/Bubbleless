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
            GLOBAL_WARNINGS.push({
                message: "WARNING: In group: " + group.group_name + ", Client dual modes are on two links. Full N used.",
                callback: undefined,
                group: group,
            });
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
                GLOBAL_WARNINGS.push({
                    message: "WARNING: PhoneType flex removed. (Checklist)",
                    callback : undefined,
                });
            }
            group.isFlex = false;
            group.flexAmount = 0;
            group.isRaw = false;
            if (redo || !seen) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: PhoneType is always 30%(min) LL and 70% cell. (Checklist)",
                    callback : undefined,
                });
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
                GLOBAL_WARNINGS.push({
                    message: "WARNING: Split quotas need to have 5n Flex. (Checklist)",
                    callback : undefined,
                });
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
                        GLOBAL_WARNINGS.push({
                            message: "WARNING: Shouldn't have flex in " + group.group_name + " because it's a counter. (Checklist)",
                            callback : undefined,
                        });
                        group.isFlex = false;
                        group.isRawFlex = false;
                    }
                }
            }
            if (!hasCounter && (group.flexAmount != 5 || !group.isFlex || group.isRawFlex)) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: 5% flex added to group" + group.group_name + ". (Checklist)",
                    callback : undefined,
                });
                group.isFlex = true;
                group.flexAmount = 5;
                group.isRawFlex = true;
            }
        } else {
            // no flex in online modes
            if (group.isFlex || group.isRawFlex) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: Shouldn't have flex in " + group.group_name + " for online. **Unchanged** (Checklist)",
                    callback : undefined,
                });
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
                let name = group.rawSubQuotas[i][0];
                if (!name.includes("(counter)")) {
                    group.rawSubQuotas[i][0] = name + "(counter)";
                    group.rawSubQuotas[i][1] =  "0%";
                    setToCounter = true;
                }
            }
            if (setToCounter) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.group_name + " Quotas made as counter and inactive. (Checklist)",
                    callback : undefined,
                });
            }
        }

        // if tri mode, mode quotas need to be 1/3
        if (group.mode == 3 && group.group_name.toLowerCase().includes("mode")) {
            let expectedN = round05Ciel(QUOTA_GROUPS[0].totalN / 3);
            group.rawSubQuotas = [
                ["Phone", expectedN, "pMode", "1"],
                ["Email", expectedN, "pMode", "2"],
                ["Text", expectedN, "pMode", "3"],
            ];
            GLOBAL_WARNINGS.push({
                message: "WARNING: Mode quotas need to be 1/3 total N. (Checklist)",
                callback : undefined,
            });
        }
    }

    finalName(quota, qname, limit) {
        // flex name modification
        let name = qname;
        if (quota.group.isFlex && !quota.counter) {
            name += " (" + (quota.group.isRawFlex ? "" : "Flex ") + quota.group.flexAmount + (quota.group.isRawFlex ? "" : "%") + " added)";
        }
        // counter name modification
        if (quota.counter == true) {
            if (!limit == 0 && !quota.group.group_name.toLowerCase().includes("phonetype"))
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
                GLOBAL_WARNINGS.push({
                    message: "WARNING: Missing Phonetype quotas",
                    callback: undefined,
                });
                // create Phonetype quota
                let configTemplate = getBaseConfigTemplate();
                let rawQuotas = [
                    ["Landline(counter)", "0%", "pPhoneType", "1"],
                    ["Cell(counter)", "0%", "pPhoneType", "2"],
                ];
                console.log(configTemplate);
                QUOTA_GROUPS.push(new QuotaGroup("PhoneType", configTemplate, rawQuotas));
            }
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
                    GLOBAL_WARNINGS.push({
                        message: "WARNING: " + group.group_name + " should be pulling from survey. (Checklist)",
                        callback : undefined,
                    });
                    return;
                }
            }
        } else {
            let setToSample = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (!group.rawSubQuotas[i][2].startsWith("p") && !gname.includes("split")) {
                    setToSample = true;
                    group.rawSubQuotas[i][2] = "p" + group.rawSubQuotas[i][2];
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
                    group.rawSubQuotas[i][2] = "p" + group.rawSubQuotas[i][2];
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
        // Add “DLCC Support”, “DLCC Turnout”, AND “VoteSelect” as counters if exists in sample
        let genderGrp = getQuotaByNames(["gender", "sex"]);
        let partyGrp = getQuotaByNames(["party"]);
        let ageGrp = getQuotaByNames(["age"]);
        let ethGrp = getQuotaByNames(["race", "ethnicity"]);
        let dlccSupportGrp = getQuotaByNames(["dlcc support", "support"]);
        let dlccTurnoutGrp = getQuotaByNames(["dlcc turnout", "turnout"]);
        let VoteSelect = getQuotaByNames(["vote select, voteselect"]);
        let configTemplate = getBaseConfigTemplate();
        if (genderGrp == undefined) {
            // create gender quota
            GLOBAL_WARNINGS.push({
                message: "WARNING: Missing Gender quotas, added as counters (Checklist)",
                callback : undefined,
            });
            let rawQuotas = [
                ["Male(counter)", "0%", "pGender", "1"],
                ["Female(counter)", "0%", "pGender", "2"],
            ];
            QUOTA_GROUPS.push(new QuotaGroup("Gender", configTemplate, rawQuotas));
        }
        if (partyGrp == undefined) {
            // create party quota
            GLOBAL_WARNINGS.push({
                message: "WARNING: Missing Party quotas, added as counters (Checklist)",
                callback : undefined,
            });
            let rawQuotas = [
                ["Democrat(counter)", "0%", "pParty", "1"],
                ["Republican(counter)", "0%", "pParty", "2"],
                ["NPP(counter)", "0%", "pParty", "3"],
                ["Other(counter)", "0%", "pParty", "4"],
            ];
            QUOTA_GROUPS.push(new QuotaGroup("Party", configTemplate, rawQuotas));
        }
        if (ageGrp == undefined) {
            // create age quota
            GLOBAL_WARNINGS.push({
                message: "WARNING: Missing Age quotas, added as counters (Checklist)",
                callback : undefined,
            });
            let rawQuotas = [
                ["18-29(counter)", "0%", "pAge", "1"],
                ["30-39(counter)", "0%", "pAge", "2"],
                ["40-49(counter)", "0%", "pAge", "3"],
                ["50-64(counter)", "0%", "pAge", "4"],
                ["65+(counter)", "0%", "pAge", "5"],
                ["Other(counter)", "0%", "pAge", "6"],
            ];
            QUOTA_GROUPS.push(new QuotaGroup("Age", configTemplate, rawQuotas));
        }
        if (ethGrp == undefined) {
            // create eth quota
            GLOBAL_WARNINGS.push({
                message: "WARNING: Missing Ethnicity quotas, added as counters (Checklist)",
                callback : undefined,
            });
            let rawQuotas = [
                ["AA(counter)", "0%", "pEthnicity", "1"],
                ["Asian(counter)", "0%", "pEthnicity", "2"],
                ["Latino(counter)", "0%", "pEthnicity", "3"],
                ["Other(counter)", "0%", "pEthnicity", "4"],
            ];
            QUOTA_GROUPS.push(new QuotaGroup("Ethnicity", configTemplate, rawQuotas));
        }

        // Add “DLCC Support”, “DLCC Turnout”, AND “VoteSelect” as counters if exists in sample
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
                group.rawSubQuotas[i][2] = "p" + group.rawSubQuotas[i][2];
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

    clientSpecificQuotaTransformations(group) {
        if (group.group_name.toLowerCase().includes("split")) return;
        // every quota go off sample except Party
        let gname = group.group_name.toLowerCase();
        if (gname.includes("party")) {
            let showWarn = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                if (group.rawSubQuotas[i][2].startsWith("p") && !group.rawSubQuotas[i][2].toLowerCase().startsWith("party")) {
                    group.rawSubQuotas[i][2] = "PartyCoded";
                    showWarn = true;
                }
            }
            if (showWarn) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.group_name + " pulls from survey. (Checklist)",
                    callback : undefined,
                });
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
                group.rawSubQuotas[i][2] = "p" + group.rawSubQuotas[i][2];
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

    clientSpecificQuotaTransformations(group) {
        // phone type is max 65% cell
        if (group.group_name.toLowerCase().includes("phonetype")) {
            let showWarn = false;
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                let name = group.rawSubQuotas[i][0].toLowerCase();
                let percentage = group.rawSubQuotas[i][1];
                if (name.startsWith("l")) {
                    // min 35%
                    if (!name.includes("counter")) {
                        group.rawSubQuotas[i][0] = group.rawSubQuotas[i][0] + "(counter)";
                        showWarn = true;
                    }
                } else if (name.startsWith("c")) {
                    // 65% max
                    if (!percentage.toString().startsWith("65")) {
                        group.rawSubQuotas[i][1] = "65%";
                        showWarn = true;
                    }
                }
            }
            if (showWarn) {
                GLOBAL_WARNINGS.push({
                    message: "WARNING: " + group.group_name + " Cell is max 65% and LL is min 35%. (Checklist)",
                    callback : undefined,
                });
            }
        }
    }

    clientSpecificWarnings() {
        if (this.randCSWarns)
            return;
        this.ranCSWarns = true;
        let pt = getQuotaByNames(["phonetype"]);
        if (pt == undefined && QUOTA_GROUPS[0].includesPhone) {
            // create gender quota
            GLOBAL_WARNINGS.push({
                message: "WARNING: Missing Phonetype quotas, added. (Checklist)",
                callback : undefined,
            });


            let configTemplate = getBaseConfigTemplate();
            let rawQuotas = [
                ["Landline(counter)", "35%", "pPhoneType", "1"],
                ["Cell", "65%", "pPhoneType", "2"],
            ];
            QUOTA_GROUPS.push(new QuotaGroup("PhoneType", configTemplate, rawQuotas));
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
        console.log("region splits");
    }

    addTrailingHardQuota(grp) {
        grp.trailingNameStr += " (HARD QUOTA)";
        console.log("applied hard quota");
    }

    clientSpecificQuotaTransformations(group) {
        // need gender by region quotas
        if (group.group_name.toLowerCase().includes("gender")) {
            // check if the splits include region
            let names = ["(region)", "(district)", "(geo)"];
            let isSplit = false;
            if (group.hasSplits) {
                for (let i = 0; i < group.rawSubQuotas && isSplit == false; i++) {
                    for (let j = 0; j < names.length; j++) {
                        if (group.rawSubQuotas[i].toLowerCase() == names[j].toLowerCase()) {
                            isSplit = true;
                            break;
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

    finalName(quota, qname, limit) {
        // flex name modification
        let name = qname + quota.group.trailingNameStr;
        if (quota.group.isFlex && !quota.counter) {
            name += " (" + (quota.group.isRawFlex ? "" : "Flex ") + quota.group.flexAmount + (quota.group.isRawFlex ? "" : "%") + " added)";
        }
        // counter name modification
        if (quota.counter == true) {
            name += " (Min : " + limit + ")";
        }
        return name;
    }
}
