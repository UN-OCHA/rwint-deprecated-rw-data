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
	    getDaysInMonth: function(year, month) {
			return new Date(year, month, 0).getDate();
		},
		isMobile: function(){
			var is_mobile = ($('.mobile-only').is(':visible')) ? true : false;
			return is_mobile;
		},
		truncateText: function(value, limit){
			// var trunc = $('<div class="truncate">' + value + '</div>').appendTo('body');
			// var orig = trunc.clone().css({display: 'inline', width: 'auto', visibility: 'hidden'}).appendTo('body');
			// var str = trunc.renderedText();
			// var lastChar = str.slice(-1);
			// if (lastChar==" "){
			// 		str = str.substring(0, str.length - 1);
			// }
			// var val = ($(trunc).width() < $(orig).width()) ? str+'...' : str;
			// trunc.remove();
			// orig.remove();
			// return val;


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
			// console.log(num, p, nearest, nearest-num, nearest-p);
			// if (Math.abs(nearest-num) < Math.abs(num-(nearest-p))){
			// 	nearest = nearest + p;
			// }
			return nearest;
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
