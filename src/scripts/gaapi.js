(function() {
  var gaapi = window.gaapi = {
    EXPRESSION: "sessions",
    QUOTA_ID: "",
    GA_URL: "",

    getData: function(dimensionObj, eventCallback, pageSize){
      eventCallback = (eventCallback==undefined) ? 'dataReady' : eventCallback;
      pageSize = (pageSize==undefined) ? 10000 : pageSize;
      var filterParams = filters.filterParams;

      if (dimensionObj.id != ""){ 
        //set up date range
        var today = new Date();
        var toDate = today.getFullYear() + "-" + ("00" + (today.getMonth()+1)).slice(-2) + "-" + ("00" + today.getDate()).slice(-2);
        var startDate = (dimensionObj.id=='yearMonth') ? filters.timelineStartDate.split('T')[0] : gaapi.formatDate(filterParams.visited_startDate);
        var endDate = (dimensionObj.id=='yearMonth') ? toDate : gaapi.formatDate(filterParams.visited_endDate);
        
        var dimensionStr = '';
        if (filterParams.dimensions.length>0){
          $.each(filterParams.dimensions, function(key, val) {
            if (dimensionObj.id=='yearMonth' && val.gadimension=='dimension13'){
               // 
            }
            else{
              if (val.value!='' && val.value!=undefined){
                //dimension7 == source or dimension6 == country need to split concatenated long value from short value
                var dimensionValue = (val.gadimension=='dimension7' || val.gadimension=='dimension6') ? val.value.split(' (')[0] : val.value
                dimensionStr += '&dimension-'+val.gadimension+'='+encodeURIComponent(dimensionValue);
              }
            }
          });
        }

        //var apiURL = 'http://localhost:8080';
        //var apiURL = 'https://backend.rwdata.rwlabs.org';
        var url = gaapi.GA_URL+'/api/query?quotaID='+gaapi.QUOTA_ID+'&visited_startDate='+startDate+'&visited_endDate='+endDate+'&chart='+dimensionObj.id+'&metric='+gaapi.EXPRESSION+'&pageSize='+pageSize+dimensionStr;

        //console.log(url);

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function () {
            gaapi.parseData(xhr.responseText, dimensionObj, eventCallback);
        };
        xhr.send();
      }
      else{
        $(document).trigger("noData", dimensionObj);
      }
    },

    parseData: function(d, dimensionObj, eventCallback){
      var result = [];
      var obj = jQuery.parseJSON( d );
      var total = obj.reports[0].data.totals[0].values[0];
      var topTotal = 0;
      var langCount = 0;
      var sampleObj = {"samplesReadCounts": obj.reports[0].data.samplesReadCounts, "samplingSpaceSizes": obj.reports[0].data.samplingSpaceSizes};
      $.each(obj.reports[0].data.rows, function(key, val) {
        var category = val.dimensions[0];
        var count = Number(val.metrics[0].values[0]);
        topTotal = topTotal + Number(count);
        if (dimensionObj.id=="language"){
          //parse user language results
          category = getLanguageName(category);
          var split = (category!=undefined) ? category.split(/[\s,;]+/) : undefined;
          if (split!=undefined) {
            if (langCount < 5) addResult(split[0], count, result);
            langCount++;
          }
        }
        else{
          //check if val contains more than 1 category, split val and add to result 
          if (category.indexOf(', ') > -1){
            //drop last category if length is 150 -- GA limits
            var drop = (category.length>=149) ? true : false;
            var split = category.split(', ');
            var max = (drop) ? split.length-1 : split.length;
            for (var i=0; i<max; i++){
              addResult(split[i], count)
            }
          }
          else{
            addResult(category, count);
          }
        }     
      });

      //sort array 
      if (dimensionObj.id=="userAgeBracket" || dimensionObj.id=="yearMonth"){
        result.sort(gaapi.sortByValue);
      }
      else{
        result.sort(gaapi.sortByCount);
      }

      //format experience data for jobs 
      if (dimensionObj.id=='dimension16'){
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
      if (result.length<1){
        $(document).trigger("noData", dimensionObj);
      }
      else{
        $(document).trigger(eventCallback, [result, dimensionObj, total, sampleObj, topTotal]);
      }
      
      function addResult(cat, count){
        //check result array for existing category
        var match = false;
        for (var i=0; i<result.length; i++){
          if (cat == result[i].value){
            match = true;
            break;
          }
        }
        //if match found increment the existing category count, otherwise add the category to the result
        if (match){
          result[i].count += count;
        }
        else{
          result.push({value: cat, count:count});
        }
      }
    },

    sortByCount: function(a, b){
      var aCount = a.count;
      var bCount = b.count; 
      return ((aCount > bCount) ? -1 : ((aCount < bCount) ? 1 : 0));
    },

    sortByValue: function(a, b){
      var aValue = a.value;
      var bValue = b.value; 
      return ((aValue < bValue) ? -1 : ((aValue > bValue) ? 1 : 0));
    },

    formatDate: function(date){
      date = date.split("T");
      return date[0];
    },

    randomString: function(length, chars) {
      var result = '';
      for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
      return result;
    }

  };
})();
