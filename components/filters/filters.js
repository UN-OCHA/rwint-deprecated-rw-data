(function() {
	var filters = window.filters = {

	    filterParams: { content_type: '', visited_startDate: '', visited_endDate: '', created_startDate: '', created_endDate: '', dimensions:[]},
	    contentType: 'reports',
	    rwURL: '',
	    currScroll: 0,
	    timelineStartDate: '2016-04-01T00:00:00+0000',
	    jobsExperienceID: [],

	    init: function(){
	    	filters.rwURL = 'https://api.reliefweb.int/v1/';

	    	//init filter vars
	        var d = util.getStartEndDate();
            filters.filterParams = { content_type: 'reports', visited_startDate: d.start_date, visited_endDate: d.end_date, dimensions:[]};
            filters.filterParams.dimensions.push({dimension:'', gadimension:'dimension1', value:'Report'});

	        //init filters
	        filters.initSelectFilters();

	        //init clear filters button
	        $('.clear-filters-btn').on('click', function(){
	        	filters.resetAllFilters();
	        });

			//hide filters for short delay while components resolve
	        $('.filter-menu').css('opacity',0).delay(1).queue(function(next){
	        	$('.jobs-sources, .training-sources').hide();
	        	$('.jobs-filters, .training-filters').hide();
			    if (util.getMetric()!='sessions') $('.dateVisitedFilter').hide(0);
			    next();
			});

	        //show filters on GA ready event
	        $(document).on( "gaReady", function(e) {
			    //get querystring
	        	filters.getQuery();

	        	//show filters
	        	$('.filter-menu').animate({ opacity: 1 }, 300);
	        	$('.filters').find('.loading').remove();
	        });

	        //mobile events
            if (util.isMobile()){
	            $('.filter-mobile').on('click', function(e){
	            	e.preventDefault();
	            	filters.filterToggle();
        			filters.currScroll = $(window).scrollTop();
	            });

	            $('.close-toggle').on('click', function(e){
	            	e.preventDefault();
        			$(window).scrollTop(filters.currScroll);
	            	filters.filterToggle();
	            });

	            //define scroll listener to make filter bar sticky in mobile view
	            // $(window).scroll(function (event){
	            //     var scroll = $(window).scrollTop();
	            //     var limit = $('header').height();
	            //     if (scroll >= limit){
	            //         $('.filter-mobile').addClass('sticky-top');
	            //     }
	            //     else{
	            //         $('.filter-mobile').removeClass('sticky-top');
	            //     }
	            // });
            }
	    },

	    //mobile filter toggle 
	    filterToggle: function(){
        	if ($('.filters').hasClass('expanded')){
        		$('.filters').removeClass('expanded');
        		$('.filters').animate({top: '100vh'}, 350, 'swing');
        	}
        	else{
	    		$('.filters').addClass('expanded');
        		$('.filters').animate({top: '0'}, 350, 'swing', function(){
        			$(window).scrollTop(0);
        		});
        	}
	    },

	    initSelectFilters: function(){
	        //init dimension filters
	        $(".dropdown").select2({
	            minimumResultsForSearch: 10
	        });

	        //set content types filter
	        var contentTypes = [{ id:'reports', text:'Reports'}, { id:'jobs', text:'Jobs' }, { id:'training', text:'Training' }];
	        $(".content_type-dropdown").select2({
	            data: contentTypes,
	            minimumResultsForSearch: 10,
	        });
	        $(".content_type-dropdown").parent().find('.select2-selection__rendered').addClass('active');


	        //set filters with cached data from RW github
	        var gitDataURL = 'https://raw.githubusercontent.com/reliefweb/rw-trends-v3/data/';
	        var gitArr = [{data: 'countries.json', filter: '.country-dropdown'},
	        		      {data: 'sources-reports-active.json', filter: '#reportsSourcesFilter'},
	        		      {data: 'sources-jobs-active.json', filter: '#jobsSourcesFilter'},
	        		      {data: 'sources-training-active.json', filter: '#trainingSourcesFilter'},
	        		      {data: 'disasters.json', filter: '.disaster-dropdown'}];
	        for (var i=0;i<gitArr.length;i++){
	        	(function(i) {
			        $.getJSON(gitDataURL + gitArr[i].data, function(obj) {
			            $.each(obj, function(key, val) {
			                var value = (val.fields.shortname!=undefined && val.fields.name != val.fields.shortname) ? val.fields.name + ' (' + val.fields.shortname + ')' : val.fields.name;
			                $(gitArr[i].filter).append("<option>" + value + "</option>");
			            });
			        });
			    })(i);
	        }

	        //get RW filters
	        var reportsArr =  [{field: 'theme', filter: '.themes-dropdown'},
	        		     	   {field: 'format', filter: '.format-dropdown'},
	        		     	   {field: 'disaster_type', filter: '.disasterType-dropdown'},
	        		     	   {field: 'vulnerable_groups', filter: '.vulnerableGroups-dropdown'}];

	        var jobsArr = 	  [{field: 'type', filter: '.jobtype-dropdown'},
	        		     	   {field: 'career_categories', filter: '.careerCategory-dropdown'}];

	        var trainingArr = [{field: 'career_categories', filter: '.trainingCareerCategory-dropdown'},
	        		     	   {field: 'cost', filter: '.cost-dropdown'},
	        		     	   {field: 'type', filter: '.trainingType-dropdown'},
	        		     	   {field: 'format', filter: '.trainingFormat-dropdown'}];
	        
	       	//reports filters
	        var reportsQuery = filters.rwURL + 'reports?appname=rw-trends-v2&preset=analysis&limit=0';
	        for (var i=0;i<reportsArr.length;i++){
	        	reportsQuery = reportsQuery + '&facets['+i+'][field]='+reportsArr[i].field+'&facets['+i+'][sort]=value:asc&facets['+i+'][limit]=20';
	        }
	        $.getJSON(reportsQuery, function(obj) {
	        	for (var i=0;i<reportsArr.length;i++){
	        		var data = obj.embedded.facets[reportsArr[i].field].data;
		            for (var j=0;j<data.length;j++){
			        	$(reportsArr[i].filter).append("<option>" + data[j].value + "</option>");
			        }
			    }
	        });

	        //jobs filters
	        var jobsQuery = filters.rwURL + 'jobs?appname=rw-trends-v2&preset=analysis&limit=0';
	        for (var i=0;i<jobsArr.length;i++){
	        	jobsQuery = jobsQuery + '&facets['+i+'][field]='+jobsArr[i].field+'&facets['+i+'][sort]=value:asc&facets['+i+'][limit]=20';
	        }
	        $.getJSON(jobsQuery, function(obj) {
	        	for (var i=0;i<jobsArr.length;i++){
	        		var data = obj.embedded.facets[jobsArr[i].field].data;
		            for (var j=0;j<data.length;j++){
			        	$(jobsArr[i].filter).append("<option>" + data[j].value + "</option>");
			        }
			    }
	        });

	        //training filters
	        var trainingQuery = filters.rwURL + 'training?appname=rw-trends-v2&preset=analysis&limit=0';
	        for (var i=0;i<trainingArr.length;i++){
	        	trainingQuery = trainingQuery + '&facets['+i+'][field]='+trainingArr[i].field+'&facets['+i+'][sort]=value:asc&facets['+i+'][limit]=20';
	        }
	        $.getJSON(trainingQuery, function(obj) {
	        	for (var i=0;i<trainingArr.length;i++){
	        		var data = obj.embedded.facets[trainingArr[i].field].data;
		            for (var j=0;j<data.length;j++){
			        	$(trainingArr[i].filter).append("<option>" + data[j].value + "</option>");
			        }
			    }
	        });

	        //get jobs experience filters
	        filters.rwURL = filters.rwURL + 'jobs?appname=rw-trends-v2';
	        var experienceData = filters.rwURL + 'jobs?appname=rw-trends-v2&facets[0][field]=experience.id&facets[0][sort]=value:asc&facets[1][field]=experience&facets[1][limit]=20&limit=0';
	        $.getJSON(experienceData, function(obj) {
	        	var exp = obj.embedded.facets['experience'].data;
	        	var expid = obj.embedded.facets['experience.id'].data;
	        	for (var i=0;i<expid.length;i++){
	        		for (var j=0;j<exp.length;j++){
	        			if (exp[j].count == expid[i].count){
	        				filters.jobsExperienceID.push(exp[j].value);
	        				$(".experience-dropdown").append("<option>" + exp[j].value + "</option>");
	        				break;
	        			}
	        		}
	        	}
	        });

	        //init date created datepicker
	        $('#dateCreatedPicker').datepicker({
	        	autoclose: true,
	        	clearBtn: true,
	        	disableTouchKeyboard: true,
	        	format: 'yyyy-mm-dd',
	        	startDate: '1996-01-01',
	        	endDate: '0d'
	        }).on('clearDate', function(e){
	        	$('.input-daterange input').each(function() {
				    $(this).datepicker('clearDates');
				});
	        });

	        //init date visited datepicker
	        $('#dateVisitedPicker').datepicker({
	        	autoclose: true,
	        	clearBtn: true,
	        	disableTouchKeyboard: true,
	        	format: 'yyyy-mm-dd',
	        	startDate: '2016-04-01',
	        	endDate: '0d'
	        }).on('clearDate', function(e){
	        	$('.input-daterange input').each(function() {
				    $(this).datepicker('clearDates');
				});
	        });

	        $('.submit-btn').click(function(){
	        	var daterange = $(this).parent().find('.input-daterange');
	        	if (daterange.find('input').val()!=''){
	        		filters.onFilterSelect(daterange);
	        	}
	        });

	        // dropdown select listener
	        $('.dropdown').on('change', function(e){ 
	        	filters.onFilterSelect(e.currentTarget);
	        });

	        //metric select listener
	        $('.metric-selector input').change(function(){
	        	filters.onMetricSelect();
	        });
	    },

	    onMetricSelect: function(){
	    	//reset date visited filter if metric is content published
			if (util.getMetric()=="content published"){
				var d = util.getStartEndDate();
				filters.filterParams.visited_startDate = d.start_date; 
				filters.filterParams.visited_endDate = d.end_date;
				$('.dateVisitedFilter').hide(0);
			}
			else{
				$('.dateVisitedFilter').show(0);
			}

			//set query
			var uri = new URI();
			uri.setQuery('metric', util.getMetric());
			window.history.pushState('object', 'title', uri);

			//apply filters
            filters.applyFilters();
	    },

	    onFilterSelect: function(target){
			filters.filterParams.metric = util.getMetric();
    		filters.filterParams.content_type = $('.content_type-dropdown').val();
            filters.filterParams.dimensions = [];
            filters.filterParams.created_startDate = '';
	        filters.filterParams.created_endDate = '';
            $.each($('.dropdown'), function(id, item) {
            	var val = $(item).val();
                if ($(item).is(':visible') && $(item).val()!="All"){
                	$(item).parent().find('label').addClass('active');
                	var val = $(item).val();

                	$(item).parent().find('.select2-selection__rendered').addClass('active');
                	if ($(item).hasClass('content_type-dropdown')){
                		val = filters.setContentTypeFilters(val);
                	}

                	//save params to filter object
                	filters.filterParams.dimensions.push({dimension:$(item).attr('data-dimension'), gadimension:$(item).attr('data-gadimension'), value:val});
               	}
               	else{
                	$(item).parent().find('label').removeClass('active');
                	$(item).parent().find('.select2-selection__rendered').removeClass('active');
               	}
            });

            //get date range input values
            if ($(target).hasClass('input-daterange') && $(target).is(':visible')){
        		filters.filterParams[$(target).attr('data-mode')+'_startDate'] = util.formatDate($(target).find('.start-date').val());
            	filters.filterParams[$(target).attr('data-mode')+'_endDate'] = util.formatDate($(target).find('.end-date').val());
        	}

  			//send the apply filters event
            filters.applyFilters();

			//add to query string
			filters.setQuery();

            //send tracking event
            dataLayer.push({
			     'event': 'Filter selection',
			     'filtername': $(target).attr('id'), 
			     'value': $(target).val()
			})
	    },

	    setContentTypeFilters: function(val){
	    	//show/hide content type specific organizations 
    		$('.sources').hide();
    		$('.' + val + '-sources').show();
			
			//show/hide content type specific filters
    		$('.sub-menu').hide();
    		$('.' + val + '-filters').show();

    		switch (val) { 
				case 'jobs': 
					val = 'Job';
					break;
				case 'training': 
					val = 'Training';
					break;		
				default:
					val = 'Report';
			}
			$('.sub-filters-header').html(val + ' Filter Options');
			return val;
	    },

	    getQuery: function(){
	    	var uri = new URI(); 
	    	var result = URI.parseQuery(uri.query());
	    	if (!$.isEmptyObject(result)){
	    		for (var key in result) {
	    			if (result[key]!=undefined){
	    				if (key=="metric"){
	    					$('input:radio[value="' + result[key] + '"]').prop('checked', true);
	    					if (result[key]=='sessions') $('.dateVisitedFilter').show(0);
		    			}
	    				else if (key.indexOf('dimension') >= 0){
	    					var dim = key.split('-')[1];
							var item = $('select[data-dimension="' + dim + '"]');
     						
     						//set filter dropdown to value
     						filters.setFilter(item, result[key]);

							//save params to filter object
        					filters.filterParams.dimensions.push({dimension:dim, gadimension:item.attr('data-gadimension'), value:result[key]});
	    				}
    					else if (key=='content_type'){
    						var item = $('.' + key + '-dropdown');
    						filters.setContentTypeFilters(result[key]);

	    					//set filter dropdown to value
	    					filters.setFilter(item, result[key]);

     						//save params to filter object
    						filters.filterParams[key] = result[key];
						}
						else{
							//set date filters
	    					var r = result[key].split('T');
	    					var date = r[0].replace(/-/g, '\/').replace(/T.+/, '');
	    					$('[data-mode="' + key.split('_')[0] + '"]').data("datepicker").pickers[1].setDate(new Date(date));

     						//save params to filter object
							filters.filterParams[key] = result[key];
						}
	    			}
	    		}
		      	filters.applyFilters();
	    	}
	    },

	    setQuery: function(){
	    	filters.clearQuery();
	    	var uri = new URI(); 
	    	var params = filters.filterParams;
	    	for (var key in params) {
	    		if (params.hasOwnProperty(key) && params[key]!='') {
	    		  	if ($.isArray(params[key])){
	    		  		for (var i=0;i<params[key].length;i++){
	    		  			var dim = params[key][i].dimension;
	    		  			if (params[key][i].dimension!=''){
    		  					uri.setQuery('dimension-'+dim, params[key][i].value);
    		  				}
	    		  		}
	    		  	}
	    		  	else{
	    		  		uri.setQuery(key, params[key]);
	    		  	}
				}
	    	}
	    	window.history.pushState('object', 'title', uri);
	    },

	    clearQuery: function(){
	    	var uri = new URI();
			uri.removeSearch(/\w/);
	    	window.history.pushState('object', 'title', uri);
	    },

	    resetAllFilters: function(){
			filters.setFilter($('.dropdown'), 'All');
			filters.setFilter($('.content_type-dropdown'), 'reports');
			filters.setFilter($('.visited-date-dropdown'), $('.visited-date-dropdown option:first-child').val());
			filters.setContentTypeFilters('reports');
			var d = util.getStartEndDate();
 	       	filters.filterParams = { content_type: 'reports', visited_startDate: d.start_date, visited_endDate: d.end_date, created_startDate: '', created_endDate: '', dimensions:[]};
    		filters.clearQuery();       
            filters.applyFilters();
	    },

	    setFilter: function(filter, value){
	    	if (filter.is(':visible')){
		    	filter.select2().val(value).trigger('change.select2');
	    		if (value=='All'){
                	filter.parent().find('label').removeClass('active');
                	filter.parent().find('.select2-selection__rendered').removeClass('active');
	    		}
	    		else{
                	filter.parent().find('label').addClass('active');
                	filter.parent().find('.select2-selection__rendered').addClass('active');
	    		}
		    }
	    },

	    applyFilters: function(){
	    	//send the apply filters event
			$(document).trigger('applyFilters');
	    }

	};
})();