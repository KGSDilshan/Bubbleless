class QuotaGroup {
    constructor(name, config, subQuotas) {
        this.group_name = name;
        this.isTri = config.isTri;
        this.isDual = config.isDual;
        this.isFlex = config.isFlex;
        this.isRawFlex = config.isRawFlex;
        this.flexAmount = config.flexAmount;
        this.nSizes = config.nSizes.slice();
        this.totalN = this.nSizes.reduce((a, b) => a + b, 0);
        this.subQuotas = [];
        this.rawSubQuotas = subQuotas.slice();
        this.mode = 0;
        if (this.isTri) {
            this.mode = 3;
        } else if (this.isDual) {
            this.mode = 2;
        } else {
            this.mode = 1;
        }
        if (this.nSize.length < this.mode) {
            alert("Quota group " + this.group_name + " is mode " + this.mode.toString() +
             ", but N Sizes input only contains " + this.nSizes.length.toString());
        }
    }

    get_name() {
        return this.group_name;
    }

    add_quota() {
        // TODO
    }

    validate_quotas() {
        // TODO
    }

}
