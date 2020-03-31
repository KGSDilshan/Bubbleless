// round up function
function round05Ciel(x) {
    let val = x.toString().split(".")
    if (val.length == 1)
        return parseInt(val);
    else if (parseInt(val[1][0]) >= 5)
        return parseInt(x) + 1
    else
        return parseInt(x)
}



class Quota {
    constructor(quotaGroup, quotaName, quotaPercentage, questionName, quotaCodes, client) {
        this.group = quotaGroup;
        this.client = client;

        this.name = quotaName;
        this.rawName = quotaName;
        // Quota name-level configurations
        this.counter = false;
        if (quotaName.includes("(counter)")) {
            this.counter = true;
            this.group.hasCounters = true;
            this.name = this.name.split("(counter)").join("");
        }
        this.name = quotaGroup.group_name + " - " + this.name;
        this.strLimit = quotaPercentage;
        this.valLimit = parseFloat(quotaPercentage.split("%").join(""));
        this.limits = {};
        this.qName = questionName;
        this.qCodes = quotaCodes; // arr of codes
        this.isRaw = false;
        this.active = this.valLimit != 0;
        if (!document.getElementById("OnlineQActivity").checked && !this.group.isPhone) {
            this.active = false;
        }
        this.action = 1; // term without warning
        this.csvMode = "Simple";
        this.calculateLimit();
    }

    calculateLimit() {
        this.client.calcLimit(this);
    }

    getRawNSize() {
        return parseInt(this.isRaw ? this.valLimit : this.valLimit * this.group.totalN / 100);
    }

    display() {
        // for each code, we need a new quota
        let data = "";
        let suffix;
        let name = "";
        for (let i = 0; i < this.qCodes.length; i++) {
            for (const property in this.limits) {
                if (this.limits[property] == undefined)
                    continue;
                if (this.limits[property] == 0) {
                    // make inactive
                    this.active = false;
                    this.limits[property] = 0;
                    name = this.client.finalName(this, this.name, this.limits[property]);
                    this.client.counterQuota(this);
                    suffix = this.client.getSuffix(this);
                    data += name + "," + this.csvMode + "," + this.qName + "," + this.qCodes[i] + "," + this.limits[property] + "," + suffix + "\n";
                    continue;
                }
                if (this.group.mode > 1) {
                    switch (property) {
                        case "phone":
                            name = this.client.finalName(this, this.name + " - Phone", this.limits[property]);
                            this.client.counterQuota(this);
                            suffix = this.client.getSuffix(this);
                            data += name + "," + this.csvMode + "," + this.qName + "," + this.qCodes[i] + "," + this.limits[property] + "," + suffix + "\n";
                            data += name + "," + this.csvMode + "," + "pMode" + "," + 1 + "," + this.limits[property] + "," + suffix + "\n";
                            break;
                        case "email":
                            name = this.client.finalName(this, this.name + " - Email", this.limits[property]);
                            this.client.counterQuota(this);
                            suffix = this.client.getSuffix(this);
                            data += name + "," + this.csvMode + "," + this.qName + "," + this.qCodes[i] + "," + this.limits[property] + "," + suffix + "\n";
                            data += name + "," + this.csvMode + "," + "pMode" + "," + 2 + "," + this.limits[property] + "," + suffix + "\n";
                            break;
                        case "text":
                            if (!document.getElementById("OnlineQActivity").checked) {
                                this.active = false;
                            }
                            name = this.client.finalName(this, this.name + " - Text", this.limits[property]);
                            this.client.counterQuota(this);
                            suffix = this.client.getSuffix(this);
                            data += name + "," + this.csvMode + "," + this.qName + "," + this.qCodes[i] + "," + this.limits[property] + "," + suffix + "\n";
                            data += name + "," + this.csvMode + "," + "pMode" + "," + 3 + "," + this.limits[property] + "," + suffix + "\n";
                            break;
                        default:
                            if (!document.getElementById("OnlineQActivity").checked) {
                                this.active = false;
                            }
                            name = this.client.finalName(this, this.name, this.limits[property]);
                            this.client.counterQuota(this);
                            suffix = this.client.getSuffix(this);
                            data += name + "," + this.csvMode + "," + this.qName + "," + this.qCodes[i] + "," + this.limits[property] + "," + suffix + "\n";
                            break;
                    };
                } else {
                    name = this.client.finalName(this, this.name, this.limits[property]);
                    this.client.counterQuota(this);
                    suffix = this.client.getSuffix(this);
                    data += name + "," + this.csvMode + "," + this.qName + "," + this.qCodes[i] + "," + this.limits[property] + "," + suffix + "\n";
                }
            }
        }
        return data;
    }

}
