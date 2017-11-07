/**
 * Created by gaetan.richard on 31/10/2017.
 */
//on change update users.
function refresh_treemap() {
    var selected_user = $('#user').val();
    var dataset = $('#dataset').val();
    $("#treemap").html("");

    // Initialize SVG
    var svg = d3.select("#treemap"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Color scale for categories
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // Prepare aggregation
    var nest = d3.nest()
        .key(function (d) {
            return d.priority;
        }) // First we aggregate by prority
        .key(function (d) {
            return d.status;
        }) // Then by status
        .rollup(function (leaves) {
            return {
                "total_cpt": leaves.length, // Compute the number of tasks in each groupe
                // Compute the total time associated with the tasks in this group
                "total_time": d3.sum(leaves, function (d) {
                    return parseFloat(d.time);
                })
            }
        });

    // Prepare treemap
    var treemap = d3.treemap()
        .size([width, height])
        .padding(1)
        .round(true);

    // Load data
    d3.csv(dataset, function (data_full) {
        // Convert our data structure into a tree structure

        // data complet
        data = [];
        data_full.forEach(function (d) {
            console.log(d.who);
            if (d.who == selected_user || selected_user == 'All') {
                data.push(d);
            }
        });

        // data is filterred
        var root = d3.hierarchy({
            values: nest.entries(data)
        }, function (d) {
            return d.values;
        })
        // This create a unique identifier of each leaf
            .eachBefore(function (d) {
                d.data.id = (d.parent ? d.parent.data.id + "." : "") + (d.data.key ? d.data.key : "");
            })
            // This is the value that will be used to draw the rectangles
            .sum(function (d) {
                if (d.value) {
                    return d.value.total_cpt;
                }
            })
            // This is to display first the bigger rectangles
            .sort(function (a, b) {
                return b.value.total_cpt - a.value.total_cpt;
            });
        //console.log(root)

        // Do generate the treemap
        treemap(root);

        // Prepare each rectangle
        var cell = g.selectAll("g")
        // We do not draw the priority rectangles, only the leaves of the tree
            .data(root.leaves())
            .enter().append("g")
            // Use x0 and y0 generated by the treemap function
            .attr("transform", function (d) {
                return "translate(" + d.x0 + "," + d.y0 + ")";
            });

        // Draw the rectangle
        cell.append("rect")
            .attr("id", function (d) {
                return d.data.id;
            })
            .attr("width", function (d) {
                return d.x1 - d.x0;
            })
            .attr("height", function (d) {
                return d.y1 - d.y0;
            })
            // Use the parent attribute to set the color
            .attr("fill", function (d) {
                return color(d.parent.data.key);
            });

        // Draw the text (use a clipping path to deal with long strings)
        cell.append("clipPath")
            .attr("id", function (d) {
                return "clip-" + d.data.id;
            })
            .append("use")
            .attr("xlink:href", function (d) {
                return "#" + d.data.id;
            });
        cell.append("text")
            .attr("clip-path", function (d) {
                return "url(#clip-" + d.data.id + ")";
            })
            .text(function (d) {
                return d.data.key;
            })
            .attr("x", 4)
            .attr("y", 10);

        // Append a title (shown on mouse hover)
        cell.append("title")
            .text(function (d) {
                return "Total task : " + d.data.value.total_cpt;
            });
        var heightL = 100;
        var svgLeg = d3.select("#legend").append("svg")
            .attr("width", width)
            .attr("height", heightL)

        // Draw the legend
        var legendRectSize = 18;
        var legendSpacing = 4;
        var legend = svg.selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function (d, i) {
                var offset = 20 * color.domain().length / 2;
                var horz = 30 + i * 100 + 10;
                var vert = height + legendRectSize + 10;
                //vert = 0;
                //horz = 0;
                return 'translate(' + horz + ',' + vert + ')';
            });

        // These are the rectangles
        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', color)
            .style('stroke', color);

        // These are the texts
        legend.append('text')
            .attr('x', legendRectSize + 5)
            .attr('y', 10)
            .text(function (d) {
                return d
            })
    });
}


function refresh_barchart() {

    var selected_user = $('#user').val();
    var dataset = $('#dataset').val();
    $("#barchart").html("");

// Chart initialization
    var svg = d3.select("#barchart"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// X axis
    var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1);

// y axis
    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

//load data
    d3.csv(dataset, function (data_full) {
        console.log(data);
// data complet
        data = [];
        data_full.forEach(function (d) {
            console.log(d.who);
            if (d.who == selected_user || selected_user == 'All') {
                data.push(d);
            }
        });
        // Group by status
        var nested_data = d3.nest()
            .key(function (d) {
                return d.status;
            })
            .entries(data);

        //console.log(nested_data);

        // Color scale
        var z = d3.scaleOrdinal(d3.schemeCategory10);

        // Set domains of axes scales
        x.domain(nested_data.map(function (d) {
            return d.key;
        }));
        y.domain([0, d3.max(nested_data, function (d) {
            return d.values.length;
        })]);
        z.domain(nested_data.map(function (d) {
            return d.key;
        }))

        // Draw rect
        g.selectAll("rect")
            .data(nested_data)
            .enter().append("rect")
            .attr("x", function (d) {
                return x(d.key);
            })
            .attr("y", function (d) {
                return y(d.values.length);
            })
            .attr("height", function (d) {
                return height - y(d.values.length);
            })
            .attr("width", x.bandwidth())
            //.attr("fill", "red")
            .attr("fill", function (d, i) {
                return z(d.key);
            })

        // Draw x axis
        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Draw y axis
        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).ticks(null, "s"))


    });
}

