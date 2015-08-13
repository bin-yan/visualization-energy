/**
 * Created by byan on 4/23/15.
 */
/*
 *
 * ======================================================
 * We follow the vis template of init - wrangle - update
 * ======================================================
 *
 * */

/**
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _eventHandler -- the Eventhandling Object to emit data to (see Task 4)
 * @constructor
 */

var RADIUS = 6;
var DURATION = 500;
var dateFormatter = d3.time.format("%Y-%m-%d");
var dateTimeFormatter = d3.time.format("%Y-%m-%d %H:%M");
var xVariable;

var color_energy = {"chilled water": "blue", "steam": "red", "electric": "green"};

Explore1Vis = function(_parentElement, _textElement,_data, _weather, _option){
    var that = this;
    this.parentElement = _parentElement;
    this.textElement = _textElement;
    this.data = _data;
    this.weather = _weather;
    this.displayData = [];
    this.option = _option;

    // defines constants
    this.margin = {top: 40, right: 60, bottom: 40, left: 70};
    this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right;

    this.height = 340 - this.margin.top - this.margin.bottom;

    this.initVis();

};


/**
 * Method that sets up the SVG and the variables
 */
Explore1Vis.prototype.initVis = function(){

    var that = this;

    // constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axis and scales
    this.y = d3.scale.linear()
        .range([this.height, 0]);

    this.x = d3.scale.linear()
        .range([0, this.width]);


    this.xAxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom");

    this.yAxis = d3.svg.axis()
        .scale(this.y)
        .orient("left");

    // Add axes visual elements
    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .append("text");

    this.svg.append("g")
        .attr("class", "y axis")
        .append("text");

    this.svg.append("text")
        .attr("class", "R2")

    // filter, aggregate, modify data
    this.wrangleData(null);

    // call the update method
    this.updateVis();
};


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
Explore1Vis.prototype.wrangleData= function(_filterFunction){

    // displayData should hold the data which is visualized

    //this.displayData = this.filterAndAggregate(_filterFunction);
    xVariable = d3.select("#explore1Vis_x_opt").property('value');

    this.displayData = [];

    //// you might be able to pass some options,
    //// if you don't pass options -- set the default options
    //// the default is: var options = {filter: function(){return true;} }
    //var options = _options || {filter: function(){return true;}};

    var data_y = this.data[this.option.buildingName][this.option.energyType];
    var data_x = this.weather["monthly"];
    var area = this.data[this.option.buildingName]['area'];

    console.log(data_x)

    var k = 0;
    for (i = 0; i < data_y.length; i++) for (j = k; j < data_x.length; j++) {
        var y_time = dateFormatter.parse(data_y[i].month);
        var x_time = dateTimeFormatter.parse(data_x[j].time);
        if (y_time.getYear() == x_time.getYear() && y_time.getMonth() == x_time.getMonth()) {
            this.displayData.push({"x": data_x[j][xVariable],
                "y": data_y[i]["consumption"]/area * 1000,
                "month": data_y[i].month.split("-")[0] + "-" + data_y[i].month.split("-")[1]});
            k = j;
            continue;
        }
    }

    console.log(this.displayData)
};


/**
 * the drawing function - should use the D3 selection, enter, exit
 */
Explore1Vis.prototype.updateVis = function(){

    // Dear JS hipster,
    // you might be able to pass some options as parameter _option
    // But it's not needed to solve the task.
    // var options = _options || {};

    var that = this;

    // updates scales
    this.y.domain([d3.min(this.displayData, function(d) { return d.y; }),
        d3.max(this.displayData, function(d) { return d.y; })]);

    this.x.domain([d3.min(this.displayData, function(d) { return d.x; }),
        d3.max(this.displayData, function(d) { return d.x; })]);
    //this.color.domain(this.displayData.map(function(d) { return d.type }));

    // updates axis
    var unit = {"temperature": "(" + String.fromCharCode(176) + "C)", "dehumidification": "(kg/kg)",
        "cooling degrees": "(" + String.fromCharCode(176) + "C)", "heating degrees": "(" + String.fromCharCode(176) + "C)",
        "solar radiation": "(W/m2)", "wind speed": "(m/s)",
        "electric" : "(Wh/sf)", "chilled water": "(kg-Days/sf)", "steam" : "(kBtu/sf)"
    };

    this.svg.select(".y.axis")
        .call(this.yAxis)
        .select("text")
        .attr("y", -15)
        .attr("x", 0)
        .attr("dy", ".71em")
        .style("text-anchor", "middle")
        .style("font-size","12px")
        .text(this.option.energyType+ " " + unit[this.option.energyType]);

    this.svg.select(".x.axis")
        .call(this.xAxis)
        .select("text")
        .attr("y", 0)
        .attr("x", that.width)
        .attr("dy", "2.5em")
        .style("text-anchor", "end")
        .style("font-size","12px")
        .text(xVariable + " " + unit[xVariable]);

    // updates graph

    var div = d3.select("body").append("div")
        .attr("class", "tooltip_svg_exploreVis")
        .style("opacity", 0);

    var dots = this.svg.selectAll(".dot")
                   .data(this.displayData);

    dots.enter().append("g").append("circle");

    dots.attr("class", "dot")

    dots.transition()
        .duration(DURATION)
        .attr("transform", function(d,i) {
        return "translate(" + that.x(d.x) + "," + that.y(d.y) +")";})
        .select("circle")
        .attr("r", RADIUS )
        .style("fill", function() {
            return color_energy[that.option.energyType];
        })

    dots.on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.month)
                .style("left", (d3.event.pageX + 8) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });

    dots.exit()
        .remove();

    var line = linearRegression(this.displayData.map(function(d){return d.x}),
        this.displayData.map(function(d){return d.y}));

    var x1 = this.x.domain()[0];
    var y1 = x1 * line['slope'] + line['intercept'];
    var x2 = this.x.domain()[1];
    var y2 = x2 * line['slope'] + line['intercept'];
    var trendData = [{'x1':x1,'y1':y1,'x2':x2,'y2':y2}];

    var trendline = this.svg.selectAll(".trendline")
        .data(trendData);

    trendline.enter()
        .append("line")
        .attr("class", "trendline");

    trendline
        .transition()
        .duration(DURATION)
        .attr("x1", function(d) { return that.x(d.x1); })
        .attr("y1", function(d) { return that.y(d.y1); })
        .attr("x2", function(d) { return that.x(d.x2); })
        .attr("y2", function(d) { return that.y(d.y2); });


    // display r-square on the chart
    /*
    this.svg.selectAll(".R2")
        .text("R2: " + line['r2'])
        .attr("x", function() {return that.width/2 - 20;})
        .attr("y", 0);
    */

    var equation_div = d3.select("#explore1Equation");
    equation_div.html("<br> <label>R2</label>:  " + line['r2'] + "<br>"
        + "<label>Equation</label>:  y = " + Math.round(line['slope'] * 10000)/10000 + " * x + " + Math.round(line['intercept']*100)/100 +"<br>"
    );
};


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
Explore1Vis.prototype.onSelectionChange = function (){


    //this.wrangleData(function(d){return d.time>=selectionStart && d.time<=selectionEnd;});
    this.wrangleData(null);
    this.updateVis();
};


