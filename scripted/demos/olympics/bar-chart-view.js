/**==================================================
 *  Exhibit.BarChartView
 *  Creates a bar graph with the items going down the y-axis
 *  and the bars extending out along the x-axis. Supports
 *  logarithmic scales on the x-axis, the color coding True/False
 *  functionality of ScatterPlotView, and an ex:scroll option.
 *
 *  It was born of ScatterPlotView, so there may be unnecessary code
 *  in this file that wasn't pruned.
 *==================================================
 */

Exhibit.BarChartView = function(containerElmt, uiContext) {
	var view = this;
	$.extend(this, new Exhibit.View("barChart", containerElmt, uiContext));

	this.addSettingSpecs(Exhibit.BarChartView._settingSpecs);

	this._accessors = {
		getPointLabel : function(itemID, database, visitor) {
			visitor(database.getObject(itemID, "label"));
		},
		getProxy : function(itemID, database, visitor) {
			visitor(itemID);
		},
		getColorKey : null
	};

	// Function maps that allow for other axis scales (logarithmic, etc.), defaults to identity/linear
	//this._axisFuncs = { x: function (x) { return x; }, y: function (y) { return y; } };
	this._axisFuncs = {
		x : function(x) {
			return x;
		}
	};
	this._axisInverseFuncs = {
		x : function(x) {
			return x;
		}
	};
	//this._axisInverseFuncs = { x: function (x) { return x; }, y: function (y) { return y; } };

	this._colorKeyCache = new Object();
	this._maxColor = 0;

	this._onItemsChanged = function() {
		view._reconstruct();
	};

	$(uiContext.getCollection().getElement()).bind("onItemsChanged.exhibit", view._onItemsChanged);

	this.register();
};
Exhibit.BarChartView._settingSpecs = {
	"plotHeight" 		: {type : "int", 	 defaultValue : 400},
	"plotWidth"			: {type : "int"},
	"bubbleWidth"   	: {type : "int", 	 defaultValue : 400},
	"bubbleHeight"  	: {type : "int", 	 defaultValue : 300},
	"xAxisMin" 			: {type : "float", 	 defaultValue : Number.POSITIVE_INFINITY},
	"xAxisMax" 			: {type : "float", 	 defaultValue : Number.NEGATIVE_INFINITY},
	"axisType" 			: {type : "enum", 	 defaultValue : "linear",choices : ["linear", "logarithmic", "log"]},
	"yAxisMin" 			: {type : "float",	 defaultValue : Number.POSITIVE_INFINITY},
	"yAxisMax" 			: {type : "float",	 defaultValue : Number.NEGATIVE_INFINITY},
	"yAxisType" 		: {type : "enum",	 defaultValue : "linear",choices : ["linear", "logarithmic", "log"]},
	"valueLabel" 		: {type : "text",	 defaultValue : "x"},
	"groupLabel" 		: {type : "text",	 defaultValue : "y"},
	"color" 			: {type : "text",	 defaultValue : "#FF9000"},
	"colorCoder" 		: {type : "text",	 defaultValue : null},
	"scroll" 			: {type : "boolean", defaultValue : false},
	"verticalChart"  	: {type : "boolean", defaultValue : true},
	"lineChart"			: {type : "boolean", defaultValue : false},
	"tickNum"			: {type : "int"},
	"barWidth"			: {type : "float",   defaultValue : 0.8},
};

Exhibit.BarChartView._accessorSpecs = [{
	accessorName : "getProxy",
	attributeName : "proxy"
}, {
	accessorName : "getPointLabel",
	attributeName : "pointLabel"
}, {
	accessorName : "getXY",
	alternatives : [{
		bindings : [{
			attributeName : "axisData",
			types : ["float", "text"],
			bindingNames : ["values", "groupedBy"]
		}]
	}, {
		bindings : [{
			attributeName : "values",
			type : "float",
			bindingName : "x"
		}, {
			attributeName : "groupedBy",
			type : "text",
			bindingName : "y"
		}]
	}]
}, {
	accessorName : "getColorKey",
	attributeName : "colorKey",
	type : "text"
}];

Exhibit.BarChartView.create = function(configuration, containerElmt, uiContext) {
	var view = new Exhibit.BarChartView(containerElmt, Exhibit.UIContext.create(configuration, uiContext));
	Exhibit.BarChartView._configure(view, configuration);

	view._internalValidate();
	view._initializeUI();
	return view;
};

