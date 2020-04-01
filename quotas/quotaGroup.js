class QuotaGroup {
    constructor(name, config, subQuotas) {
        this.group_name = name;
        this.isTri = config.isTri;
        this.isDual = config.isDual;
        this.isFlex = config.isFlex;
        this.isRawFlex = config.isRawFlex;
        this.nSizes = config.nSizes.slice();
        // total N is all nsizes totaled together
        this.totalN = this.nSizes.reduce((a, b) => a + b, 0);
        this.flexAmount = parseFloat(config.flexAmount);
        this.includesPhone = false;
        this.includesEmail = false;
        this.includesText = false;
        this.Online = false;
        this.mode = 0;
        for (let i = 0; i < this.nSizes.length; i++) {
            if (config.nOverride == true && this.nSizes[i] != 0) {
                this.nSizes[i] = config.nOverrideVal;
            }
            if (this.nSizes[i] > 0 && i == 0) {
                this.includesPhone = true;
            }
            if (this.nSizes[i] > 0 && i == 1) {
                this.includesEmail = true;
                this.Online = true;
            }
            if (this.nSizes[i] > 0 && i == 2) {
                this.includesText = true;
                this.Online = true;
            }
        }
        this.Phone = this.Online ? false : true;
        this.subQuotas = [];
        this.rawSubQuotas = subQuotas.slice();
        this.isStandard = true; // placeholder property for client specific and tabled quotas
        this.warnings = [];
        this.textWarnings = [];
        this.hasSplits = config.hasSplits;
        this.splits = config.splits;
        this.id = config.id;
        this.splitQuotas = [];
        this.hasCounters = false;
        this.trailingNameStr = "";

        // figure out mode and nsizes of this quota
        this.mode = (this.includesPhone + this.includesEmail + this.includesText);

        if (this.nSizes.length < this.mode) {
            this.warnings.push("ERROR: " + this.group_name + " is mode " + this.mode.toString() +
             ", but N Sizes input only contains " + this.nSizes.length.toString());
            alert("Quota group " + this.group_name + " is mode " + this.mode.toString() +
             ", but N Sizes input only contains " + this.nSizes.length.toString());
        }

        // step 2
        CLIENT.clientSpecificQuotaTransformations(this);
        // populate sub quotas array
        if (this.isStandard) {
            for (let i = 0; i < this.rawSubQuotas.length; i++) {
                let name = this.rawSubQuotas[i][0];
                let percent = this.rawSubQuotas[i][1];
                let question = this.rawSubQuotas[i][2];
                let codes = this.rawSubQuotas[i][3].split(" ").join("").split(",");
                this.subQuotas.push(new Quota(this, name, percent, question, codes, CLIENT));
            }
        }

    }


    getName() {
        return this.group_name;
    }


    getRawFlex() {
        if (Number.isNaN(this.flexAmount)) {
            throw "Flex is not defined!";
        } else {
            return this.isRawFlex ? this.flexAmount : Math.ceil(this.flexAmount / 100 * this.totalN);
        }
    }


    validateQuotas() {
        let limitTotal = 0;
        let dupeQs = [];
        let zeroLimits = [];
        let raw = this.subQuotas[0].isRaw;
        let containsCounter = false;
        for (let i = 0; i < this.subQuotas.length; i++) {
            if (this.subQuotas[i].counter)
                containsCounter = true;
            limitTotal += this.subQuotas[i].valLimit;
            // unique quota names
            for (let j = 0; j < this.subQuotas.length; j++) {
                if (j == i)
                    continue;
                if ((this.subQuotas[i].name == this.subQuotas[j].name) &&
                    (this.subQuotas[i].qCodes == this.subQuotas[j].qCodes)) {
                        dupeQs.push(i);
                    }
            }
            if (this.subQuotas[i].valLimit == 0 && !this.subQuotas[i].counter) {
                zeroLimits.push(i);
            }
        }

        dupeQs = dupeQs.splice(0, dupeQs.length, ...(new Set(dupeQs)));
        // limit related errors
        if (!raw && Math.abs(limitTotal - 100) > 0.01 && !containsCounter) {
            this.warnings.push("WARNING: In group: " + this.getName() +
                                ", limit doesn't add up to 100%. Currently: " +  limitTotal + "%");
        } else if (raw && limitTotal != this.totalN && !containsCounter) {
            this.warnings.push("WARNING: In group: " + this.getName() + ", sum of raw limits don't match Nsize " +
                                this.totalN + "currently at: " + limitTotal);
        }

        // Error with duplicate Question Names
        for (let i = 0; i < dupeQs.length; i++) {
            this.warnings.push("WARNING: In group: " + this.getName() + ", duplicate name found for " + this.subQuotas[dupeQs[i]].name);
        }

        // Error with limit 0 for quota
        for (let i = 0; i < zeroLimits.length; i++) {
            this.warnings.push("WARNING: Quota " + this.subQuotas[zeroLimits[i]].name + " limit is set to 0 and inactive.");
        }

        // true if no errors
        return this.warnings.length == 0;
    }

    createSplitQuotas() {
        console.log(this.hasSplits, this.group_name, this.splits);
        if (!this.hasSplits) {
            return;
        }

        // figure out which "splits" are actually valid splits
        let validSplits = [];
        for (let i = 0; i < this.splits.length; i++) {
            for (let j = 0; j < QUOTA_HEADERS.length; j++) {
                let splitName = this.splits[i].toLowerCase().split("(").join("").split(")").join("");
                if (QUOTA_HEADERS[j].toLowerCase() == splitName && !validSplits.includes(splitName)) {
                    validSplits.push(splitName);
                }
            }
        }
        console.log(validSplits);
        // generate quotas for each split
        for (let f = 0; f < validSplits.length; f++) {
            let foreignGroup;
            // get corresponding group for a split - if it exists
            for (let g = 0; g < QUOTA_GROUPS.length; g++) {
                if (QUOTA_GROUPS[g].group_name.toLowerCase() == validSplits[f]) {
                    foreignGroup = QUOTA_GROUPS[g];
                    break;
                }
            }
            if (!foreignGroup) {
                console.log(validSplits);
                return;
            }
            // generate a split quota for each combination of foreign subquota and subquota
            for (let i = 0; i < foreignGroup.subQuotas.length; i++) {
                for (let j = 0; j < this.subQuotas.length; j++) {
                    // multiply percentage from foriegn quota with the subquota's percentage
                    let newPercent = ((foreignGroup.subQuotas[i].valLimit * this.subQuotas[j].valLimit)/100) + "%";
                    let newName = this.subQuotas[j].rawName + " - " + foreignGroup.subQuotas[i].rawName + this.trailingNameStr;
                    // then create a new quota with a merged name, percentage, question names, and codes
                    let splitQuota = new Quota(this, newName, newPercent, this.subQuotas[j].qName, this.subQuotas[j].qCodes, CLIENT);
                    // inactive subsplits by default
                    splitQuota.active = false;
                    this.splitQuotas.push(splitQuota);
                    splitQuota = new Quota(this, newName, newPercent, foreignGroup.subQuotas[i].qName, foreignGroup.subQuotas[i].qCodes, CLIENT);
                    // inactive subsplits by default
                    splitQuota.active = false;
                    this.splitQuotas.push(splitQuota);
                }
            }
        }
    }


    displayWarnings() {
        let message = "";
        let alertMsg = "";
        for (let i = 0; i < this.warnings.length; i++) {
            let htmlAlert;
            htmlAlert = '<div class="alert alert-danger alert-dismissible fade show" role="alert">';
            htmlAlert += this.warnings[i] + "<br>";
            htmlAlert += '<button type="button" class="close" data-dismiss="alert" aria-label="Close">';
            htmlAlert += '<span aria-hidden="true">&times;</span></button></div>';
            message += htmlAlert;
            alertMsg += this.warnings[i].split("<b>").join("").split("</b>").join("") + "\n"
        }
        // write
        document.getElementById("QuotaWarningsBuffer").innerHTML += message;
        return alertMsg;
    }

    displayQuotas() {
        let grpData = "";
        for (let i = 0; i < this.subQuotas.length; i++) {
            grpData += this.subQuotas[i].display();
        }

        for (let i = 0; i < this.splitQuotas.length; i++) {
            grpData += this.splitQuotas[i].display();
        }

        return grpData;
    }

    includesCounters() {
        return this.hasCounters;
    }
}
