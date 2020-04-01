function CreateClient(id) {
    switch (id) {
        case 2: // AL
            return new ALClient();
        case 3: // DB
            return new DBClient();
        case 4: // FM
            return new FMClient();
        case 5: // RN
            return new RNClient();
        case 6: // EM
            return new EMClient();
        case 7: // PB
            return new PBClient();
        case 8: // WL
            return new WLClient();
        case 9: // KT
            return new KTClient();
        case 10: // LR
            return new LRClient();
        case 11: // LP
            return new LPClient();
        case 12: // NRC
            return new NRCClient();
        case 13: // FB
            return new FBClient();
        case 14: // NR
            return new NRClient();
        case 15: // SX
            return new SXClient();
        case 16: // GSG
            return new GSGClient(); // done
        // fall through
        case 1: // McL
        default:
            return new BaseClient();
    };
}



class BaseClient {
    constructor(name="BasicClient") {
        this.name = name;
        RAN_CSWARNINGS = false;
    }

    clientSpecificWarnings() {
        if (this.randCSWarns)
            return;
        this.ranCSWarns = true;
    }

    clientSpecificQuotaTransformations(group) {
        return;
    }

    missingGender() {
        return;
    }

    missingAge() {
        return;
    }

    missingParty() {
        return;
    }

    missingRegion() {
        return;
    }

    missingEthnicity() {
        return;
    }

    missingPhoneType() {
        return;
    }

    missingMode() {
        return;
    }

    getSuffix(quota) {
        let suffix = '"{""action"":""1"",""autoload_url"":""1"",""active"":""' + (quota.active ? 1 : 0) +
                    '"",""qls"":[{""quotals_language"":""en"",""quotals_name"":""x"",""quotals_url"":"""",' +
                    '""quotals_urldescrip"":"""",""quotals_message"":""Sorry your responses have exceeded' +
                    ' a quota on this survey.""}]}"';
        return suffix;
    }

    finalName(quota, qname, limit) {
        // flex name modification
        let name = qname;
        if (quota.group.isFlex && !quota.counter) {
            name += " (" + (quota.group.isRawFlex ? "" : "Flex ") + quota.group.flexAmount + (quota.group.isRawFlex ? "" : "%") + " added)";
        }
        // counter name modification
        if (quota.counter == true) {
            name += " (Min : " + limit + ")";
        }
        return name;
    }

    counterQuota(quota) {
        if (!quota.counter)
            return;
        let counterLim = "";
        for (let k = 0; k < (quota.group.totalN.toString().length); k++) {
            counterLim += "9";
        }
        quota.active = false;
        // get min value
        let minVal = quota.valLimit;
        switch (quota.group.mode) {
            case 1:
                // phone only/single mode
                quota.limits.phone = counterLim;
                break;
            case 2:
                // figure out which two modes they are
                if (quota.group.isDual) {
                    if (quota.group.nSizes.length > 0 && quota.group.nSizes[0] != 0 && quota.group.nSizes[0]) {
                        quota.limits.phone = counterLim;
                    }
                    if (quota.group.nSizes.length > 1 && quota.group.nSizes[1] != 0 && quota.group.nSizes[1]) {
                        quota.limits.email = counterLim;
                    }
                    if (quota.group.nSizes.length > 2 && quota.group.nSizes[2] != 0 && quota.group.nSizes[2]) {
                        quota.limits.text = counterLim;
                    }
                } else {
                    quota.limits.normLim = counterLim;
                }
                break;
            case 3:
                // tri mode is every mode
                if (quota.group.isTri) {
                    quota.limits.phone = counterLim;
                    quota.limits.email = counterLim;
                    quota.limits.text = counterLim;
                } else {
                    quota.limits.normLim = counterLim;
                }
                break;
        }
    }

