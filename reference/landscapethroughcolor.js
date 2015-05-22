/**
 * LTC Team: MapVis
 */

MapVis = function(_parentElement, _data, _metaData, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.metaData = _metaData;
    this.eventHandler = _eventHandler;
    this.displayData = [];

    this.currentDate = this.metaData.minDate;

    this.movingWindowOffset = this.metaData.movingWindowOffsetDays;
    // console.log("MapVis: " + this.movingWindowOffset);
    this.millisPerDay = 1000*60*60*24;
    this.margin = {top: 0, right: 0, bottom: 0, left: 30},
        this.width = 1000 - this.margin.left - this.margin.right,
        this.height = 750 - this.margin.top - this.margin.bottom;

    this.initVis();
}

MapVis.prototype.initVis = function(){

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
        {
            elementType: 'labels',
            stylers: [
                { visibility: 'off' }
            ]
        },
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
        zoom: 16,
        center: harvardYard ,
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID]
        },
        mapTypeId: MY_MAPTYPE_ID,
        panControl: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false,
        scrollwheel: false,
        draggable: false,
        disableDefaultUI: true,
        disableDoubleClickZoom: true
    };

    var mapContainer = this.parentElement.node();
    this.map = new google.maps.Map(mapContainer, mapOptions);

    var styledMapOptions = {
        name: 'Landscape Through Color Style'
    };

    var ltcMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

    this.map.mapTypes.set(MY_MAPTYPE_ID, ltcMapType);

    this.overlay = new google.maps.OverlayView();

    this.overlay.onAdd = function() {
        that.svg = d3.select(this.getPanes().overlayMouseTarget).append("svg");

        that.xScale = d3.scale.linear().domain([0, that.width]).range([0, that.width]),
            that.yScale = d3.scale.linear().domain([that.height, 0]).range([that.height, 0]);

        that.brush = d3.svg.brush().x(that.xScale).y(that.yScale).on("brush", function(){
            that.brushed();
        });
        that.svg.append("g").attr("class", "brush").call(that.brush);

        that.svg.style("position", "absolute")
            .style("top", 0)
            .style("left", 0)
            .style("width", that.width)
            .style("height", that.height)
            .attr("viewBox","0 0 " + that.width + " " + that.height);

        that.overlay.draw = function() {
            that.projection = this.getProjection();

            var movingWindowMin = new Date(that.currentDate);
            movingWindowMin.setDate(movingWindowMin.getDate() - that.movingWindowOffset);
            var movingWindowMax = new Date(that.currentDate);
            movingWindowMax.setDate(movingWindowMax.getDate() + that.movingWindowOffset);

            var filter = function(d,i){
                return (movingWindowMin <= d.date && movingWindowMax >= d.date);
            }

            that.wrangleData(filter, that.currentDate);

            that.updateVis();
        };
    };

    this.overlay.setMap(this.map);
}

MapVis.prototype.wrangleData = function(filter, sliderDate){

    var that = this;

    // TODO: time lapse and other filters
    var res = [];
    this.data.filter(filter).forEach(function(d,i){
        d.dayDiff = Math.floor(
            (
            Date.UTC(sliderDate.getFullYear(), sliderDate.getMonth(), sliderDate.getDate()) -
            Date.UTC(d.date.getFullYear(), d.date.getMonth(), d.date.getDate())
            ) / that.millisPerDay
        );
        res.push(d);
    });
    this.displayData = res;
}

MapVis.prototype.updateVis = function(){

    var that = this;

    that.svg.selectAll("circle").data(d3.entries([])).exit().remove();

    var circles = that.svg.selectAll("circle")
        .data(d3.entries(that.displayData))
        .enter().append("circle")
        .each(transform)
        .attr("id", function(d){ return d.value.uid; })
        .attr("class","marker")
        .attr("r", function(d){ return 10 + 4.0*(1.0 + 2*d.value.dayDiff/that.movingWindowOffset) })
        .attr("style", function(d){ var x = "fill: rgba(" +
            d.value.colors[0].r + "," +
            d.value.colors[0].g + "," +
            d.value.colors[0].b + ", " +
            (0.85 - 0.80*Math.abs(d.value.dayDiff/that.movingWindowOffset)) +
            ") !important";
            return x;
        })
        .each(function(d) {
            $(this).popover({
                html: true,
                trigger: 'hover',
                content: function() {
                    return '<img src="img/'+d.value.id+'" width="244" height="244"/>'+popupColor(d.value.colors);
                },
                title: d.value.date.toDateString(),
                container: 'body'
            });
        });

    function popupColor(colors) {
        returnString = "<svg width='244' height='50'>";
        // relative widths of the color rectangles: must add up to 100, for 10 colors.
        rectWidths = [30,20,20,8,5,5,3,3,3,3];
        // normalize widths to svg width
        rectWidths = rectWidths.map(function(item){ return item/100 * 244; });
        rectSum = 0;
        for (var i = 0; i < 10; i++) {
            returnString += "<rect width='"+rectWidths[i]+"' height='50' style='fill: rgb("
            +colors[i].r+","
            +colors[i].g+","
            +colors[i].b+")' transform='translate("+rectSum+",0)'></rect>";
            rectSum += rectWidths[i];
        }
        returnString +='</svg>';
        return returnString;
    }

    function transform(d) {
        d = new google.maps.LatLng(d.value.lat, d.value.lng);
        d = that.projection.fromLatLngToDivPixel(d);
        return d3.select(this)
            .attr("cx", d.x)
            .attr("cy", d.y);
    }
}

MapVis.prototype.brushed = function() {
    var that = this,
        brushedPhotos = [];
    if(this.brush.empty())
        brushedPhotos = this.displayData;
    else
        this.displayData.forEach(function(d,i) {
            var circle = new google.maps.LatLng(d.lat, d.lng);
            var photo = that.projection.fromLatLngToDivPixel(circle);
            var region = that.brush.extent();
            var upperLeftX = region[0][0], upperLeftY = region[0][1];
            var lowerRightX = region[1][0], lowerRightY = region[1][1];
            if(photo.x >= upperLeftX && photo.x <= lowerRightX &&
                photo.y >= upperLeftY && photo.y <= lowerRightY)
                brushedPhotos.push(d)
        });

    $(this.eventHandler).trigger('brushed', {
        "extent": this.brush.extent(),
        "empty": this.brush.empty(),
        "brushedPhotos": brushedPhotos
    });
}

MapVis.prototype.onSelectionChange = function(sliderDate) {

    this.currentDate = sliderDate;

    var movingWindowMin = new Date(sliderDate);
    movingWindowMin.setDate(movingWindowMin.getDate() - this.movingWindowOffset);
    var movingWindowMax = new Date(sliderDate);
    movingWindowMax.setDate(movingWindowMax.getDate() + this.movingWindowOffset);
    var filter = function(d,i){
        return (movingWindowMin <= d.date && movingWindowMax >= d.date);
    }
    this.wrangleData(filter, sliderDate);
    this.updateVis();
}

