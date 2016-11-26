$(document).ready(function() {

	var userDimensions = [{id:"country", name:"user_country", title:"User Country", type:"bar", count:5},
                          {id:"language", name:"language", title:"User Language", type:"bar", count:8},
                          {id:"userGender", name:"user_gender", title:"User Gender", type:"pie", count:2},
                          {id:"userAgeBracket", name:"user_age", title:"User Age", type:"bar"},
                          {id:"deviceCategory", name:"user_device", title:"User Device", type:"pie", count:3},
                          {id:"browser", name:"browser", title:"User Browsers", type:"bar", count:5}
                	     ];
    var loadInterval;
    var intervalDelay = 1000;
    var truncLimit = 22;

	$(document).on( "filtersReady", userDataInit );
	createCharts( ".user-container", userDimensions );
	
	function userDataInit(){
		getUserCharts();

		//define data events
		$(document).on( "userDataReady", function(e, result, dimensionObj, total, sampleObj, topTotal) {
			//format dimension name
			var dimension = util.formatName(dimensionObj.name);
			var chart = $('.' + dimension);
			chart.parent().removeClass('nodata').removeClass('loading');

		 	if (dimensionObj.type=="pie")
	 			drawPieChart(result, dimensionObj, total, sampleObj);
	 		else
		    	drawBarChart(result, dimensionObj, sampleObj, topTotal);
		});
		$(document).on( "applyFilters", function(e) {
			getUserCharts();
		});	

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

	function createCharts(container, dimensions){
		$(container).append('<h2>User Data</h2>');
		for (var i=0; i<dimensions.length; i++){
            $(container).append('<div class="col-sm-6"><div class="chart-container"><h3></h3><div class="chart-inner loading"><svg class="chart user-chart '+ dimensions[i].name +'"></svg><div class="nodata-msg">There is no data for this time period.</div><div class="loader">Loading...</div></div><a href="#" class="download-tooltip" data-toggle="tooltip" title="Download CSV data"><i class="fa fa-download" aria-hidden="true"></i></a></div></div>');
        }
	}

	function getUserCharts(){
		$('.user-chart').parent().removeClass('nodata').addClass('loading');
		$('.user-container').find('h2').html('User Data <span>(' + util.getVisitedDateRange() + ')</span>');
		for (var i=0; i<userDimensions.length; i++){
			gaapi.getData(userDimensions[i], 'userDataReady', userDimensions[i].count);
		}
	}

	function setCitation(element, sampleObj){
		var citation = (sampleObj!=undefined && sampleObj.samplesReadCounts!=undefined) ? 'Source: Google Analytics API. This report is based on ' + formatNum(sampleObj.samplesReadCounts) + ' sessions (' + ((sampleObj.samplesReadCounts/sampleObj.samplingSpaceSizes)*100).toFixed(2) + '% of sessions)' : 'Source: Google Analytics API';
		if (element.find('.citation').length){
			element.find('.citation').html(citation);
		}
		else{
			element.append('<p class="citation">' + citation + '</p>');
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
      rows.push(['Number of sessions for ' + category + ' by ' + name].concat('Count'));
 
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

	//define chart variables
	var barHeight = 20,
		barMargin = 25,
		duration = 500,
		scrollbarWidth = 25,
		countWidth = 20,
		charLimit = (util.isMobile()) ? 15 : 22,
	    margin = {top: 20, right: 0, bottom: 30, left: 0},
	    labelWidth = Math.round($('.chart-container').width()*.55);
		width = $('.chart-container').width() - margin.left - margin.right,
		labelY = barHeight-4,
		formatNum = d3.format('0,000');

	var x = d3.scale.linear().range([0, width-labelWidth-scrollbarWidth-countWidth]);
	var y;

	//chart functions
	function drawBarChart(data, dimensionObj, sampleObj, topTotal){
		var dimension = util.formatName(dimensionObj.name);
		var chartName = '.' + dimension;
		var chartContainer = $(chartName).parent().parent();
		var topTitle = (dimensionObj.count!=undefined) ? 'Top ' + data.length + ' ' : '';
		$(chartContainer).find('h3').html(topTitle + dimensionObj.title + ' <i class="fa fa-circle" aria-hidden="true"></i><span>Number of sessions for ' + filters.filterParams.content_type + '</span><hr>').addClass('title');
		
		setCitation($(chartContainer), sampleObj);
		setExportLink($(chartContainer), dimensionObj.title, data);
	
		//define ranges
		x.domain([0, d3.max(data, function(d) { return d.count; })]);
		y = d3.scale.ordinal()
		    .rangeRoundBands([0, (barHeight+barMargin) * data.length]);
	    
		var color = d3.scale.linear()
			.domain([0, d3.max(data, function(d) { return d.count; })])
			.range(['#EEE3FC', '#B490E3']);

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
		    .attr('width', 0)
			.transition()
	       		.duration(duration)
		    .attr('width', function(d) { return x(d.count); });

		bar.select('.label')
		   	.attr('class', 'label')
		  	.attr('data-toggle', 'tooltip')
		  	.attr('title', function(d) { return d.value; })
		    .attr('dy', labelY)
		    .text(function(d) { return util.truncateText(d.value, truncLimit); });

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

	function drawPieChart(data, dimensionObj, total, sampleObj){
		var dimension = util.formatName(dimensionObj.name);
		var chartName = '.' + dimension;
		var chartContainer = $(chartName).parent().parent();
		$(chartContainer).find('h3').html(dimensionObj.title + ' <i class="fa fa-circle" aria-hidden="true"></i><span>Number of sessions for ' + filters.filterParams.content_type + '</span><hr>').addClass('title');
		$(chartName).parent().addClass('pie-chart');
		setCitation($(chartContainer), sampleObj);
		setExportLink($(chartContainer), dimensionObj.title, data);

		if ($(chartName).children().length>0){
			d3.select(chartName).selectAll("svg > *").remove();
			$('[data-toggle="tooltip"]').tooltip('destroy');
		}

		var w = $('.chart-inner').width(),
	    	h = $('.chart-inner').height(),
	    	radius = (w<h) ? w/2 : h/2;

	    var xpos = (util.isMobile()) ? (w/2) - 10 : (w/2),
	    	ypos = (h/2) + 10;

		var color = d3.scale.ordinal()
    		.range(["#B490E3", "#c9aeec", "#e8daf9"]);		

		var arc = d3.svg.arc()
		    .outerRadius(radius - 10)
		    .innerRadius(0);

		var labelArc = d3.svg.arc()
		    .outerRadius(radius - 40)
		    .innerRadius(radius - 40);

		var pie = d3.layout.pie()
		    .sort(null)
		    .value(function(d) { return d.count; });

		var svg = d3.select(chartName).append("svg")
		    .attr("width", w)
		    .attr("height", h)
		  .append("g")
		    .attr("transform", "translate(" + xpos + "," + ypos + ")");

		var g = svg.selectAll(".arc")
			.data(pie(data))
		  .enter().append("g")
		    .attr("class", "arc");

		g.append("path")
			.attr("d", arc)
		    .style("fill", function(d) { return color(d.data.value); });

		g.append("text")
		    .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
		    .attr("dy", ".35em")
		  	.attr('data-toggle', 'tooltip')
		  	.attr('title', function(d) { return Math.round((d.value/total)*100)+'%'; })
		    .text(function(d) { return d.data.value; });

		//initialize tooltips
		$('[data-toggle="tooltip"]').tooltip({ container:'body', animation:false});

		//manual tooltip trigger events
		$('.arc').mouseover(function(e){
			e.stopPropagation();
			$(this).find('text').tooltip('show');
		}).mouseout(function(e){
			e.stopPropagation();
			$(this).find('text').tooltip('hide');
		});
	}
});
