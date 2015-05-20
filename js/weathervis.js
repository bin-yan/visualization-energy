
WeatherVis = function(_parentElement, _data, _option, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
	this.option = _option;
    this.eventHandler = _eventHandler;
    this.displayData = [];

    // defines constants
    this.margin = {top: 35, right: 20, bottom: 20, left: 50},
	this.title = -15,
    this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
    this.height = 120 - this.margin.top - this.margin.bottom;

    this.initVis();
};


/**
 * Method that sets up the SVG and the variables
 */
WeatherVis.prototype.initVis = function(){

	var that = this;
    // constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axis and scales
    this.x = d3.scale.ordinal()
      .rangeRoundBands([0, this.width], .1);
	  
	this.y = d3.scale.linear()
      .range([0, this.height]);

    this.color = d3.scale.category20();

    this.thousandNumFormat = d3.format(",d")
	
	this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom")
	  .tickFormat(function(d, i) { return that.displayData.time[i]; });

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left")
	  .ticks(3);

    // Add axes visual elements
    this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")");
	
	this.svg.append("g")
      .attr("class", "y axis");
	  
    // filter, aggregate, modify data
    this.wrangleData(this.option);


    // call the update method
    this.updateVis(this.option);
};

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
WeatherVis.prototype.updateVis = function(_option){

    var that = this;

    // updates scales
    this.x.domain(this.displayData.time.map(function(d, i) { return i; }));

	if (_option == "Temperature") {
		var max = d3.max(this.displayData.data, function(d) { return d; });
		var min = d3.min(this.displayData.data, function(d) { return d; });
		this.y.domain([min - 0.5 * (max - min), max + 0.5 * (max - min)]).range([this.height, 0]);
	}
	else {
		this.y.domain([0, 1.5 * d3.max(this.displayData.data, function(d) { return d; })]).range([this.height, 0]);
	}

    // updates axis
    this.svg.select(".x.axis")
        .call(this.xAxis);

    this.svg.select(".y.axis")
        .call(this.yAxis)
		.append("text")
      	.attr("y", -15)
    	.attr("x", 0)
   	    .attr("dy", ".71em")
   	    .style("text-anchor", "end")
		.style("font-size","12px")
		.text(function () {
			if (_option == "Temperature") {
				return String.fromCharCode(176) + "C";
			}
			if (_option == "Solar") {
				return "kW/m";
			}
			if (_option == "Wind") {
				return "m/s";
			}
		})
		.append("tspan")
		.style("font-size", "8px")
	    .attr("dy", "-.5em")
    	.text(function () { if (_option == "Temperature") { return ""; }
	  						if (_option == "Solar") { return "2"; }
							if (_option == "Wind") { return ""; } });
							
	// chart title
	this.svg.append("text")
	  .attr("x", this.width / 2)
	  .attr("y", this.title)
	  .attr("text-anchor", "middle")
	  .style("font-size", "14px")
		.text(function () {
			if (_option == "Temperature") {
				return "Weather Data - Temperature";
			}
			if (_option == "Solar") {
				return "Weather Data - Solar Radiation";
			}
			if (_option == "Wind") {
				return "Weather Data - Wind Speed";
			}
		});
	// updates graph
	if (_option == "Temperature") {
		// Data join
		var line = d3.svg.line()
		  .interpolate("linear")
		  .x(function(d, i) { return that.x(i) + that.x.rangeBand() / 2;})
		  .y(function(d) {return that.y(d);});
		  
		this.svg.append("path")
			.datum(this.displayData.data)
			.attr("class","weatherLine")
			.attr("d", line);

        //create a div holder for the tooltip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip_svg_weather")
            .style("opacity", 0);

        var bar = this.svg.selectAll(".bar")
            .data(this.displayData.data);

        // Append new bar groups, if required
        var bar_enter = bar.enter().append("g");

        // Append a rect and a text only for the Enter set (new g)
        bar_enter.append("rect");


        // Add attributes (position) to all bars
        bar
            .attr("class", "bar");

        // Remove the extra bars
        bar.exit()
            .remove();

        // Update all inner rects and texts (both update and enter sets)

        bar.select("rect")
            .attr("class","weatherBar")
            .attr("x", function(d, i) { return that.x(i);})
            .attr("y", function(d) {return that.y(d)})
            .attr("width", that.x.rangeBand())
            .style("opacity", 0)
            .on("mouseover", function(d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div .html(d)
                    .style("left", (d3.event.pageX + 8) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition()
            .attr("height", function(d, i) {
                return that.height;
            })

	}
	 
	if (_option == "Solar") {
		// Data join

        //create a div holder for the tooltip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip_svg_weather")
            .style("opacity", 0);
	
		var bar = this.svg.selectAll(".bar")
		  .data(this.displayData.data);
	
		// Append new bar groups, if required
		var bar_enter = bar.enter().append("g");
	
		// Append a rect and a text only for the Enter set (new g)
		bar_enter.append("rect");

		// Add attributes (position) to all bars
		bar
		  .attr("class", "bar");
		  
		// Remove the extra bars
		bar.exit()
		  .remove();
	
		// Update all inner rects and texts (both update and enter sets)
		bar.select("rect")
			.attr("class","weatherBar")
		  .attr("x", function(d, i) { return that.x(i);})
		  .attr("y", function(d) {return that.y(d)})
		  .attr("width", that.x.rangeBand())
            .on("mouseover", function(d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div .html(that.thousandNumFormat(d))
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 40) + "px");
            })
            .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
		  .transition()
		  .attr("height", function(d, i) {
			  return that.height - that.y(d);
		  })

	} 
	
	if (_option == "Wind") {
        //create a div holder for the tooltip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip_svg_weather")
            .style("opacity", 0);

		// Data join
		var points = this.svg.selectAll(".point")
          .data(this.displayData.data)
       	  .enter()
			.append("circle")
			.attr("class","weatherDot")
          .attr("stroke", "black")
          .attr("cx", function(d, i) { return that.x(i) + that.x.rangeBand() / 2 })
			.attr("cy", function (d, i) {
				return that.y(d)
			})
			.attr("r", function(d, i) { return 2.5 })

        var bar = this.svg.selectAll(".bar")
            .data(this.displayData.data);

        // Append new bar groups, if required
        var bar_enter = bar.enter().append("g");

        // Append a rect and a text only for the Enter set (new g)
        bar_enter.append("rect");


        // Add attributes (position) to all bars
        bar
            .attr("class", "bar");

        // Remove the extra bars
        bar.exit()
            .remove();

        // Update all inner rects and texts (both update and enter sets)

        bar.select("rect")
            .attr("class","weatherBar")
            .attr("x", function(d, i) { return that.x(i);})
            .attr("y", function(d) {return that.y(d)})
            .attr("width", that.x.rangeBand())
            .style("opacity", 0)
            .on("mouseover", function(d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div .html(d)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 40) + "px");
            })
            .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition()
            .attr("height", function(d, i) {
                return that.height;
            })
	}
	


};


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
WeatherVis.prototype.onSelectionChange = function (selectionStart, selectionEnd){

    // TODO: call wrangle function
	this.wrangleData(function(d){return d.time>=selectionStart && d.time<=selectionEnd;});

    this.updateVis();
};

