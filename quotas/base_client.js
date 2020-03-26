function CreateClient(id) {
    switch (id) {
        default:
            return new BaseClient();
    };
}



class BaseClient {
    constructor() {
        this.name = "BasicClient";
    }

    getSuffix(quota) {
        let suffix = '"{""action"":""1"",""autoload_url"":""1"",""active"":""' + (quota.active ? 1 : 0) +
                    '"",""qls"":[{""quotals_language"":""en"",""quotals_name"":""x"",""quotals_url"":"""",' +
                    '""quotals_urldescrip"":"""",""quotals_message"":""Sorry your responses have exceeded' +
                    ' a quota on this survey.""}]}"';
        return suffix;
    }

    calcLimit(quota) {
        // determine if limit is a raw limit
        if (!quota.strLimit.includes("%")) {
            let lim = parseFloat(quota.strLimit);
            // raw values
            quota.isRaw = true;
            switch (quota.group.mode) {
                case 1:
                    // phone only
                    quota.limits.phone = lim;
                    break;
                case 2:
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
                    break;
                case 3:
                    // tri mode is every mode
                    quota.limits.phone = lim;
                    quota.limits.email = lim;
                    quota.limits.text = lim;
                    break;
            }
        } else {
            let lim = parseFloat(quota.strLimit.split("%").join(""));
            console.log(lim, quota.name)
            // percentage values
            switch (quota.group.mode) {
                case 1:
                    // phone only
                    quota.limits.phone = round05Ciel((quota.group.nSizes[0] * lim)/100);
                    break;
                case 2:
                    // figure out which two modes they are
                    if (quota.group.nSizes.length > 0 && quota.group.nSizes[0] != 0 && quota.group.nSizes[0]) {
                        quota.limits.phone = round05Ciel((quota.group.nSizes[0] * lim)/100);
                    }
                    if (quota.group.nSizes.length > 1 && quota.group.nSizes[1] != 0 && quota.group.nSizes[1]) {
                        quota.limits.email = round05Ciel((quota.group.nSizes[1] * lim)/100);
                    }
                    if (quota.group.nSizes.length > 2 && quota.group.nSizes[2] != 0 && quota.group.nSizes[2]) {
                        quota.limits.text = round05Ciel((quota.group.nSizes[2] * lim)/100);
                    }
                    break;
                case 3:
                    // tri mode is every mode
                    quota.limits.phone = round05Ciel((quota.group.nSizes[0] * lim)/100);
                    quota.limits.email = round05Ciel((quota.group.nSizes[1] * lim)/100);
                    quota.limits.text = round05Ciel((quota.group.nSizes[2] * lim)/100);
                    break;
            }
        }
    }

}