Exhibit.BarChartView.createFromDOM = function(configElmt, containerElmt, uiContext) {
	var configuration = Exhibit.getConfigurationFromDOM(configElmt);
	var view = new Exhibit.BarChartView(containerElmt != null ? containerElmt : configElmt, Exhibit.UIContext.createFromDOM(configElmt, uiContext));

	Exhibit.SettingsUtilities.createAccessorsFromDOM(configElmt, Exhibit.BarChartView._accessorSpecs, view._accessors);
	Exhibit.SettingsUtilities.collectSettingsFromDOM(configElmt, view.getSettingSpecs(), view._settings);
	Exhibit.BarChartView._configure(view, configuration);

	view._internalValidate();
	view._initializeUI();
	return view;
};

Exhibit.BarChartView._configure = function(view, configuration) {
	Exhibit.SettingsUtilities.createAccessors(configuration, Exhibit.BarChartView._accessorSpecs, view._accessors);
	Exhibit.SettingsUtilities.collectSettings(configuration, view.getSettingSpecs(), view._settings);

	view._axisFuncs.x = Exhibit.BarChartView._getAxisFunc(view._settings.axisType);
	view._axisInverseFuncs.x = Exhibit.BarChartView._getAxisInverseFunc(view._settings.axisType);

	var accessors = view._accessors;

	//itemID is an item in _uiContext.getCollection().getRestrictedItems()'s _hash, for example.
	//database comes from _uiContext.getDatabase()
	//visitor is a function that takes one argument. In this case it will be:
	// function(xy) { if ("x" in xy && "y" in xy) xys.push(xy); }

	view._getXY = function(itemID, database, visitor) {
		accessors.getProxy(itemID, database, function(proxy) {
			accessors.getXY(proxy, database, visitor);
		});
	};
};

// Convenience function that maps strings to respective functions
Exhibit.BarChartView._getAxisFunc = function(s) {
	if (s == "logarithmic" || s == "log") {
		return function(x) {
			return (Math.log(x) / Math.log(10.0));
		};
	} else {
		return function(x) {
			return x;
		};
	}
}
// Convenience function that maps strings to respective functions
Exhibit.BarChartView._getAxisInverseFunc = function(s) {
	if (s == "log" || s == "logarithmic") {
		return function(x) {
			return Math.pow(10, x);
		};
	} else {
		return function(x) {
			return x;
		};
	};
}

Exhibit.BarChartView._colors = ["FF9000", "5D7CBA", "A97838", "8B9BBA", "FFC77F", "003EBA", "29447B", "543C1C"];
Exhibit.BarChartView._mixColor = "FFFFFF";

Exhibit.BarChartView.evaluateSingle = function(expression, itemID, database) {
	return expression.evaluateSingleOnItem(itemID, database).value;
}

Exhibit.BarChartView.prototype.dispose = function() {
	$(this.getUIContext().getCollection().getElement()).unbind("onItemsChanged.exhibit", this._onItemsChanged);

	this._dom.dispose();
	this._dom = null;

	this._dispose();
};

Exhibit.BarChartView.prototype._internalValidate = function() {
	if ("getColorKey" in this._accessors) {
		if ("colorCoder" in this._settings) {
			this._colorCoder = this.getUIContext().getMain().getComponent(this._settings.colorCoder);
		}

		if (this._colorCoder == null) {
			this._colorCoder = new Exhibit.DefaultColorCoder(this.getUIContext());
		}
	}
};

Exhibit.BarChartView.prototype._initializeUI = function() {
	var self = this;
	var legendWidgetSettings = "_gradientPoints" in this._colorCoder ? "gradient" : {}

	this._dom = Exhibit.ViewUtilities.constructPlottingViewDom(this.getContainer(), this.getUIContext(), true, // showSummary
	{
		onResize : function() {
			self._reconstruct();
		}
	}, legendWidgetSettings);
	this._dom.plotContainer.className = "exhibit-barChartView-plotContainer";
	this._dom.plotContainer.style.height = this._settings.plotHeight + "px";
	if (this._settings.plotWidth){
		this._dom.plotContainer.style.width = this._settings.plotWidth + "px";
	}
	
	this._reconstruct();
};

// Why database = this._settings, but scaleX = self._axisFuncs.x ??
// Ah, because one block from david, other from mason

/** Where all the good stuff happens. There is a canvas div, in
 *  which resides a table. The left side is filled up with divs
 *  labeling the bars, and the right side is filled up with divs
 *  serving as the bars.
 */

