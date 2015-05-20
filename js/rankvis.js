
var barHeight = 15;

var DURATION = 500;
var dateFormatter = d3.time.format("%Y-%m-%d");
var color_energy = {"chilled water": "blue", "steam": "red", "electric": "green"};

var dateEnd = "2014-01-01";
var dateStart = "2013-01-01";


RankVis = function(_parentElement, _data, _option, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.option = _option;
    this.eventHandler = _eventHandler;
    this.displayData = [];

    // defines constants
    this.margin = {top: 0, right: 50, bottom: 0, left: 50};
    this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right;
    this.height = 151 * barHeight - this.margin.top - this.margin.bottom;

    this.initVis();
};


/**
 * Method that sets up the SVG and the variables
 */
RankVis.prototype.initVis = function(){

    var that = this;
    // constructs SVG layout
    this.canvas = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .attr("class","canvas");

    this.svg = this.canvas
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axis and scales
    this.x = d3.scale.linear()
        .range([0, that.width]);

    this.y = d3.scale.ordinal();


    // Add axes visual elements
    this.svg.append("g")
        .attr("class", "y axis");

    // filter, aggregate, modify data
    this.wrangleData(this.option);

    // call the update method
    this.updateVis();

};

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
RankVis.prototype.updateVis = function(){

    var that = this;

    d3.selectAll(".canvas")
        .attr("height", that.displayData.length*barHeight + that.margin.top + that.margin.bottom);
	
    // updates scales
    this.x.domain([0, d3.max(this.displayData, function(d) { return d.energyUse; })]);
    this.y.rangeRoundBands([0, barHeight * that.displayData.length], 0.2)
        .domain(this.displayData.map(function(d) { return d.buildingName; }));


    // updates graph

    // Data join
    var bar = this.svg.selectAll(".bar")
        .data(this.displayData, function(d){return d.buildingName;});

    // Append new bar groups, if required
    var bar_enter = bar.enter().append("g")
        .attr("class", "bar")
        .on("click", function (d){
            clickedBuilding(d.buildingName)
        });

    // Append a rect and a text only for the Enter set (new g)
    bar_enter.append("rect");

    bar_enter.append("g")
        .attr("class", "rank")
        .append("text");

    bar_enter.append("g")
        .attr("class", "label")
        .append("text")

    bar.select(".rank").select("text")
        .text(function(d){return d.rank})
        .attr("x",-5)
        .attr("y",that.y.rangeBand() / 2)
        .attr("dy","0.85em")
        .style("font-size", "10px")
        .style("text-anchor","end");

    bar.select(".label").select("text")
        .text(function(d){return d.buildingName})
        .attr("x",5)
        .attr("y",that.y.rangeBand() / 2)
        .attr("dy","0.85em")
		.on('mouseover', function(){d3.select(this).style('cursor', 'pointer');})
        .style("text-anchor-y","start");

    bar.select("rect")
        .attr("x", 0)
        .attr("y", that.y.rangeBand() / 2)
        .attr("height", that.y.rangeBand())
		.on('mouseover', function(){d3.select(this).style('cursor', 'pointer');})
        .style("fill", function(d) {
            if(d.buildingName == that.option.buildingName) {
                return color_energy[that.option.energyType];}
            else {
                return "gray";
            }
        })
        .style("opacity",0.7)
        .transition()
        .attr("width", function(d, i) {
            return that.x(d.energyUse);
        })

    bar.transition()
        .duration(DURATION)
        .attr("transform", function(d,i) {
            return "translate(0," + (that.y(d.buildingName)-that.y(that.displayData[0].buildingName)) +")";});

    bar.exit()
        .remove();

    function clickedBuilding(buildingName) {
        $(that.eventHandler).trigger("selectionChanged", buildingName)

    }
};


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
RankVis.prototype.onSelectionChange = function (){

    this.wrangleData(null);
    this.updateVis();

    if(this.displayData.length == 0) {
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "newestOnTop": false,
            "progressBar": false,
            "positionClass": "toast-top-right",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "3000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        }

        toastr.info('Selected building function does not have selected energy type.', 'Try a different building function/energy type.')
    }
};

/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
RankVis.prototype.wrangleData= function(_filter){

    // displayData should hold the data which is visualized
    this.displayData = this.filterAndAggregate(_filter);

};


/**
 * The aggregate function that creates the counts for each age for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
RankVis.prototype.filterAndAggregate = function(_filter){

    var that = this;


    // Set filter to a function that accepts all items
    // ONLY if the parameter _filter is NOT null use this parameter
    var filter = function(){return true;};

    if (_filter != null){
        filter = _filter;
    }
    //Dear JS hipster, a more hip variant of this construct would be:
    // var filter = _filter || function(){return true;}

    var res_org = [];

    for (var key in this.data) {

        var building = this.data[key];
        // important check that this is objects own property
        // not from prototype prop inherited
        if(building.hasOwnProperty(this.option.energyType)){
            var temp = 0;
            for (var i = 0; i < building[this.option.energyType].length; i++) {
                var month = dateFormatter.parse(building[this.option.energyType][i].month);

                if ( month < dateFormatter.parse(dateEnd) && month >= dateFormatter.parse(dateStart)) {
                    temp = temp + building[this.option.energyType][i]['consumption'];
                }
            }
            temp = temp / building['area'];
            var all = false;
            if (building.hasOwnProperty('electric') && building.hasOwnProperty('chilled water') && building.hasOwnProperty('steam'))
                all = true;
            res_org.push({buildingName: key, energyUse: temp, rank: 0, function: building['function'], 'all': all});
        }

    }

    var res_filtered;

    if (this.option.buildingFunction != "all") {
        res_filtered = res_org.filter(function (d) {
            return d.function == that.option.buildingFunction;
        });
    } else {
        res_filtered = res_org;
    }

    if (this.option.buildingEnergyType == 'all') res_filtered = res_filtered.filter(function (d) {return d.all == true;})

    var res_ranked = res_filtered.sort(function(a,b) {return d3.descending(a.energyUse, b.energyUse);});

    res_ranked.map(function(d,i) {d.rank = i + 1; });

    res_ranked.sort(function(a,b) {
        if(that.option.sortType == "buildingName")
            return d3.ascending(a[that.option.sortType], b[that.option.sortType]);
        else
            return d3.descending(a[that.option.sortType], b[that.option.sortType]);

    });

    return res_ranked;
};

RankVis.prototype.getYPosition = function (buildingName){
    var that = this;

    if (that.displayData[0])
        return (that.y(buildingName)-that.y(that.displayData[0].buildingName));
    else
        return 0;
};