/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
WeatherVis.prototype.wrangleData= function(_option){

    // displayData should hold the data whiche is visualized
    this.displayData = this.filterAndAggregate(_option);

};


/**
 * The aggregate function that creates the counts for each age for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
WeatherVis.prototype.filterAndAggregate = function(_option){


    // Set filter to a function that accepts all items
    // ONLY if the parameter _filter is NOT null use this parameter
    var filter = function(){return true;};
	var dateFormatter = d3.time.format("%Y-%m-%d %H:%M");
	var monthNameFormat = d3.time.format("%b");
	
    if (_option == "Temperature"){
        filter = "temperature";
    }
	else if (_option == "Solar"){
		filter = "solar radiation";
	}
	else if (_option == "Wind"){
		filter = "wind speed";
	}
    //Dear JS hipster, a more hip variant of this construct would be:
    // var filter = _filter || function(){return true;}
	var filteredData = this.data["monthly"];
	
	var res = {};
	res.time = [];
	res.data = [];

	for (i = 0; i < filteredData.length; i++) {
		if (dateFormatter.parse(filteredData[i].time) < dateFormatter.parse("2014-01-01 00:00") && dateFormatter.parse(filteredData[i].time) >= dateFormatter.parse("2013-01-01 00:00")) {
			res.time.push(monthNameFormat(dateFormatter.parse(filteredData[i].time)));
			res.data.push(filteredData[i][filter]);
		}
	}

	return res;
};




