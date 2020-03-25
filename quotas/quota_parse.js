/*
    quotaConfig = {
        limit: null,
        client: null,
        nSize: null,
        isActive: true,
        isRaw : false,
        isCounter: false,
        isCounted: false,
        Mode: "phone",
    }

*/

//
// class Quota {
//     constructor(quotaGroup, quotaName, questionName, quotaPercentage, quotaCodes, quotaConfig) {
//         this.config = quotaConfig;
//         this.name = quotaGroup.name + " - " + quotaName;
//         this.limit = quotaPercentage;
//         this.qCodes = quotaCodes; // arr of codes ????
//         this.qName = questionName; // arr of questions ????
//     }
// }

function CreateQuotaGroup(name, quotaObj) {
    // TODO
    console.log(name, quotaObj);
}


function ReadQuotaArr() {
    let content = ReadQuotaTables();
    let i = 0;
    let qGName = "";
    let qGQuotas = [];
    while (i < content.length) {
        let line = content[i].trim().split("\t");
        if (line == undefined) {
            continue;
        } else if (line.length == 1 && line[0] != undefined) {
            // line should contain a new quota group. Attempt to serialize previous data
            CreateQuotaGroup(qGName, qGQuotas);
            qGName = line[0];
            qGQuotas = [];
        } else if (line.length > 1) {
            // must be a sub quota
            let subQuota = {
                name: line[0].toString(),
                percentage: line[1].replace("%", ""),
                question: line[2].toString(),
                codes: line[3].split(","),
            };
            qGQuotas.push(subQuota);
        } else {
            console.log(line, "doesn't fall into categories");
        }
        i++;
    }
}
