MapVis = function(_parentElement, _monthlyEnergy, _option, _eventHandler){
    this.parentElement = _parentElement;
    this.monthlyEnergy = _monthlyEnergy;
    this.option = _option;
    this.eventHandler = _eventHandler;

    this.margin = {top: 5, right: 50, bottom: 5, left: 50};
    this.mapRatio = 0.9451940173623313;
    this.height = 400;
    this.width = 400 * this.mapRatio;

    this.wrangleData();

    this.initVis();
}


/**
 * Method that sets up the SVG and the variables
 */
MapVis.prototype.initVis = function() {

    this.createScales();

    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    //need to change it to scalable.
    this.svg.append("svg:image")
        .attr('width', 467)
        .attr('height', 410)
        .attr("x",-40)
        .attr("y",-5)
        .attr("xlink:href", "figure/map3.jpg")
        .style("opacity", 0.6);
		
	this.svg.append("text")
        .attr("y", 400)
        .attr("x", -35)
        //.attr("dy", ".71em")
        .style("text-anchor", "start")
        .style("font-size","9px")
		.text("Note: Building circle sized by building area.");

    this.createNodes();

    this.updateVis('Gund Hall');

}

MapVis.prototype.wrangleData= function(){
    var that = this;
    monthlyEnergy = this.monthlyEnergy;

    that.displayData = [];

    for(var building in that.monthlyEnergy){
        var totalElectric = 0;
        var totalChilledWater = 0;
        var totalSteam = 0;

        if(monthlyEnergy[building].hasOwnProperty('electric')) {
            monthlyEnergy[building].electric.forEach(function (d) {
                totalElectric += d['consumption']
            })
            totalElectric = Math.round(totalElectric)
        }

        if(monthlyEnergy[building].hasOwnProperty('chilled water')){
            monthlyEnergy[building]['chilled water'].forEach(function (d){
                totalChilledWater += d['consumption']
            })
            totalChilledWater = Math.round(totalChilledWater)
        }

        if(monthlyEnergy[building].hasOwnProperty('steam')) {
            monthlyEnergy[building]['steam'].forEach(function (d) {
                totalSteam += d['consumption']
            })

            totalSteam = Math.round(totalSteam)
        }

        that.displayData.push({
            name:building,
            longitude:monthlyEnergy[building]['longitude'],
            latitude:monthlyEnergy[building]['latitude'],
            totalElectric:totalElectric,
            totalChilledWater:totalChilledWater,
            totalSteam:totalSteam,
            area:monthlyEnergy[building]['area'],
            buildingFunction:monthlyEnergy[building]['function']
        })
    }
    this.buildingLocation = that.buildingLocation;
}

MapVis.prototype.updateVis = function(_buildingName) {
    var that = this;
    var selBuildingName = _buildingName;
    var nodes = d3.selectAll(".node")
    var circles = nodes.select("circle")
    var function_opt = d3.select("#function_opt").property('value')
    nodes.style("visibility", "visible")
	    .on('mouseover', function(){d3.select(this).style('cursor', 'pointer');})

    //show or hide buildings based on building data type
    switch(d3.select("#building_opt").property('value')){
        case 'chilled water':
            circles.style("fill", "#4682b4").style("stroke-width", "0px")
            nodes.filter(function (d){return d['totalChilledWater'] == 0}).style("visibility", "hidden")
            break

        case 'steam':
            circles.style("fill", "#F27066").style("stroke-width", "0px");
            nodes.filter(function (d){return d['totalSteam'] == 0}).style("visibility", "hidden")
            break

        case 'electric':
            circles.style("fill", "green").style("stroke-width", "0px");
            nodes.filter(function (d){return d['totalElectric'] == 0}).style("visibility", "hidden")
            break

        case 'all':
            circles.style("fill", "purple").style("stroke-width", "0px");
            nodes.filter(function (d){return d['totalElectric'] == 0}).style("visibility", "hidden")
            nodes.filter(function (d){return d['totalSteam'] == 0}).style("visibility", "hidden")
            nodes.filter(function (d){return d['totalChilledWater'] == 0}).style("visibility", "hidden")
            break

        default:
            circles.style("fill", "#CF6E00").style("stroke-width", "0px");
            nodes.filter(function (d){return d}).style("visibility", "visible")

    }
    nodes.filter(function (d){return d.name == selBuildingName})
        .select("circle")
        .style("fill", "#FFFF00")
        .style("stroke", "black")
        .style("stroke-width", "2px");

    //show or hide buildings based on building function selector
    if(function_opt == 'all'){
        return;
    }
    else {
        nodes.filter(function (d){return d.buildingFunction !== function_opt}).style("visibility", "hidden")
    }


}

