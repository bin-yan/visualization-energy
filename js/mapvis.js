var circlePadding = 2;

MapVis = function(_parentElement, _monthlyEnergy, _option, _eventHandler){
    this.parentElement = _parentElement;
    this.monthlyEnergy = _monthlyEnergy;
    this.option = _option;
    this.eventHandler = _eventHandler;

    this.margin = {top: 0, right: 0, bottom: 0, left: 0};
    this.height = 400 - this.margin.top - this.margin.bottom;
    this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right;

    this.wrangleData();

    this.initVis();
}


/**
 * Method that sets up the SVG and the variables
 */
MapVis.prototype.initVis = function() {

    var that = this;

    var harvardYard = new google.maps.LatLng(42.374332, -71.116789);

    var MY_MAPTYPE_ID = 'ltc_style';

    var featureOpts = [

        {
            featureType: "all",
            elementType: "all",
            stylers: [
                { saturation: -80 },
                { lightness: 30 }
            ]
        },

        /*
        {
            elementType: 'labels',
            stylers: [
                { visibility: 'off' }
            ]
        },*/


        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                { color: "#FDF5E6" },
                { lightness: 50 },
                { visibility: "simplified" }
            ]
        },
        {
            featureType: "landscape.man_made",
            elementType: "geometry.fill",
            stylers: [
                { color: "#e3e2dd" }
            ]
        },
        {
            featureType: "landscape.man_made",
            elementType: "geometry.stroke",
            stylers: [
                { color: "#e3e2dd" }
            ]
        },
        {
            featureType: "landscape.natural",
            elementType: "geometry.fill",
            stylers: [
                { color: "#e3e2dd" }
            ]
        }
    ];

    var mapOptions = {
        zoom: 15,
        center: harvardYard ,
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID]
        },
        mapTypeId: MY_MAPTYPE_ID,
        panControl: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false,
        scrollwheel: false,
        draggable: true,
        disableDefaultUI: true,
        disableDoubleClickZoom: true
    };

    var mapContainer = this.parentElement.node();
    this.map = new google.maps.Map(mapContainer, mapOptions);

    var styledMapOptions = {
        name: 'Harvard Map'
    };

    var ltcMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

    this.map.mapTypes.set(MY_MAPTYPE_ID, ltcMapType);

    this.overlay = new google.maps.OverlayView();

    this.overlay.onAdd = function() {
        that.svg = d3.select(this.getPanes().overlayMouseTarget).append("div")
            .style("position","absolute");

        that.createNodes();

        that.overlay.draw = function() {
            that.projection = this.getProjection();
            that.updateVis('Gund Hall');
        };
    };

    this.overlay.setMap(this.map);


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
    var nodes = d3.selectAll(".node");
    var circles = nodes.select("circle");
    var function_opt = d3.select("#function_opt").property('value')

    nodes
        .each(transform)
        .style("visibility", "visible")
        .style("width", function(d) {return (that.areaScale(d.area) + circlePadding) * 2 + "px";})
        .style("height", function(d) {return (that.areaScale(d.area) + circlePadding) * 2 + "px";})
        .on('mouseover', function(){d3.select(this).style('cursor', 'pointer');});


    nodes.select("circle")
        .transition()  // this is must-have
        .attr("r", function (d) {return that.areaScale(d.area) })
        .attr("cx", function (d) {return that.areaScale(d.area) + circlePadding})
        .attr("cy", function (d) {return that.areaScale(d.area) + circlePadding})
        .style("opacity", 0.7);

    //show or hide buildings based on building data type
    switch(d3.select("#building_opt").property('value')){
        case 'chilled water':
            circles.style("fill", chilledWaterColor).style("stroke-width", "0px")
            nodes.filter(function (d){return d['totalChilledWater'] == 0}).style("visibility", "hidden")
            break

        case 'steam':
            circles.style("fill", steamColor).style("stroke-width", "0px");
            nodes.filter(function (d){return d['totalSteam'] == 0}).style("visibility", "hidden")
            break

        case 'electric':
            circles.style("fill", electricColor).style("stroke-width", "0px");
            nodes.filter(function (d){return d['totalElectric'] == 0}).style("visibility", "hidden")
            break

        case 'all':
            circles.style("fill", allColor).style("stroke-width", "0px");
            nodes.filter(function (d){return d['totalElectric'] == 0}).style("visibility", "hidden")
            nodes.filter(function (d){return d['totalSteam'] == 0}).style("visibility", "hidden")
            nodes.filter(function (d){return d['totalChilledWater'] == 0}).style("visibility", "hidden")
            break

        default:
            circles.style("fill", "#CF6E00").style("stroke-width", "0px");
            nodes.filter(function (d){return d}).style("visibility", "visible")

    }

    var selectedNode;
    selectedNode = nodes.filter(function (d) {
        return d.name == selBuildingName
    });

    selectedNode
        .each(transformSelectedSvg)
        .style("width", function(d) {return (20 + circlePadding) * 2 + "px";})
        .style("height", function(d) {return (20 + circlePadding) * 2 + "px";})
        .style("opacity", 1);


    //var electricColor = "#ABDB25"

    selectedNode.select("circle")
        .style("fill", function(d) {
            var color;
            switch(d3.select("#building_opt").property('value')){

                case 'chilled water':
                    color = chilledWaterColor;
                    break;

                case 'steam':
                    color = steamColor;
                    break;

                case 'electric':
                    color = electricColor;
                    break;

                case 'all':
                    color = allColor;
                    break;

                default:
                    color = allColor;

            }
            return color;
        })
        //.style("stroke", "#666666")
        //.style("stroke-width", "1px")
        .attr("cx", function (d) {return 20 + circlePadding})
        .attr("cy", function (d) {return 20 + circlePadding})
        .each(pulse);



    function pulse(d) {

        var circle = d3.select(this);
        (function repeat() {
            circle = circle.transition()
                .duration(1000)
                .attr("r", 15)
                .transition()
                .duration(1000)
                .attr("r", that.areaScale(d.area))
                .ease('sine')
                .each("end", function() { if (this.__transition__.count < 2) repeat(); }); //important
        })();
    }

    //show or hide buildings based on building function selector
    if(function_opt == 'all'){
        return;
    }
    else {
        nodes.filter(function (d){return d.buildingFunction !== function_opt}).style("visibility", "hidden")
    }

    function transform(d) {

        var p = new google.maps.LatLng(d.latitude, d.longitude);
        p = that.projection.fromLatLngToDivPixel(p);

        return d3.select(this)
            .style("left", p.x - that.areaScale(d.area) - circlePadding + "px")
            .style("top", p.y - that.areaScale(d.area) - circlePadding + "px");

    }

    function transformSelectedSvg(d) {

        var p = new google.maps.LatLng(d.latitude, d.longitude);
        p = that.projection.fromLatLngToDivPixel(p);

        return d3.select(this)
            .style("left", p.x - 20 - circlePadding + "px")
            .style("top", p.y - 20 - circlePadding + "px");

    }


}