function refresh_barchart() {

    var selected_user = $('#user').val();
    var dataset = $('#dataset').val();
    $("#barchart").html("");

// Chart initialization
    var svg = d3.select("#barchart"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// X axis
    var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1);

// y axis
    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

//load data
    d3.csv(dataset, function (data_full) {
        console.log(data);
// data complet
        data = [];
        data_full.forEach(function (d) {
            console.log(d.who);
            if (d.who == selected_user || selected_user == 'All') {
                data.push(d);
            }
        });
        // Group by status
        var nested_data = d3.nest()
            .key(function (d) {
                return d.status;
            })
            .entries(data);

        //console.log(nested_data);

        // Color scale
        var z = d3.scaleOrdinal(d3.schemeCategory10);

        // Set domains of axes scales
        x.domain(nested_data.map(function (d) {
            return d.key;
        }));
        y.domain([0, d3.max(nested_data, function (d) {
            return d.values.length;
        })]);
        z.domain(nested_data.map(function (d) {
            return d.key;
        }))

        // Draw rect
        g.selectAll("rect")
            .data(nested_data)
            .enter().append("rect")
            .attr("x", function (d) {
                return x(d.key);
            })
            .attr("y", function (d) {
                return y(d.values.length);
            })
            .attr("height", function (d) {
                return height - y(d.values.length);
            })
            .attr("width", x.bandwidth())
            //.attr("fill", "red")
            .attr("fill", function (d, i) {
                return z(d.key);
            })

        // Draw x axis
        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Draw y axis
        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).ticks(null, "s"))


    });
}

function refresh_barchart2() {
    var selected_user = $('#user').val();
    var dataset = $('#dataset').val();
    $("#barchart2").html("");

// Chart initialization
    console.log(d3.select());
    var svg = d3.select('#barchart2'),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// X axis
    var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1);

// y axis
    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    //load data
    d3.csv(dataset, function (data_full) {
        console.log(data);

        // data complet
        data = [];
        data_full.forEach(function (d) {
            console.log(d.who);
            if (d.who == selected_user || selected_user == 'All') {
                data.push(d);
            }
        });

// Group by priority
        var nested_data = d3.nest()
            .key(function (d) {
                return d.priority;
            })
            .entries(data);

//console.log(nested_data);

// Color scale
        var z = d3.scaleOrdinal(d3.schemeCategory10);

// Set domains of axes scales
        x.domain(nested_data.map(function (d) {
            return d.key;
        }));
        y.domain([0, d3.max(nested_data, function (d) {
            return d.values.length;
        })]);
        z.domain(nested_data.map(function (d) {
            return d.key;
        }))

// Draw rect
        g.selectAll("rect")
            .data(nested_data)
            .enter().append("rect")
            .attr("x", function (d) {
                return x(d.key);
            })
            .attr("y", function (d) {
                return y(d.values.length);
            })
            .attr("height", function (d) {
                return height - y(d.values.length);
            })
            .attr("width", x.bandwidth())
            //.attr("fill", "red")
            .attr("fill", function (d, i) {
                return z(d.key);
            })

// Draw x axis
        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

// Draw y axis
        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).ticks(null, "s"))
    });
}

function refresh_surprise() {

    var dataset = $('#dataset').val();
    $("#surprise").html("");

    var svg = d3.select("#surprise"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y = d3.scaleLinear().rangeRound([height, 0]),
        z = d3.scaleOrdinal(d3.schemeCategory10);


    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv(dataset, function(d) {
        d.time = +d.time;
        return d;
    }, function(error, data) {
        if (error) throw error;

        console.log(data);

        //____________________________________
        data.sort(function(x,y){
            return d3.ascending (x.time , y.time)
        });

        var total_time = 0;
        data.forEach(function(d){
            d.cum_time = +d.time + total_time;
            total_time += +d.time;
        });
        //____________________________________

        x.domain(data.map(function(d) { return d.id; }));
        y.domain([0, d3.max(data, function(d) { return d.cum_time; })]);

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y).ticks(20))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")

        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.id); })
            .attr("y", function(d) { return y(d.cum_time); })
            .style("fill", function(d) { return z(d.priority); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d.cum_time); });



    });


}

function refresh() {
    refresh_surprise();
    refresh_barchart();
    refresh_barchart2();
    refresh_treemap();
}

$(function(){
    refresh();
});