MapVis.prototype.createScales = function() {
    var that = this;

    //Calculate the parameters needed to layout the buildings as nodes according to lat/lng
    this.longitudes = this.displayData.map(function (d) {return d.longitude});
    this.latitudes = this.displayData.map(function (d) {return d.latitude})

    //get the max and min values
    longitudeMax = d3.max(this.longitudes);
    longitudeMin = d3.min(this.longitudes);
    latitudeMax = d3.max(this.latitudes);
    latitudeMin = d3.min(this.latitudes);

    longitudeScale = d3.scale.linear()
        .domain([longitudeMin, longitudeMax])
        .range([0, that.width])

    latitudeScale = d3.scale.linear()
        .domain([latitudeMin, latitudeMax])
        .range([this.height, 0])

    //calculate the scale for the area of each building ie size of each node
    this.areas = this.displayData.map(function (d) {return d.area})
    areaMax = d3.max(this.areas)
    areaMin = d3.min(this.areas)

    areaScale = d3.scale.linear()
        .domain([areaMin, areaMax])
        .range([3,8])

    //calculate color scale for nodes based on energy consumption
    this.energies = this.displayData.map(function (d) {return d.totalElectric})
    energyMax = d3.max(this.energies)
    energyMin = d3.min(this.energies)
    colorScale = d3.scale.linear()
        .domain([energyMin, energyMax])
        .range(["red", "green"])

    this.thousandNumFormat = d3.format(",d")
}

MapVis.prototype.createNodes = function() {
    var that = this;

    //create a div holder for the tooltip that shows the building name
    var div = d3.select("body").append("div")
        .attr("class", "tooltip_svg")
        .style("opacity", 0);

    node = this.svg.selectAll(".node")
        .data(this.displayData)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("x", function(d){return longitudeScale(d['longitude']);})
        .attr("y", function(d){return latitudeScale(d['latitude']);})

    node.append("circle").attr("r", function (d) {return areaScale(d.area) })
        .attr("fill", "green")
        .attr("fill-opacity", 0.9)// Bin changed from 0.6 to 0.9
        .on("click", function (d){
            clickedBuilding(d.name)
        })
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div .html("Name: " + d.name
                + "</br>" + "Area: " + that.thousandNumFormat(d.area) + " sq ft"
                + "</br>" + "Total Electricity: " + that.thousandNumFormat(d.totalElectric) + " kWh"
                + "</br>" + "Total Chilled Water: " + that.thousandNumFormat(d.totalChilledWater) + " Ton-Days"
                + "</br>" + "Total Steam: " + that.thousandNumFormat(d.totalSteam) + " MMBtu"
                + "</br>" + "Function: " + d.buildingFunction
            )
                .style("left", (d3.event.pageX + 8) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });

    node
        //.transition()
        //.duration(500)
        .attr("transform", function(d) {
            return "translate("+this.attributes.x.value+","+this.attributes.y.value+")";
        });

    function clickedBuilding(buildingName) {

        $(that.eventHandler).trigger("selectionChanged", buildingName)

    }
}

MapVis.prototype.onSelectionChange= function (_buildingName){
    this.updateVis(_buildingName)
}