(function() {
  var gaapi = window.gaapi = {
    CLIENT_ID: '1069090331718-haaj3qc7l8co91c5ap1ac6d8frluo705.apps.googleusercontent.com',
    VIEW_ID: '75062',
    DISCOVERY: 'https://analyticsreporting.googleapis.com/$discovery/rest',
    SCOPES: ['https://www.googleapis.com/auth/analytics.readonly'],
    EXPRESSION: "sessions",
    QUOTA_ID: "",
    loadCount: 0,


    authorize: function(event){
      var authObj;
      $.getJSON( "data/rw-key.json", function( data ) {
        authObj = data;
        
        var pHeader = {'alg':'RS256','typ':'JWT'};
        var sHeader = JSON.stringify(pHeader);
        var pClaim = {};
        pClaim.aud = "https://www.googleapis.com/oauth2/v4/token";
        pClaim.scope = gaapi.SCOPES[0];
        pClaim.iss = authObj.client_email;
        pClaim.exp = KJUR.jws.IntDate.get("now + 1hour");
        pClaim.iat = KJUR.jws.IntDate.get("now");

        var sClaim = JSON.stringify(pClaim);
        var key = authObj.private_key;
        var sJWS = KJUR.jws.JWS.sign(null, sHeader, sClaim, key);

        var XHR = new XMLHttpRequest();
        var urlEncodedData = "";
        var urlEncodedDataPairs = [];

        urlEncodedDataPairs.push(encodeURIComponent("grant_type") + '=' + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer"));
        urlEncodedDataPairs.push(encodeURIComponent("assertion") + '=' + encodeURIComponent(sJWS));
        urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');

        XHR.addEventListener('load', function(event) {
            var response = JSON.parse(XHR.responseText);
            token = response["access_token"];
            gapi.analytics.auth.authorize({
              'serverAuth': {
                'access_token': token,
                'token_type': 'Bearer'
              }
            });
            $(document).trigger('gaReady');
        });

        //error listener
        XHR.addEventListener('error', function(event) {
            console.log('Oops! Something went wrong.');
        });

        XHR.open('POST', pClaim.aud);
        XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        XHR.send(urlEncodedData);

      });
    },


    getData: function(dimensionObj, eventCallback, pageSize){
      eventCallback = (eventCallback==undefined) ? 'dataReady' : eventCallback;
      pageSize = (pageSize==undefined) ? 10000 : pageSize;
      gaapi.loadCount++;
      //console.log(gaapi.loadCount);
      var filterParams = filters.filterParams;
      if (dimensionObj.id != ""){ 
        var filter;
        var filterArray = [];
        var dimensionArray = [];
        dimensionArray.push({"name": "ga:"+dimensionObj.id});
        //build GA filters
        if (filterParams.dimensions.length>0){
          $.each(filterParams.dimensions, function(key, val) {

            if (val.gadimension!=""){
              var value = (val.gadimension=="dimension7") ? val.value.split(' (')[0] : val.value;
              var operator = (val.gadimension=="dimension13") ? "BEGINS_WITH" : "PARTIAL";
              filterArray.push(
                {
                  "dimensionName": "ga:"+val.gadimension,
                  "operator": operator,
                  "expressions": [value]
                }
              );
            }
          });
          filter = [{                   
                      "operator" : "AND",                        
                      "filters": filterArray
                    }];
        }

        //set up date range
        var today = new Date();
        var toDate = today.getFullYear() + "-" + ("00" + (today.getMonth()+1)).slice(-2) + "-" + ("00" + today.getDate()).slice(-2);
        var startDate = (dimensionObj.id=='yearMonth') ? filters.timelineStartDate.split('T')[0] : gaapi.formatDate(filterParams.visited_startDate);
        var endDate = (dimensionObj.id=='yearMonth') ? toDate : gaapi.formatDate(filterParams.visited_endDate);
        
        // Load the API from the client discovery URL.
        gapi.client.load(gaapi.DISCOVERY
        ).then(function() {
            //Call the Analytics Reporting API V4 batchGet method.
            // var query = {
            //   "quotaUser": gaapi.QUOTA_ID,
            //   "reportRequests":[
            //   {
            //     "viewId":gaapi.VIEW_ID,
            //     "dateRanges":[
            //       {
            //         "startDate":startDate,
            //         "endDate":endDate
            //       }],
            //     "metrics":[
            //       {
            //         "expression":"ga:"+gaapi.EXPRESSION
            //       }],
            //     "orderBys":[
            //       {
            //         "fieldName": "ga:"+gaapi.EXPRESSION, "sortOrder": "DESCENDING"
            //       }],
            //     "pageSize":pageSize,
            //     "samplingLevel": "LARGE",
            //     "dimensions": dimensionArray,
            //     "dimensionFilterClauses": filter
            //   }]
            // };
            // if (dimensionObj.id=="dimension8") console.table(JSON.stringify(query));

            gapi.client.analyticsreporting.reports.batchGet( {
              "quotaUser": gaapi.QUOTA_ID,
              "reportRequests":[
              {
                "viewId":gaapi.VIEW_ID,
                "dateRanges":[
                  {
                    "startDate":startDate,
                    "endDate":endDate
                  }],
                "metrics":[
                  {
                    "expression":"ga:"+gaapi.EXPRESSION
                  }],
                "orderBys":[
                  {
                    "fieldName": "ga:"+gaapi.EXPRESSION, "sortOrder": "DESCENDING"
                  }],
                "pageSize": pageSize,
                "samplingLevel": "LARGE",
                "dimensions": dimensionArray,
                "dimensionFilterClauses": filter
              }]
            } ).then(function(response) {
              var formattedJson = JSON.stringify(response.result, null, 2);
              gaapi.parseData(formattedJson, dimensionObj, eventCallback);
            })
            .then(null, function(err) {
              console.log(err);
              var errorMsg = err.result.error.message;
              $(document).trigger("error", [dimensionObj, errorMsg] );
            });
        });
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
      gaapi.loadCount--;
      //console.log(gaapi.loadCount);
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
