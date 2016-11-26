var Util = function() {
	var self = {
		formatTitle: function(title){
			return title.toLowerCase().replace(/\b[a-z]/g, function(letter) { return letter.toUpperCase(); });
		},
		formatName: function(name){
			return (name.indexOf('.')>=0) ? name.replace('.','_') : name;
		},
		getMetric: function(){
			var selected = $('.metric-selector input[type="radio"]:checked');
			return selected.val();
		},
		getStartEndDate: function(){
			var d = new Date();
		    var currYear = d.getFullYear();
		    var currMth = d.getMonth()+1;
		    var currDay = d.getDate();
			var start = self.formatDate(currYear + '-' + ("00" + currMth).slice(-2) + '-01');
			var end = self.formatDate(currYear + '-' + ("00" + currMth).slice(-2) + '-' + ("00" + currDay).slice(-2));
			return { 'start_date': start, 'end_date': end };
		},
	    formatDate: function(d) {
	        return d + "T00:00:00+0000";
	    },
	    formatPickerDate: function(d) {
	    	var date = d.split('-')[0] + '-' + d.split('-')[1];
			return date.replace(/-/g, '\/').replace(/T.+/, '');
	    },
	    getDaysInMonth: function(year, month) {
			return new Date(year, month, 0).getDate();
		},
		getVisitedDateRange: function(){
			var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			var startdate = filters.filterParams.visited_startDate.split('-');
			var enddate = filters.filterParams.visited_endDate.split('-');
			startdate = monthNames[startdate[1]-1] + ' ' + startdate[0];
			enddate = monthNames[enddate[1]-1] + ' ' + enddate[0];
			var range = (startdate==enddate) ? startdate : startdate + ' - ' + enddate;
			return range;
		},
		isMobile: function(){
			var is_mobile = ($('.mobile-only').is(':visible')) ? true : false;
			return is_mobile;
		},
		truncateText: function(value, limit){
			if (value.length > limit) {
				value = value.substring(0, limit + 1);
				value = value.substring(0, Math.min(value.length, value.lastIndexOf(' ')));
				value = value + '...';
			}
			return value;
		},
		roundNearest: function(num){
			var p = Math.pow( 10, Math.floor( Math.log(num) / Math.LN10 ) );
			var nearest = Math.ceil(num/p)*p;
			return nearest;
		}, 
		randomStr: function(length) {
			var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		    var result = '';
		    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
		    return result;
		}
	};
	return self;
}

/**
 *
 * Make the Util object available at a global level
 *
 */
var util = null,
	initUtil = function() { util = new Util(); }

/**
 * Add a listener to the page ready event
 */

$(document).ready(initUtil);
