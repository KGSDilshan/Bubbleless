class QuotaGroup {
    constructor(name, config, subquotas) {
        this.group_name = name;
        this.isTri = config.isTri;
        this.isDual = config.isDual;
        this.isFlex = config.isFlex;
        this.isRawFlex = config.isRawFlex;
        this.flexAmount = config.flexAmount;
        this.nSize = config.nSizes;
        this.subQuotas = [];
        this.rawSubQuotas = subQuotas.slice();
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
