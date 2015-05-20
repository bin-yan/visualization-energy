var color_energy = {"chilled water": "blue", "steam": "red", "electric": "green"};

EnergyVis = function(_parentElement, _data, _option, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.option = _option;

    // defines constants
    this.margin = {top: 20, right: 50, bottom: 20, left: 80},
	//this.title = -15,
    this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
    this.height = 350 - this.margin.top - this.margin.bottom;

    this.initVis();
}


/**
 * Method that sets up the SVG and the variables
 */
EnergyVis.prototype.initVis = function(){

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
	
	this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom")
	  .tickFormat(function(d, i) { return that.displayData.time[i]; });

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");



    // Add axes visual elements
    this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")");
	  
	this.svg.append("g")
      .attr("class", "y axis")
	  .append("text");




    // filter, aggregate, modify date
    this.wrangleData(this.option.buildingName, this.option.energyType);

    // call the update method
    this.updateVis(this.option.energyType);
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
EnergyVis.prototype.updateVis = function(_option){

    var that = this;

    // updates scales
    this.x.domain(this.displayData.time.map(function(d, i) { return i; }));
	this.y.domain([0, 1.2 * d3.max(this.displayData.data, function(d) { return d; })]).range([this.height, 0]);

    // updates graph

    // Data join
    var bar = this.svg.selectAll(".bar")
      .data(this.displayData.data);

    //create a div holder for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip_svg_weather")
        .style("opacity", 0);

    // Append new bar groups, if required
    var bar_enter = bar.enter().append("g");

    // Append a rect and a text only for the Enter set (new g)
    bar_enter.append("rect")
        .attr("class","verticalEnergyBar");

 
    // Add attributes (position) to all bars
    bar
      .attr("class", "bar");
      
    // Remove the extra bars
    bar.exit()
      .remove();

    // Update all inner rects and texts (both update and enter sets)

    bar.select("rect")
	  .attr("width", that.x.rangeBand())
      .style("fill", function() {
		return color_energy[that.option.energyType];
      })
      .transition()
	  .attr("x", function(d, i) { return that.x(i)})
      .attr("y", function(d) {return that.y(d)})
      .attr("height", function(d, i) {
          return that.height - that.y(d);
	  })


    // updates axis

    this.svg.select(".y.axis")
        .call(this.yAxis)
        .select("text")
        .attr("y", -15)
        .attr("x", 0)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .style("font-size","12px")
        .text(function () { if (_option == "electric") { return "Wh/sf"; }
            if (_option == "chilled water") { return " kg-Days/sf"; }
            if (_option == "steam") { return "kBtu/sf"; } });

    this.svg.select(".x.axis")
        .call(this.xAxis);



}


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
EnergyVis.prototype.onSelectionChange = function (_option){


    // filter, aggregate, modify date
    this.wrangleData(this.option.buildingName, this.option.energyType);

    // call the update method
    this.updateVis(this.option.energyType);
}

/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
EnergyVis.prototype.wrangleData= function(_buildingName, _energyType){

    // displayData should hold the data whiche is visualized
    this.displayData = this.filterAndAggregate(_buildingName, _energyType);

}


/**
 * The aggregate function that creates the counts for each age for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
EnergyVis.prototype.filterAndAggregate = function(_buildingName, _energyType){


    // Set filter to a function that accepts all items
    // ONLY if the parameter _filter is NOT null use this parameter	
    var filter = function(){return true;}
	var dateFormatter = d3.time.format("%Y-%m-%d");
	var monthNameFormat = d3.time.format("%b");

    if (_buildingName != "null"){
		filter = _buildingName;
	}

	
	var filteredData;

	if (_buildingName != "null"){
		if (_energyType == "electric"){
			filteredData = this.data[filter].electric;
		}
		else if (_energyType == "chilled water"){
			filteredData = this.data[filter]["chilled water"]; // default
		}
		else if (_energyType == "steam"){
			filteredData = this.data[filter].steam; // default
		}
	}
    //Dear JS hipster, a more hip variant of this construct would be:
    // var filter = _filter || function(){return true;}
	
	var area = 0;
	if (_buildingName != "null"){
    	area = this.data[this.option.buildingName]['area'];
	}
	
	var res = {};
	res.time = [];
	res.data = [];

	if (_buildingName != "null"){
		for (i = 0; i < filteredData.length; i++) {
			if (dateFormatter.parse(filteredData[i].month) < dateFormatter.parse("2014-01-01") && dateFormatter.parse(filteredData[i].month) >= dateFormatter.parse("2013-01-01")) {
				res.time.push(monthNameFormat(dateFormatter.parse(filteredData[i].month)));
				res.data.push(filteredData[i].consumption / area * 1000);
			}
		}
	}
	else {
		res.time = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		res.data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	}

	return res;
}




