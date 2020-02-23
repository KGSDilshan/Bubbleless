function GetRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min)) + min;
}

var PALETTE = [
        "rgb(255, 159, 243",
        "rgb(254, 202, 87",
        "rgb(255, 107, 107",
        "rgb(72, 219, 251",
        "rgb(29, 209, 161",
        "rgb(0, 210, 211",
        "rgb(84, 160, 255",
        "rgb(95, 39, 205",
        "rgb(200, 214, 229",
        "rgb(87, 101, 116",
        "rgb(155, 89, 182)",
];


class DataVisual {
    constructor(datamap, dataName, parentName) {
        this.name = (dataName == parentName || parentName === undefined) ? dataName : dataName + " from " + parentName;
        this.percentages = [];
        this.data = [];
        this.labels = [];
        this.colors = [];
        this.borderColors = [];
        this.total = 0;

        for (const [key, value] of datamap.entries()) {
            this.data.push(value);
            this.labels.push(key);
        }
        this.total = this.data.reduce((a, b) => a + b, 0);

        if (this.name == "EMAIL_Flagged") {
            this.data = [datamap.get("rf@rf.com"), this.total - datamap.get("rf@rf.com")];
            this.labels = ["rf@rf.com", "Valid emails"];
        }

        let colors = PALETTE.slice();
        while (colors.length < this.data.length) {
            let c = this.RandColor();
            colors.push(c[0] + ", " +  c[1] + ", " + c[2]);
        }
        colors.sort(function() {return Math.random() - 0.5});
        for (let i = 0; i < colors.length; i++) {
            this.colors.push(colors[i] + ", 0.5)");
            this.borderColors.push(colors[i] + ", 1)");
        }

        let sum = 0;
        for (let i = 0; i < this.data.length; i++) {
            let t = (this.data[i] / this.total) * 100;
            let r = parseInt(t);
            this.percentages.push({
                rounded : r,
                remainder : t - r,
                label: this.labels[i],
                data: this.data[i],
            });
            sum += r;
        }

        while (100 - sum > 0) {
            // get highest remainder
            this.percentages.sort(
                function(a, b) {
                    return a.remainder < b.remainder;
                }
            );
            // add 1 to it's component
            this.percentages[0].rounded = this.percentages[0].rounded + 1;
            this.percentages[0].remainder = this.percentages[0].remainder - 1;
            sum += 1;
        }


        // sort data by labels
        this.percentages.sort(
            function(a, b) {
                return a.label > b.label;
            }
        );
        // repopulate arrays
        for (let i = 0; i < this.percentages.length; i++) {
            this.labels[i] = this.percentages[i].label;
            this.data[i] = this.percentages[i].data;
        }

        let data_table = '<table class="table table-bordered">';
        data_table += '<thead>';
        data_table += '<tr>';
        data_table += '<th scope="col" colspan="3">' + this.name + '</th>';
        data_table += '</tr>';
        data_table += '<tr>';
        data_table += '<th scope="col" colspan="3"><canvas id="' + this.name + '" width=100% height="30%"></canvas><br></th>';
        data_table += '</tr>';
        data_table += '<tr>';
        data_table += '<th scope="col">ID</th>';
        data_table += '<th scope="col">Counts</th>';
        data_table += '<th scope="col">Sample Breakdown</th>';
        data_table += '</tr>';
        data_table += '</thead>';
        data_table += '<tbody>';
        for (let i = 0; i < this.percentages.length; i++) {
            data_table += '<tr>';
            data_table += '<td>' + this.percentages[i].label + '</td>';
            data_table += '<td>' + this.percentages[i].data + '</td>';
            data_table += '<td>' + this.percentages[i].rounded + '%</td>';
            data_table += '</tr>';

        }
        data_table += '<thead>';
        data_table += '<tr>';
        data_table += '<th scope="col" colspan="1">Count total:</th>';
        data_table += '<th scope="col" colspan="1">' + this.total + '</th>';
        data_table += '<th scope="col" colspan="1">' + 100 + '%</th>';
        data_table += '</tr>';
        data_table += '</thead>';
        data_table += '</tbody>';
        data_table += '</table><br><br>';
		$("div#dataChartArea").append(data_table);
    }

    RandColor() {
        let r = GetRandomInt(50, 255);
        let g = GetRandomInt(50, 255);
        let b = GetRandomInt(50, 255);
        return [r, g, b];
    }

    RenderGraph() {
        if (this.data.length > 100) {
            // too much data, don't render graph
            return;
        }
        const ctx = document.getElementById(this.name).getContext('2d');
        let chart = new Chart(ctx, {
            //type: 'horizontalBar',
            //type: 'doughnut',
            type: 'pie',
            data: {
                labels: this.labels,
                datasets: [{
                    label: this.name,
                    data: this.data,
                    backgroundColor: this.colors,
                    borderColor: this.borderColors,
                    borderWidth: 1
                }]

            },
            options: {
                title: {
                    display: true,
                    text: this.name,
                }
            },
            // options: {
            //     scales: {
            //         yAxes: [{
            //             ticks: {
            //                 beginAtZero: true
            //             }
            //         }]
            //     }
            // }
        });
    }
}
