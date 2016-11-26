$(document).ready(function() {
	var currentContentType = 'General';
	var dimensions = [];
	var truncLimit = 22;

	var timelineDimensions = [{id:"", name:"date.created", title:"Number of reports published per month"},
							  {id:"yearMonth", name:"", title:"Number of sessions for reports per month"}
							 ];

	var genericDimensions =  [{id:"dimension6", name:"country", title:"Country"},
                 	          {id:"dimension8", name:"theme", title:"Theme"},
                 	          {id:"dimension7", name:"source", title:"Organization"}
                	         ];

    var reportsDimensions =  [{id:"dimension9", name:"disaster", title:"Disaster"},
                 	          {id:"dimension10", name:"disaster_type.name", title:"Disaster Type"},
                 	          {id:"dimension11", name:"vulnerable_groups", title:"Vulnerable Groups"},
                 	          {id:"dimension2", name:"format", title:"Format"}
                	         ];

	var jobsDimensions =     [{id:"dimension17", name:"career_categories", title:"Career Category"},
                 	          {id:"dimension15", name:"type", title:"Job Type"},
                 	          {id:"dimension16", name:"experience", title:"Job Experience"}
                	         ];

    var trainingDimensions = [{id:"dimension17", name:"career_categories", title:"Career Category"},
                 	      	  {id:"dimension18", name:"type", title:"Training Type"},
                 	      	  {id:"dimension19", name:"format", title:"Training Format"},
                 	      	  {id:"dimension14", name:"cost", title:"Training Cost"}
                	         ];



	init();

	function init(){
		gaapi.QUOTA_ID = util.randomStr(6);
		$(document).on( 'filtersReady', createDashboard);
		filters.init();
	}

	function createDashboard(){    
	    createCharts('.generic-container', genericDimensions, 'General');
	    createTimelineCharts();
	    getCharts();

	    var w = $('body').width();
	    if (w>=1280){
	    	truncLimit = 22;
	    }
	    else if (w>=768){
	    	truncLimit = 16;
	    }
	    else if (w>=667){
	    	truncLimit = 38;
	    }
	    else if (w>370){
	    	truncLimit = 14;
	    }
	    else{
	    	truncLimit = 8;
	    }
	}

	function createCharts(container, dimensions, type){
		$(container).empty();
		$(container).append('<h2>' + type + ' Data <span></span></h2>');
		for (var i=0; i<dimensions.length; i++){
            $(container).append('<div class="col-sm-6"><div class="chart-container"><h3></h3><div class="chart-inner loading"><svg class="chart generic-chart '+ util.formatName(dimensions[i].name) +'"></svg><div class="nodata-msg">There is no data for this time period.</div><div class="loader">Loading...</div></div></div></div>');
        }
	}

	function createTimelineCharts(){
		for (var i=0; i<timelineDimensions.length; i++){
			var chart = (i==0) ? timelineDimensions[i].name : timelineDimensions[i].id;
			var cite = (i==0) ? 'Source: ReliefWeb API.' : 'Source: Google Analytics API.';
            $('.timeline-container').append('<div class="col-sm-6"><div class="chart-container"><h3><span>' + timelineDimensions[i].title + '</span><hr></h3><div class="chart-inner loading"><svg class="chart timeline-chart '+ util.formatName(chart) +'"></svg><div class="nodata-msg">There is no data for this time period.</div><div class="loader">Loading...</div></div><p class="citation">' + cite + ' Not filtered by date created or date visited</p></div></div>');
        }
	}

	function getCharts(){
		//set chart section titles
		if (util.getMetric()=='sessions') {
			//$('.generic-container, .contenttype-container').find('h2 span').html('(' + filters.filterParams.visited_startDate.split('T')[0] + ' to ' + filters.filterParams.visited_endDate.split('T')[0] + ')');
			$('.generic-container, .contenttype-container').find('h2 span').html('(' + util.getVisitedDateRange() + ')');

		}
		$('.generic-chart').parent().delay(0).queue(function(next){
		    $(this).removeClass('nodata').addClass('loading');
		    next();
		});

		//set content type and create content type specific charts
		if (filters.filterParams.content_type!=currentContentType){
			currentContentType = filters.filterParams.content_type;
			dimensions = [];
			var contentDimensions = [];
			switch (filters.filterParams.content_type) { 
				case 'jobs': 
					contentDimensions = jobsDimensions;
					break;
				case 'training': 
					contentDimensions = trainingDimensions;
					break;		
				default:
					contentDimensions = reportsDimensions;
			}
			dimensions = $.merge( $.merge( [], genericDimensions ), contentDimensions );
			createCharts('.contenttype-container', contentDimensions, currentContentType);
		}

		//get data
		for (var i=0; i<dimensions.length; i++){
			if (util.getMetric() == "sessions"){
				gaapi.getData(dimensions[i]);
			}
			else{
				rwapi.getData(dimensions[i]);
			}
		}

		//get timeline data
		if (filters.mode!='timeline') {
			$('.timeline-chart').parent().delay(0).queue(function(next){
			    $(this).removeClass('nodata').addClass('loading');
			    next();
			});
			rwapi.getData(timelineDimensions[0]);
			gaapi.getData(timelineDimensions[1], 'timelineDataReady');
		}
	}

// +--------------------------------------------------------------+
// |                                                              |
// |                        DATA EVENTS                           |
// |                                                              |
// +--------------------------------------------------------------+
	$(document).on( "dataReady", function(e, result, dimensionObj, total, sampleObj) {
		//format dimension name
		var dimension = util.formatName(dimensionObj.name);
		var chart = $('.' + dimension);
		chart.parent().stop(true).removeClass('nodata').removeClass('loading');

		if (dimensionObj.name=='date.created'){
			drawTimelineChart(result, dimensionObj.name);
		}
		else{
			drawBarChart(result, dimensionObj, total, sampleObj);
		}
	});
	$(document).on( "timelineDataReady", function(e, result, dimensionObj) {
		// //format dimension name
		// var dimension = util.formatName(dimensionObj.name);
		// var chart = $('.' + dimension);
		// chart.parent().stop(true).removeClass('nodata').removeClass('loading');
		
		drawTimelineChart(result, dimensionObj.id);
	});
	$(document).on( "noData", function(e, dimensionObj) {
		clearChart(dimensionObj, 'There is no data for this time period.');
	});
	$(document).on( "error", function(e, dimensionObj, msg) {
		clearChart(dimensionObj, msg);
	});
	$(document).on( "applyFilters", function(e){
		if (util.getMetric() == "sessions"){
    		$('.dateRangeFilter').removeClass('inactive');
    	}
    	else{
    		$('.dateRangeFilter').addClass('inactive');
    	}
		getCharts();
	});


// +--------------------------------------------------------------+
// |                                                              |
// |                      CHART HELPERS                           |
// |                                                              |
// +--------------------------------------------------------------+
	function clearChart(obj, msg){
		var chart = (obj.name=='') ? obj.id : obj.name;
		var chartParent = $('.'+util.formatName(chart)).parent();
		if (chart!='yearMonth' && chart!='date.created') setChartTitle(chartParent.parent(), obj.title);
		chartParent.find('.nodata-msg').text(msg);
		chartParent.parent().find('.citation').text('');
		chartParent.stop(true).addClass('nodata').removeClass('loading');
		d3.select(chart).selectAll("*").remove();
	}

	function setChartTitle(chart, title){
		var metric = (chart.find('.chart').hasClass('user-chart')) ? 'sessions' : util.getMetric();
		var description = (metric=='sessions') ? 'Number of sessions for ' : 'Number of ';
		chart.find('h3').html('By ' + title + ' <i class="fa fa-circle" aria-hidden="true"></i><span>' + description + filters.filterParams.content_type + '</span><hr>').addClass('title');
		$('body').attr('data-metric', util.getMetric());
	}

	function setCitation(chart, sampleObj){
		var source = (chart.find('.chart').hasClass('user-chart') || util.getMetric()=='sessions') ? 'Source: Google Analytics API.' : 'Source: ReliefWeb API';
		var citation = (sampleObj!=undefined && sampleObj.samplesReadCounts!=undefined) ? source + ' This report is based on ' + formatNum(sampleObj.samplesReadCounts) + ' sessions (' + ((sampleObj.samplesReadCounts/sampleObj.samplingSpaceSizes)*100).toFixed(2) + '% of sessions)' : source;
		if (chart.find('.citation').length){
			chart.find('.citation').html(citation);
		}
		else{
			chart.append('<p class="citation">' + citation + '</p>');
		}
	}

	function setExportLink(chart, filename, data){
		if ($(chart).find('a.download-tooltip').length<1){
			$('<a href="#" class="download-tooltip" data-toggle="tooltip" title="Download CSV data"><i class="fa fa-download" aria-hidden="true"></i></a>').appendTo($(chart));
		}

		$(chart).find('a.download-tooltip').unbind().click(function(e) {
      		e.preventDefault();
      		exportData(filename, data);
        });
	}

	function exportData(name, dataset) {
      var rows = [], row, item, data, values;
      var category = (util.getMetric()=='sessions') ? util.getMetric() : filters.filterParams.content_type;

      // Column labels.
      rows.push(['Number of ' + category + ' by ' + name].concat('Count'));
 
      // Data rows.
      for (var property in dataset) {
        if (dataset.hasOwnProperty(property)){
          row = [];
          item = dataset[property];
          data = item.count;
          values = {};

          row.push(item.value);
          for (var i = 0, l = data.length; i < l; i++) {
            if (data[i]) {
              values[data[i][0]] = data[i][1];
            }
          }
          row.push(item.count);
          rows.push(row);
        }
      }

      // Export data.	
      ExportData.export(name, rows);
    }
	

// +--------------------------------------------------------------+
// |                                                              |
// |                      CHART FUNCTIONS                         |
// |                                                              |
// +--------------------------------------------------------------+
	//define chart variables
	var barHeight = 20,
		barMargin = 25,
		duration = 2000,
		scrollbarWidth = 25,
		countWidth = 20,
		charLimit = (util.isMobile()) ? 15 : 22,
	    margin = {top: 20, right: 0, bottom: 30, left: 0},
		width = $('.chart-container').width() - margin.left - margin.right,
	    labelWidth = Math.round(width*.55),
		labelY = barHeight-4,
		formatNum = d3.format('0,000');

	var x = d3.scale.linear().range([1, width-labelWidth-scrollbarWidth-countWidth]);
	var y;

	//chart functions
	function drawBarChart(data, dimensionObj, total, sampleObj){
		var dimension = util.formatName(dimensionObj.name);
		var chartName = '.' + dimension;
		var chartContainer = $(chartName).parent().parent();
		setChartTitle(chartContainer, dimensionObj.title);
		setCitation(chartContainer, sampleObj);
		setExportLink(chartContainer, dimensionObj.title, data);

		//define ranges
		x.domain([0, d3.max(data, function(d) { return d.count; })]);
		y = d3.scale.ordinal()
		    .rangeRoundBands([0, (barHeight+barMargin) * data.length]);

		//set color scale by metric
		if (util.getMetric()=='sessions'){
			var color = d3.scale.linear()
  				.domain([0, d3.max(data, function(d) { return d.count; })])
  				.range(['#EEE3FC', '#B490E3']);
		}
		else{
			var color = d3.scale.linear()
  				.domain([0, d3.max(data, function(d) { return d.count; })])
  				.range(['#E8F4F5', '#0988BB']);
		}

		//define chart
		var chart = d3.select(chartName)
		    .attr('width', width)
		    .attr('height', (barHeight+barMargin) * data.length);

		var bar = chart.selectAll('g').data(data);
		var barEnter = bar.enter().append('g')
		    .attr('transform', function(d, i) {
		    	return 'translate(0,' + ((barHeight+barMargin)*i) + ')';
		    });

		//append elements
		barEnter.append('rect');
		barEnter.append('text')
		   	.attr('class', 'label');
		barEnter.append('text')
		   	.attr('class', 'count');

		//update selections
		bar.select('rect')
		    .attr('fill', function(d) { return color(d.count); })
		    .attr('x', labelWidth+countWidth) 	
		    .attr('height', barHeight)
			.transition()
	       		.duration(duration)
		    .attr('width', function(d) { return x(d.count); });

		bar.select('.label')
		   	.attr('class', 'label')
		  	.attr('data-toggle', 'tooltip')
		  	.attr('data-original-title', function(d) { return d.value; })
		    .attr('dy', labelY)
		    .text(function(d) { return util.truncateText(d.value ,truncLimit); });

		bar.select('.count')
		   	.attr('class', 'count')
		  	.attr('x', labelWidth+15)
		    .attr('dy', labelY)
		    .text(function(d) { return formatNum(d.count); });

		//exit
		bar.exit().remove();

		//initialize tooltips
		$('[data-toggle="tooltip"]').tooltip({ container: 'body'});
	}
	   	

	function drawTimelineChart(data, dimension){
		var parseDate = d3.time.format("%Y-%m-%d").parse,
    		formatValue = d3.format(","),
    		formatTooltipDate = d3.time.format("%b %Y"),
    		bisectDate = d3.bisector(function(d) { return d.value; }).left;

		//parse dates
		var tickArr = [];
		for (var i=0;i<data.length;i++){
			var d = (dimension=='yearMonth') ? (data[i].value).substr(0, 4) + '-' + (data[i].value).substr(4, 2) + '-01' : (data[i].value).split('T')[0];
			data[i].value = parseDate(d);
			tickArr.push(data[i].value);
		}

		var chartName = '.'+util.formatName(dimension);
		var chartContainer = $(chartName).parent().parent();
		var title = (dimension=='yearMonth') ? 'Number of sessions for ' + filters.filterParams.content_type + ' per month' : 'Number of ' + filters.filterParams.content_type + ' published per month';
		$(chartContainer).find('h3 span').html(title);
		$(chartName).parent().removeClass('loading');

		var filename = (dimension=='yearMonth') ? 'monthly-sessions' : 'monthly-content';
		setExportLink(chartContainer, filename, data);

		var margin = {left: 35, top: 10, right: 20, bottom: 45},
			width = $('.chart-container').width() - margin.left - margin.right,
			height = $(chartName).parent().height() - margin.top - margin.bottom;

		if ($(chartName).children().length>0){
			d3.select(chartName).selectAll("svg > *").remove();
		}

		var x = d3.time.scale()
			.domain(d3.extent(data, function(d) { return d.value; }))
			.range([0, width]);

		var max = d3.max(data, function(d) { return d.count; });
		var y = d3.scale.linear()
		    .domain([0, util.roundNearest(max)])
		    .range([height, 0]);

		var xAxis = d3.svg.axis().scale(x)
		    .orient("bottom")
		    .innerTickSize(-height)
		    .outerTickSize(0)
    		.tickPadding(10)
    		.ticks(9)
		    .tickFormat(d3.time.format("%b %y"));
			if (data.length<9)
				xAxis.tickValues(tickArr);

		var yAxis = d3.svg.axis().scale(y)
		    .orient("left")
		    .innerTickSize(-width)
		    .outerTickSize(-width)
		    .tickPadding(10)
		    .ticks(5);
			if (max>1000)
		   		yAxis.tickFormat(d3.format("s"));

    	var area = d3.svg.area()
	    	.x(function(d) { return x(d.value); })
	    	.y0(height)
	    	.y1(function(d) { return y(d.count); });

	    var line = d3.svg.line()
		    .x(function(d) { return x(d.value); })
		    .y(function(d) { return y(d.count); });

		var chart = d3.select(chartName)
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom).append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var div = chart.append("div")	
    		.attr("class", "tooltip")				
    		.style("opacity", 0);

		chart.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(xAxis)
	        .selectAll("text")  
	            .style("text-anchor", "end")
	            .attr("dx", "-.8em")
	            .attr("dy", ".15em")
	            .attr("transform", "rotate(-65)" );

		chart.append("g")
		    .attr("class", "y axis")
		    .call(yAxis)

	    chart.append("path")
			.data([data])
	        .attr("class", "area")
	        .attr("d", area);

	    chart.append("path")
	        .data([data])
	        .attr("class", "line")
	        .attr("d", line);

	    var dot = chart.selectAll("dot")	
        .data(data)			
	    .enter().append("circle")			
	    	.attr("class", "dot")					
	        .attr("r", 5)		
	        .attr("cx", function(d) { return x(d.value); })		 
	        .attr("cy", function(d) { return y(d.count); })	
		  	.attr('data-toggle', 'tooltip')
		  	.attr('title', function(d) { return formatTooltipDate(d.value) + ": " + formatValue(d.count); })	
		  	.on("mouseover", function() { d3.select(this).style('opacity', 1); })
		  	.on("mouseout", function() { d3.select(this).style('opacity', 0); });

		//init tooltips
		$('[data-toggle="tooltip"]').tooltip({ container: 'body'});
	}

	window.addEventListener('orientationchange', function() {
		window.location.reload();
	});

	$.fn.renderedText = function(){
		var o = s = this.text();
		while (s.length && (this[0].scrollWidth>this.innerWidth())){
			s = s.slice(0,-1);
			this.text(s+"…");
		}
		this.text(o);
		return s;
	}

});