Exhibit.BarChartView.prototype._reconstruct = function() {
	var self, colorCodingFlags, collection, container, database, settings, flotrCoord, unplottableItems, color, accessors, vertical_chart, scaleX, unscaleX, currentSize, xyDataPub;
	self = this;
	colorCodingFlags = {
		mixed : false,
		missing : false,
		others : false,
		keys : new Exhibit.Set()
	};
	
	collection = this.getUIContext().getCollection();
	database = this.getUIContext().getDatabase();
	settings = this._settings;
	accessors = this._accessors;
	vertical_chart = settings.verticalChart;
	this._dom.plotContainer.innerHTML = "";

	scaleX = self._axisFuncs.x;
	//    var scaleY = self._axisFuncs.y;
	unscaleX = self._axisInverseFuncs.x;
	//    var unscaleY = self._axisInverseFuncs.y;

	currentSize = collection.countRestrictedItems();
	xyDataPub = [];
	flotrCoord = {};
	unplottableItems = [];
	color = settings.color;
	this._dom.legendWidget.clear();
	prepareData = function() {
		var index, xAxisMin, xAxisMax, hasColorKey, currentSet, xDiff;
		currentSet = collection.getRestrictedItems();
		hasColorKey = (self._accessors.getColorKey != null);
		index = 0;
		xAxisMin = settings.xAxisMin;
		xAxisMax = settings.xAxisMax;
		//        var yAxisMin = settings.yAxisMin;
		//        var yAxisMax = settings.yAxisMax;

		/*
		 *  Iterate through all items, collecting min and max on both axes
		 */

		currentSet.visit(function(itemID) {
    		var group, xys, colorKeys, xy, xyKey, xyData;
    		group = [];
	    		if (hasColorKey){
					accessors.getColorKey(itemID, database, function(item) {
						group.push(item);
				});
			}
			if (group.length > 0) {
				colorKeys = null;
				
				if (hasColorKey) {
					colorKeys = new Exhibit.Set();
					accessors.getColorKey(itemID, database, function(v) {
						colorKeys.add(v);
					});
					color = self._colorCoder.translateSet(colorKeys, colorCodingFlags);
				}
			};			
			
			xys = [];
			
			self._getXY(itemID, database, function(axisData) {
				if ("x" in axisData && "y" in axisData){
						xys.push(axisData);
				}
					
			});

			if (xys.length > 0) {
				colorKeys = null;
				if (hasColorKey) {
					colorKeys = new Exhibit.Set();
					accessors.getColorKey(itemID, database, function(v) {
						colorKeys.add(v);
					});
					color = self._colorCoder.translateSet(colorKeys, colorCodingFlags);
				}
				else {
					color = settings.color;
				}
				
				for (var i = 0; i < xys.length; i++) {
					xy = xys[i];
					xyKey = xy.x + "," + xy.y;		//Useless?

					try {
						xy.scaledX = scaleX(xy.x);
						//                            xy.scaledY = scaleY(xy.y);
						//                            if (!isFinite(xy.scaledX) || !isFinite(xy.scaledY)) {
						if (!isFinite(xy.scaledX)) {
							continue;
						}
					} catch (e) {
						continue;
						// ignore the point since we can't scale it, e.g., log(0)
					}

					xyData = {
						xy : xy,
						items : [itemID]

					};
					if (hasColorKey) {
						xyData.colorKeys = colorKeys;
					}

					xAxisMin = Math.min(xAxisMin, xy.scaledX);
					xAxisMax = Math.max(xAxisMax, xy.scaledX);
				}
			} else {
				unplottableItems.push(itemID);
			}
			if ( typeof xyData == "object") {
				if (vertical_chart){
					xyData.xy.z=index;
					index--;
						try {
							flotrCoord[color].push([xyData.xy.scaledX, xyData.xy.z]);
						}
						catch(e){
							flotrCoord[color] = [[xyData.xy.scaledX, xyData.xy.z]];
						}
				}
				else{
					xyData.xy.z=index;
					index++;
						try {
							flotrCoord[color].push([xyData.xy.z, xyData.xy.scaledX]);
						}
						catch(e){
							flotrCoord[color] = [[xyData.xy.z, xyData.xy.scaledX]];
						}
				};
				xyData.xy.color = color;
				xyDataPub.push(xyData);
			}
		});
		
		/*
		 *  Finalize mins, and maxes for both axes
		 */
		xDiff = xAxisMax - xAxisMin;
		//        var yDiff = yAxisMax - yAxisMin;

		var xInterval = 1;
		if (xDiff > 1) {
			while (xInterval * 20 < xDiff) {
				xInterval *= 10;
			}
		} else {
			while (xInterval > xDiff * 20) {                //There was a typo here.
				xInterval /= 10;			//Often crashes the browser when something isn't done correctly.
			}
		}
		settings.xAxisMin = Math.floor(xAxisMin / xInterval) * xInterval;
		settings.xAxisMax = Math.ceil(xAxisMax / xInterval) * xInterval;
	}
	
	if (currentSize > 0){
		prepareData();
		
		/*if (vertical_chart && !this._settings.plotHeight) {
			if (currentSize >= 15){
				this._dom.plotContainer.style.height = currentSize * 20 + 100 + "px";
			}else{
				this._dom.plotContainer.style.height = currentSize * 30 + 100 + "px";
			}
		} 
		if (!vertical_chart && !this._settings.plotWidth){
			if (currentSize >= 30){
				this._dom.plotContainer.style.width = currentSize * 20 + 100 + "px";
			}else{
				this._dom.plotContainer.style.width = currentSize * 40 + 100 + "px";
			}
		}*/

		container = document.createElement("div");
		container.className = "barChartViewContainer";
		container.style.height = "100%";
		this._dom.plotContainer.appendChild(container);

		this._flotrConstructor(xyDataPub, flotrCoord, container, currentSize);
	}
	
	this._dom.setUnplottableMessage(currentSize, unplottableItems);
};

