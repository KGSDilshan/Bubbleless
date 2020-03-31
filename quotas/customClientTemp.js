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
            for (let i = 0; i < group.rawSubQuotas.length; i++) {
                let name = group.rawSubQuotas[i][0];
                let lname = name.toLowerCase();
                let percent = group.rawSubQuotas[i][1];
                if (lname.startsWith("l") && !lname.includes("counter") ||
                    (lname.includes("counter") && !percent.includes("30"))) {
                    redo = true;
                    break;
                }
                if (lname.startsWith("c") && !percent.includes("70")) {
                    redo = true;
                    break;
                }
                if (lname.startsWith("c") or lname.startsWith("l")) {
                    seen = true;
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

}