    calcLimit(quota) {
        // flex applied or not
        let flex = quota.group.isFlex;
        let flexRaw = quota.group.isRawFlex;
        let flexAmount = quota.group.flexAmount;
        // determine if limit is a raw limit
        if (!quota.strLimit.includes("%")) {
            let lim = parseFloat(quota.strLimit);
            if (flexRaw) {
                lim += flexAmount;
            } else if (flex) {
                lim += round05Ciel((quota.group.totalN * flexAmount) / 100);
            }
            // raw values
            quota.isRaw = true;
            switch (quota.group.mode) {
                case 1:
                    // phone only
                    quota.limits.phone = lim;
                    break;
                case 2:
                    if (quota.group.isDual) {
                        // figure out which two modes they are
                        if (quota.group.nSizes.length > 0 && quota.group.nSizes[0] != 0 && quota.group.nSizes[0]) {
                            quota.limits.phone = lim;
                        }
                        if (quota.group.nSizes.length > 1 && quota.group.nSizes[1] != 0 && quota.group.nSizes[1]) {
                            quota.limits.email = lim;
                        }
                        if (quota.group.nSizes.length > 2 && quota.group.nSizes[2] != 0 && quota.group.nSizes[2]) {
                            quota.limits.text = lim;
                        }
                    } else {
                        quota.limits.normLim = lim;
                    }
                    break;
                case 3:
                    if (quota.group.isTri) {
                        // tri mode is every mode
                        quota.limits.phone = lim;
                        quota.limits.email = lim;
                        quota.limits.text = lim;
                    } else {
                        quota.limits.normLim = lim;
                    }
                    break;
            }
        } else {
            let lim = parseFloat(quota.strLimit.split("%").join(""));
            let flexAddition = 0;
            if (flexRaw) {
                flexAddition += flexAmount;
            } else if (flex) {
                flexAddition += round05Ciel((quota.group.totalN * flexAmount) / 100);
            }
            console.log(lim, quota.name)
            // percentage values
            switch (quota.group.mode) {
                case 1:
                    // phone only/single mode
                    if (quota.group.Phone) {
                        quota.limits.phone = round05Ciel((quota.group.nSizes[0] * lim)/100) + flexAddition;
                    }
                    if (quota.group.includesEmail) {
                        quota.limits.phone = round05Ciel((quota.group.nSizes[1] * lim)/100) + flexAddition;
                    }
                    if (quota.group.includesTest) {
                        quota.limits.phone = round05Ciel((quota.group.nSizes[2] * lim)/100) + flexAddition;
                    }
                    break;
                case 2:
                    if (quota.group.isDual) {
                        // figure out which two modes they are
                        if (quota.group.nSizes.length > 0 && quota.group.nSizes[0] != 0 && quota.group.nSizes[0]) {
                            quota.limits.phone = round05Ciel((quota.group.nSizes[0] * lim)/100) + flexAddition;
                        }
                        if (quota.group.nSizes.length > 1 && quota.group.nSizes[1] != 0 && quota.group.nSizes[1]) {
                            quota.limits.email = round05Ciel((quota.group.nSizes[1] * lim)/100) + flexAddition;
                        }
                        if (quota.group.nSizes.length > 2 && quota.group.nSizes[2] != 0 && quota.group.nSizes[2]) {
                            quota.limits.text = round05Ciel((quota.group.nSizes[2] * lim)/100) + flexAddition;
                        }
                    } else {
                        quota.limits.normLim = round05Ciel((quota.group.nSizes[0] * lim)/100) + flexAddition;
                    }
                    break;
                case 3:
                    if (quota.group.isTri) {
                        // tri mode is every mode
                        quota.limits.phone = round05Ciel((quota.group.nSizes[0] * lim)/100) + flexAddition;
                        quota.limits.email = round05Ciel((quota.group.nSizes[1] * lim)/100) + flexAddition;
                        quota.limits.text = round05Ciel((quota.group.nSizes[2] * lim)/100) + flexAddition;
                    } else {
                        quota.limits.normLim = round05Ciel((quota.group.nSizes[0] * lim)/100) + flexAddition;;
                    }
                    break;
            }
        }
    }
}