Exhibit.BarChartView.prototype._flotrConstructor = function(xyDataPub, flotrCoord, container,  currentSize) {
	var self, settings, xAxisMax, xAxisMin, vertical_chart, axisScale;
	self = this;
	settings= this._settings;
	line_chart  =settings.lineChart;
	xAxisMax = settings.xAxisMax;
	xAxisMin = settings.xAxisMin;
	vertical_chart = settings.verticalChart;
	axisScale = settings.axisType;
	num_tick = settings.tickNum;

		
			Flotr.addPlugin('clickHit', {
				callbacks : {
					'flotr:click' : function(e) {
						
						this.clickHit.clickHit(e);
					}
				},

				clickHit : function(mouse) {
					var closest = this.clickHit.closest(mouse);
					accessClosest = closest;
				},
				

				closest : function(mouse) {

					var series = this.series, options = this.options, mouseX = mouse.x, mouseY = mouse.y, compare = Number.MAX_VALUE, compareX = Number.MAX_VALUE, compareY = Number.MAX_VALUE, compareXY = Number.MAX_VALUE, closest = {}, closestX = {}, closestY = {}, check = false, serie, data, distance, distanceX, distanceY, x, y, i, j,within_bar;
					function setClosest(o) {
						o.distance = distance;
						o.distanceX = distanceX;
						o.distanceY = distanceY;
						o.seriesIndex = i;
						o.dataIndex = j;
						o.x = x;
						o.y = y;
					}
					
					for ( i = 0; i < series.length; i++) {

						serie = series[i];
						data = serie.data;

						if (data.length)
							check = true;

						for ( j = data.length; j--; ) {

							x = data[j][0];
							y = data[j][1];

							if ((x === null && !vertical_chart)||(y === null && vertical_chart))
								continue;

							distanceX = Math.abs(x - mouseX);
							distanceY = Math.abs(y - mouseY);

							if (vertical_chart && !line_chart){
								distance = distanceY
							}else if (!vertical_chart && !line_chart){
								distance = distanceX
							}else if (line_chart){
								distance = distanceX*distanceX+distanceY*distanceY;
							}

							if (distance < compare) {
								compare = distance;
								setClosest(closest);
							}

							if (distanceX < compareX && !vertical_chart) {
								compareX = distanceX;
								//console.log("closeX: ", closestX);
								setClosest(closestX);
								(mouseY>=0 && mouseY-y<.04*xAxisMax)? within_bar = true : within_bar = false;
							}
							if (distanceY < compareY && vertical_chart) {
								compareY = distanceY;
								//console.log("closeY: ", closestY);
								setClosest(closestY);
								(mouseX>=0 && mouseX-x<.04*xAxisMax)? within_bar = true : within_bar = false;
							}
							if (line_chart && (Math.abs(mouseY-y)+Math.abs(mouseX-x))<compareXY){
								//console.log("in: ", (Math.abs(mouseY-y)+Math.abs(mouseX-x)), (Math.abs(mouseY-y)+Math.abs(mouseX-x)<.04*xAxisMax));
								if (Math.abs(mouseY-y)+Math.abs(mouseX-x)<.01*xAxisMax) {
									compareXY = (Math.abs(mouseY-y)+Math.abs(mouseX-x));
									within_bar = true;
									setClosest(closest);
								}else{
									within_bar = false;
								}
							}
						}
					}

					return check&&within_bar?{
						point : closest,
						x : closestX,
						y : closestY
					} : false;
				}
			});
		
		
		//pop is a boolean which tells you whether the PopUp is open or not
		// initialize it as false since there are no popUps at the beginning
		var pop = false;
		
		$('body').click(function(e) {
			var numtickFn, tickFormatterFn;
			// if there's popUp
			//close the existing popUp if the user has clicked outside the popUp
			if (pop) {
				if (!$(e.target).closest('.simileAjax-bubble-contentContainer.simileAjax-bubble-contentContainer-pngTranslucent').length) {
					pop = false;
					$('.simileAjax-bubble-container').hide();
				};
			}
			
			//if there is no popup, open the popUp
			if (!pop) {
				if ($(e.target).closest(container).length){
					if (line_chart){
						var items = xyDataPub[Math.abs(accessClosest.point.dataIndex)].items;
					}else if (!vertical_chart){
						var items = xyDataPub[Math.abs(accessClosest.x.x)].items;	
					}else{
						var items = xyDataPub[Math.abs(accessClosest.y.y)].items;
					}
					pop = true;
					Exhibit.ViewUtilities.openBubbleWithCoords(e.pageX, e.pageY, items, self.getUIContext());
				}
			
			}
		});

			numtickFn = function(horizontal_bars, axis) {
				if ((horizontal_bars && axis == "y") || (!horizontal_bars && axis == "x")) {
					return currentSize;
				} else {
					if(num_tick){
						return num_tick;
					}else{
						return Math.min(5, currentSize+1);
					}
				}
			}
			tickFormatterFn = function(n, axis){
				var b = Math.abs(parseFloat(n)), verticalness = vertical_chart;
				if (axis != "x"){
					verticalness = !vertical_chart;
				}
				if (!verticalness) {
					try {
						if(typeof xyDataPub[b].xy.y != "undefined"){
							return xyDataPub[b].xy.y;
						}
					} catch(e) {
						return "";
					}
				} else {
					if (axisScale == "logarithmic" || axisScale == "log") {
						return "10^" + n;
					}
					return n;
				}
				return "";
			}
			
			/*
			 * Used to fix the tick cutoff issuse that occurs when when no chart title is used.
			 */
			Flotr.addPlugin('margin', {
				callbacks : {
					'flotr:afterconstruct' : function() {
						this.plotOffset.left += this.options.fontSize * .5;
						this.plotOffset.right += this.options.fontSize * 3;
						this.plotOffset.top += this.options.fontSize * 3;
						this.plotOffset.bottom += this.options.fontSize * .5;
					}
				}
			});
			var xMin, yMin, label2, xAxislabel, yAxislabel;
			vertical_chart == true ? ( xMin = xAxisMin, yMin = null, xAxislabel = settings.valueLabel, yAxislabel = settings.groupLabel) : ( xMin = null, yMin = xAxisMin, xAxislabel = settings.groupLabel, yAxislabel = settings.valueLabel);


			var dataList = [], barW = this._settings.barWidth;
			for (k in flotrCoord){
				dataList.push({data:flotrCoord[k], color:k});
			}
			if (barW > 1.0 || barW <=0.0){
				barW = 0.8;			//keep at <= 1.0 for the bars to display properly.
			}
			
			Flotr.draw(container, dataList, {
				HtmlText : false,
				lines: {
					show : line_chart,
				},
				points: {
            		show: line_chart,
        		},
				bars : {
					show : !line_chart,
					horizontal : vertical_chart,
					shadowSize : 0,
					barWidth : barW 
				},
				grid: {
 				    color: '#000000',
            		verticalLines : vertical_chart||line_chart,
            		horizontalLines : (!vertical_chart)||line_chart
        	},
				mouse : {
					track : true,
					trackFormatter: function(o){
						if(!vertical_chart){
							return xyDataPub[Math.abs(o.x)].xy.y + ": " + o.y;
						}else{
							
						return xyDataPub[Math.abs(o.y)].xy.y + ": " + o.x;
						}
						
					}
					//relative : true 
				},
				xaxis : {
					min : xMin,
					labelsAngle : 45,
					noTicks : numtickFn(vertical_chart, "x"),
					//autoscale: true,
					title : xAxislabel,
					tickFormatter : function(n) {
						return tickFormatterFn(n, "x");
					}
				},
				yaxis : {
					//max: xAxisMax*1.1,  //originally used to fix the tick label cutoff issue.
					min : yMin,
					noTicks : numtickFn(vertical_chart, "y"),
					title : yAxislabel,
					tickFormatter : function(n) {
						return tickFormatterFn(n, "y");
					}
				}
			});
};
