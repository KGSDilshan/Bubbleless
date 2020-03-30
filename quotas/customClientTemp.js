class FMClient extends BaseClient {
    constructor() {
        super("DB");
    }

    clientSpecificWarnings() {
        if (RAN_CSWARNINGS)
            return;
        RAN_CSWARNINGS = true;
        if (QUOTA_GROUPS.length == 0)
            return;

        // if dual mode, n sizes should be equal
        if (QUOTA_GROUPS[0].isDual == 2) {
            // two modes established
            let modeCount = 0;
            // both modes are equal N
            let prevMode = undefined;
            let isCorrect = false;
            let indexes = [];
            for (let i = 0; i < QUOTA_GROUPS[0].nSizes.length; i++) {
                let nSize = QUOTA_GROUPS[0].nSizes[i];
                if (prevMode == undefined && nSize > 0) {
                    // first non-zero nSize
                    prevMove = nSize;
                    modeCount++;
                    index.push(i);
                } else if (modeCount > 0 && prevMode == nSize) {
                    // found second nSize and it matches the first one
                    isCorrect = true;
                    break;
                } else if (modeCount > 0 && prevMode != nSize && nSize > 0) {
                    // found an nSize that's non-zero and doesn't match
                    index.push(i);
                    break;
                }
            }

            if (!isCorrect) {
                QUOTA_GROUPS[0].warnings.push("WARNING: Dual mode N sizes must be equal for FM. (Checklist)");
                alert("Client Requires Dual mode N Size to each be half of total N. Continue if intended, otherwise adjust and process again.");
            }
        }

        // if mode is phone, add 5% flex to all quotas that aren't counters
        for (let i = 0; i < QUOTA_GROUPS.length; i++) {
            if (QUOTA_GROUPS[i].mode == 1) {
                // check that quota group includes 5% flex
                /*
                    needs to be changed if isflex && flexAmount != 5
                    needs to be changed if !isflex
                    needs to be changed if isRawFlex && not a split quota
                */
                if ((QUOTA_GROUPS[i].isFlex && QUOTA_GROUPS[i].flexAmount != 5)
                    || !QUOTA_GROUPS[i].isFlex
                    || (QUOTA_GROUPS[i].isRawFlex && !QUOTA_GROUPS[i].group_name.toLowerCase().includes("split"))) {
                    if (QUOTA_GROUPS[i].name.toLowerCase().includes("phone")) {
                        continue;
                    } else {

                    }
                }
                for (let j = 0; j < QUOTA_GROUPS[i].length; j++) {
                    let quota = QUOTA_GROUPS[i].subQuotas[j];
                    if (quota.counter == false && !quota.rawName.includes("phone")) {
                        return;
                        // TODO
                    }
                }
            }
        }

        // phone type quotas should be inactive
        // LL Min 30%
        // Splits should be +5 added

    }
}