MapVis.prototype.createNodes = function() {

    var that = this;

    /*
    this.svg.append("text")
        .attr("y", 380)
        .attr("x", that.width)
        .style("text-anchor", "end")
        .style("font-size","11px")
        .style("font-weight","bold")
        .text("Note: Building circle sized by building area.");
    */

    this.areas = this.displayData.map(function (d) {return d.area})
    var areaMax = d3.max(this.areas)
    var areaMin = d3.min(this.areas)

    this.areaScale = d3.scale.linear()
        .domain([areaMin, areaMax])
        .range([3,8])

    //create a div holder for the tooltip that shows the building name
    this.thousandNumFormat = d3.format(",d")

    var div = d3.select("body").append("div")
        .attr("class", "tooltip_svg")
        .style("opacity", 0);

    var node = this.svg.selectAll(".node")
        .data(that.displayData)
        .enter()
        .append("svg:svg")
        .style("position", "absolute")
        .attr("class", "node")

    node.append("svg:circle")
        .attr("fill", "#A4B161")
        .attr("fill-opacity", 1)// Bin changed from 0.6 to 0.9
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


    function clickedBuilding(buildingName) {

        $(that.eventHandler).trigger("selectionChanged", buildingName)

    }
}

MapVis.prototype.onSelectionChange= function (_buildingName){
    this.updateVis(_buildingName)
}