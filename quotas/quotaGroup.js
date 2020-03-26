class QuotaGroup {
    constructor(name, config, subQuotas) {
        this.group_name = name;
        this.isTri = config.isTri;
        this.isDual = config.isDual;
        this.isFlex = config.isFlex;
        this.isRawFlex = config.isRawFlex;
        this.flexAmount = config.flexAmount;
        this.nSizes = config.nSizes.slice();
        // total N is all nsizes totaled together
        this.totalN = this.nSizes.reduce((a, b) => a + b, 0);
        this.subQuotas = [];
        this.rawSubQuotas = subQuotas.slice();
        this.isStandard = true; // placeholder property for client specific and tabled quotas
        this.warnings = [];
        this.textWarnings = [];


        // figure out mode and nsizes of this quota
        this.mode = 0;
        this.hasSplits = config.hasSplits;
        this.splits = config.splits;
        if (this.isTri) {
            this.mode = 3;
        } else if (this.isDual) {
            this.mode = 2;
        } else {
            this.mode = 1;
        }
        if (this.nSizes.length < this.mode) {
            alert("Quota group " + this.group_name + " is mode " + this.mode.toString() +
             ", but N Sizes input only contains " + this.nSizes.length.toString());
        }

        // populate sub quotas array
        console.log("raw subquotas:", this.rawSubQuotas);
        if (this.isStandard) {
            for (let i = 0; i < this.rawSubQuotas.length; i++) {
                let name = this.rawSubQuotas[i][0];
                let percent = this.rawSubQuotas[i][1];
                let question = this.rawSubQuotas[i][2];
                let codes = this.rawSubQuotas[i][3].split(" ").join("").split(",");
                this.subQuotas.push(new Quota(this, name, percent, question, codes));
                console.log(this.rawSubQuotas[i]);
            }
        }
    }


    getName() {
        return this.group_name;
    }


    validateQuotas() {
        let limitTotal = 0;
        let dupeQs = [];
        let zeroLimits = [];
        let raw = this.subQuotas[0].isRaw;
        for (let i = 0; i < this.subQuotas.length; i++) {
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
            if (this.subQuotas[i].valLimit == 0) {
                zeroLimits.push(i);
            }
        }

        dupeQs = dupeQs.splice(0, dupeQs.length, ...(new Set(dupeQs)));
        // limit related errors
        if (!raw && Math.abs(limitTotal - 100) > 0.01) {
            this.warnings.push("WARNING: In group: " + this.getName() +
                                ", limit doesn't add up to 100%. Currently: " +  limitTotal + "%");
        } else if (raw && limitTotal != this.totalN) {
            this.warnings.push("WARNING: In group: " + this.getName() + ", sum of raw limits don't match Nsize " +
                                this.totalN + "currently at: " + limitTotal);
        }

        // Error with duplicate Question Names
        for (let i = 0; i < dupeQs.length; i++) {
            this.warnings.push("WARNING: In group: " + this.getName() + ", duplicate name found for " + this.subQuotas[dupeQs[i]].name);
        }

        // Error with limit 0 for quota
        for (let i = 0; i < zeroLimits.length; i++) {
            this.warnings.push("WARNING: Quota " + this.subQuotas[zeroLimits[i]].name +
                                " has a limit of 0. Quota limit is set to 0 and inactive.");
        }

        // true if no errors
        return this.warnings.length == 0;
    }


    displayWarnings() {
        let message = "";
        alertMsg = "";
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
        document.getElementById("QuotaWarningsBuffer").innerHTML = message + "<br><br>";
        return alertMsg;
        }


    displayQuotas() {
        let grpData = "";
        for (let i = 0; i < this.subQuotas.length; i++) {
            grpData += this.subQuotas[i].display();
        }
        return grpData;
    }



}
