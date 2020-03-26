// round up function
function round05Ciel(x) {
    let val = x.toString().split(".")
    if (val.length == 1)
        return val;
    else if (parseInt(val[1][0]) >= 5)
        return parseInt(x) + 1
    else
        return parseInt(x)
}


class Quota {
    constructor(quotaGroup, quotaName, quotaPercentage, questionName, quotaCodes) {
        this.group = quotaGroup;
        this.name = quotaGroup.group_name + " - " + quotaName;
        this.strLimit = quotaPercentage;
        this.valLimit = parseFloat(quotaPercentage.split("%").join(""));
        this.limits = {};
        this.qName = questionName;
        this.qCodes = quotaCodes; // arr of codes
        this.isRaw = false;
        this.active = this.valLimit != 0;
        this.action = 1; // term without warning
        this.csvMode = "Simple";
        this.calculateLimit();
    }

    calculateLimit() {
        // determine if limit is a raw limit
        if (!this.strLimit.includes("%")) {
            let lim = parseFloat(this.strLimit);
            // raw values
            this.isRaw = true;
            switch (this.group.mode) {
                case 1:
                    // phone only
                    this.limits.phone = lim;
                    break;
                case 2:
                    // figure out which two modes they are
                    if (this.group.nSizes.length > 0 && this.group.nSizes[0] != 0 && this.group.nSizes[0]) {
                        this.limits.phone = lim;
                    }
                    if (this.group.nSizes.length > 1 && this.group.nSizes[1] != 0 && this.group.nSizes[1]) {
                        this.limits.email = lim;
                    }
                    if (this.group.nSizes.length > 2 && this.group.nSizes[2] != 0 && this.group.nSizes[2]) {
                        this.limits.text = lim;
                    }
                    break;
                case 3:
                    // tri mode is every mode
                    this.limits.phone = lim;
                    this.limits.email = lim;
                    this.limits.text = lim;
                    break;
            }
        } else {
            let lim = parseFloat(this.strLimit.split("%").join(""));
            console.log(lim, this.name)
            // percentage values
            switch (this.group.mode) {
                case 1:
                    // phone only
                    this.limits.phone = round05Ciel((this.group.nSizes[0] * lim)/100);
                    break;
                case 2:
                    // figure out which two modes they are
                    if (this.group.nSizes.length > 0 && this.group.nSizes[0] != 0 && this.group.nSizes[0]) {
                        this.limits.phone = round05Ciel((this.group.nSizes[0] * lim)/100);
                    }
                    if (this.group.nSizes.length > 1 && this.group.nSizes[1] != 0 && this.group.nSizes[1]) {
                        this.limits.email = round05Ciel((this.group.nSizes[1] * lim)/100);
                    }
                    if (this.group.nSizes.length > 2 && this.group.nSizes[2] != 0 && this.group.nSizes[2]) {
                        this.limits.text = round05Ciel((this.group.nSizes[2] * lim)/100);
                    }
                    break;
                case 3:
                    // tri mode is every mode
                    this.limits.phone = round05Ciel((this.group.nSizes[0] * lim)/100);
                    this.limits.email = round05Ciel((this.group.nSizes[1] * lim)/100);
                    this.limits.text = round05Ciel((this.group.nSizes[2] * lim)/100);
                    break;
            }
        }
    }


    display() {
        let suffix = '"{""action"":""1"",""autoload_url"":""1"",""active"":""' + (this.active ? 1 : 0) +
                    '"",""qls"":[{""quotals_language"":""en"",""quotals_name"":""x"",""quotals_url"":"""",' +
                    '""quotals_urldescrip"":"""",""quotals_message"":""Sorry your responses have exceeded' +
                    ' a quota on this survey.""}]}"';
        // for each code, we need a new quota
        let data = "";
        for (let i = 0; i < this.qCodes.length; i++) {
            for (const property in this.limits) {
                if (this.limits[property] == 0)
                    continue;
                if (this.group.mode > 1) {
                    switch (property) {
                        case "phone":
                            data += this.name + " - Phone," + this.csvMode + "," + this.qName + "," + this.qCodes[i] + "," + this.limits[property] + "," + suffix + "\n";
                            data += this.name + " - Phone," + this.csvMode + "," + "pMode" + "," + 1 + "," + this.limits[property] + "," + suffix + "\n";
                            break;
                        case "email":
                            data += this.name + " - Email," + this.csvMode + "," + this.qName + "," + this.qCodes[i] + "," + this.limits[property] + "," + suffix + "\n";
                            data += this.name + " - Email," + this.csvMode + "," + "pMode" + "," + 2 + "," + this.limits[property] + "," + suffix + "\n";
                            break;
                        case "text":
                            data += this.name + " - Text," + this.csvMode + "," + this.qName + "," + this.qCodes[i] + "," + this.limits[property] + "," + suffix + "\n";
                            data += this.name + " - Text," + this.csvMode + "," + "pMode" + "," + 3 + "," + this.limits[property] + "," + suffix + "\n";
                            break;
                    };
                } else {
                    data += this.name + "," + this.csvMode + "," + this.qName + "," + this.qCodes[i] + "," + this.limits[property] + "," + suffix + "\n";
                }
            }
        }
        return data;
    }

}
