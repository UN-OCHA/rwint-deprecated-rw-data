(function() {
	var rwapi = window.rwapi = {
		RW_URL: "",

		getData: function(dimensionObj){
			var filterParams = filters.filterParams;
			var dimension = dimensionObj.name;
			var conditionArr = [];
			var filterObj = {};
			var interval = (dimension=="date.created") ? "month" : "";

			//set dimension filters
			if (filterParams.dimensions){
	            $.each(filterParams.dimensions, function(key, val) {
	            	if (val.dimension!=""){
	            		var dim = (val.dimension == 'disaster') ? 'disaster.name.exact' : val.dimension;
	                	conditionArr.push({"field": dim, "value": val.value });
	            	}
	            });
			}
			//set date created filter
			if (dimension=="date.created"){
				var today = new Date();
				var toDate = util.formatDate(today.getFullYear() + "-" + ("00" + (today.getMonth()+1)).slice(-2) + "-" + ("00" + today.getDate()).slice(-2));
				var fromDate = filters.timelineStartDate;
				conditionArr.push({"field": "date.created", "value": {"from": fromDate, "to": toDate} });
			}
			else{
				if (filterParams.created_startDate && filterParams.created_endDate){
					conditionArr.push({"field": "date.created", "value": {"from": filterParams.created_startDate, "to": filterParams.created_endDate} });
				}
			}
			//set filter conditions
			if (conditionArr.length>0){
				filterObj = {"operator": "AND", "conditions": conditionArr};
			}

			//build RW query
			var facets = [{ "field": dimension, "filter": filterObj }];
			if (dimension=="date.created"){
				facets[0].interval = interval;
			}
			else{
				facets[0].limit = 700000;
			}
			var rwQuery = { "facets": facets };

			//if (dimension=="date.created") console.log(JSON.stringify(rwQuery));

			//send RW query
			var url = rwapi.RW_URL + filterParams.content_type + '?appname=rw-trends-v2&preset=analysis';
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function(){
				if (xhr.readyState === 4) {
					var data = JSON.parse(xhr.responseText);
					var items = data.embedded.facets[dimension].data;

					if (items!=undefined){
						rwapi.parseData(items, dimensionObj);
					}
					else{
						$(document).trigger("noData", dimensionObj);
					}
				}
			}
			xhr.open("POST", url, true);
			xhr.send(JSON.stringify(rwQuery));
		},

		parseData: function(d, dimensionObj){
			var result = [];
			var total = 0;
			for (var i=0; i<d.length; i++) {
				var item = d[i];
				total = total + Number(item.count);
				result.push({id: i, value: item.value, count: item.count });
			}

			//format experience data for jobs 
			if (dimensionObj.name=='experience'){
				var tmp = [];
				for (var i=0; i<filters.jobsExperienceID.length; i++) {
					for (var j=0; j<result.length; j++) {
						if (filters.jobsExperienceID[i]==result[j].value){
							tmp.push(result[j]);
							break;
						}
					}
				}
				result = tmp;
			}

			//send data ready event
			$(document).trigger("dataReady", [result, dimensionObj, total]);
		}
	};
})();