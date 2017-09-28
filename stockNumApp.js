'use strict';
var stockNumApp = {
	stockNumbers: "",
	stockNumbersArray: [],
	vehicleData: [],
	inputVal: "",
	filePath: "",
	fileName: "",
	domain: document.domain,
	step: 1,
	init: function () {
		this.cacheDom();
		this.bindEvents();
		this.cssChanges();
	},
	cacheDom: function () {
		this.$el = $('#stockNumApp');
		this.$wrapper = this.$el.find('.input_fields_wrap');
		this.$input = this.$el.find('input[name="key"]');
		this.$get_button = this.$el.find('.get_info_button');
		this.$reset_button = this.$el.find('.reset_page_button');
		this.$download_button = this.$el.find('.download_csv_button');
		this.$hiddenDiv = this.$el.find('.hidden-div');
		this.$listItem = this.$el.find('li.item.hproduct');
		this.$result = this.$el.find('#result');
		this.$tableQty = this.$el.find('table');
	},
	bindEvents: function () {
		this.$get_button.on('click', this.getStockNumbers.bind(this));
		this.$get_button.on('click', this.loadVehicleData.bind(this));
		this.$get_button.on('click', this.ajaxComplete.bind(this));
		this.$get_button.on('click', this.cssChanges.bind(this));
		this.$download_button.on('click', this.downloadImages.bind(this));
		this.$download_button.on('click', this.downloadInfo.bind(this));
		this.$reset_button.on('click', this.resetBtn.bind(this));
	},
	getStockNumbers: function () {
		var i = 0;
		this.inputVal = this.$input.val();
		var inputArray = this.inputVal.split(" ");
		var inputArrayLength = inputArray.length;

		if (this.inputVal !== "") {
			for (i = 0; i < inputArrayLength; i++) {
				this.stockNumbersArray.push(inputArray[i]);
			}
			this.stockNumbers = this.stockNumbersArray.join('+OR+');
			//this.$input.val('');
			this.step = 2;
			$('input[type="text"]').prop("disabled", true);
			$('span.comment').text('Content Loaded Successfully');
		} else {
			$('span.comment').text('Please enter a valid stock number.');
			this.step = 1;
			return;
		}
	},
	loadVehicleData: function () {
		this.$hiddenDiv.load("/all-inventory/index.htm?search=" + this.stockNumbers + " ul.gv-inventory-list.normal-grid.list-unstyled").bind(this);
	},
	loopActions: function () {
		this.$listItem = this.$el.find('li.item.hproduct');
		$('li.item.hproduct').
		each(function () {
			stockNumApp.saveVehicleData(this);
			stockNumApp.loadImages(this);
		});
		this.makeTable();
	},
	ajaxComplete: function () {
		$(document).
		ajaxComplete(function (event, request, settings) {
			stockNumApp.swapImgSource($(this));
			stockNumApp.loopActions($(this));
		});
	},
	saveVehicleData: function (item) {
		this.filePath = $(item).find('.image-wrap img').attr('src');
		this.fileName = this.filePath.split('/').slice(16).join('/');
		var price = $(item).find('.gv-pricing .finalPrice .value').text().replace(',', '');
		var currentStockNumber = $(item).find('.gv-description [data-name="stockNumber"] span').text().slice(0, -1);
		if ((this.stockNumbersArray.indexOf(currentStockNumber)) > -1) {
			stockNumApp.vehicleData.push({
				stockNumber: $(item).find('.gv-description [data-name="stockNumber"] span').text().slice(0, -1),
				pageURL: stockNumApp.domain + $(item).find('.inventory-title a').attr("href"),
				imgFileName: this.fileName,
				Type: $(item).find('.inventory-title a').attr("href").split('/').slice(1, 2).join('/'),
				Year: $(item).attr("data-year"),
				Make: $(item).attr("data-make"),
				Model: $(item).attr("data-model"),
				Trim: $(item).attr("data-trim"),
				bodyStyle: $(item).find('.gv-description [data-name="bodyStyle"] span').text().slice(0, -1),
				exteriorColour: $(item).find('.gv-description [data-name="exteriorColor"] span').text().slice(0, -1),
				price: price
			});
		}
	},
	makeTable: function () {
		function makeTable(mydata) {
			var table = $('<table border=1 class="tableizer-table">');
			var tblHeader = "<tr>";
			for (var k in mydata[0]) tblHeader += "<th class='tableizer-firstrow'>" + k + "</th>";
			tblHeader += "</tr>";
			$(tblHeader).appendTo(table);
			$.each(mydata, function (index, value) {
				var TableRow = "<tr>";
				$.each(value, function (key, val) {
					TableRow += "<td>" + val + "</td>";
				});
				TableRow += "</tr>";
				$(table).append(TableRow);
			});
			
				return ($(table));
		}
		var mydata = eval(stockNumApp.vehicleData);
		var table = makeTable(mydata);
			$(table).prependTo("#result");
	},
	loadImages: function (item) {
		var currentStockNumber = $(item).find('.gv-description [data-name="stockNumber"] span').text().slice(0, -1);
		if ((this.stockNumbersArray.indexOf(currentStockNumber)) > -1) {

			var originalFileName = $(item).find('.image-wrap img').attr('src');
			var newFileName = originalFileName.replace('/resize/3', '/resize/10');
			$('#result').append('<a href="' + newFileName + '" download="' + newFileName + '" class="download_file"><img src="' + newFileName + '" alt="test picture"></a>');
		}
	},
	downloadImages: function () {
		$('a.download_file > img').each(function () {
			$(this).trigger("click");
		});
		return false; //cancel navigation
	},
	downloadInfo: function () {
		function convertArrayOfObjectsToCSV(args) {
			var result, ctr, keys, columnDelimiter, lineDelimiter, data;
			data = args.data || null;
			if (data == null || !data.length) {
				return null;
			}
			columnDelimiter = args.columnDelimiter || ',';
			lineDelimiter = args.lineDelimiter || '\n';
			keys = Object.keys(data[0]);
			result = '';
			result += keys.join(columnDelimiter);
			result += lineDelimiter;
			data.forEach(function (item) {
				ctr = 0;
				keys.forEach(function (key) {
					if (ctr > 0) result += columnDelimiter;
					result += item[key];
					ctr++;
				});
				result += lineDelimiter;
			});
			return result;
		}
		function downloadCSV(args) {
			var data, filename, link;
			var csv = convertArrayOfObjectsToCSV({
				data: stockNumApp.vehicleData
			});
			if (csv == null) return;
			filename = args.filename || 'export.csv';
			if (!csv.match(/^data:text\/csv/i)) {
				csv = 'data:text/csv;charset=utf-8,' + csv;
			}
			data = encodeURI(csv);
			link = document.createElement('a');
			link.setAttribute('href', data);
			link.setAttribute('download', filename);
			link.click();
		}

		downloadCSV({
			filename: "vehicle-data.csv"
		});

	},
	swapImgSource: function () {
		var x;
		var numItems = $('li.item.hproduct').length;
			if (numItems >= 10) {
				for (x = 10; x <= numItems; x++) {
					var imgLocation = $('div.hidden-div > ul > li:nth-child(' + x + ') > div.image-wrap.carouselimages > img.lazy-image.photo.thumb');
					var imgSrc = $(imgLocation).attr('data-src');
					$(imgLocation).attr('src', imgSrc);
				}
			}
	},
	cssChanges: function () {
		if (this.step == 1) {
			$('button.download_csv_button').css('display', 'none');
			$('button.reset_page_button').css('display', 'none');
		} else {
			$('button.download_csv_button, button.reset_page_button').css('display', 'initial');
			$('button.get_info_button, button.reset_page_button').css('background', '#939393');
			$('button.get_info_button').css('display', 'none');
		}
	},
	resetBtn: function () {
			location.reload();
	}
};
stockNumApp.init();