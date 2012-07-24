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
	"plotHeight" : {
		type : "int",
		defaultValue : 400
	},
	"bubbleWidth" : {
		type : "int",
		defaultValue : 400
	},
	"bubbleHeight" : {
		type : "int",
		defaultValue : 300
	},
	"xAxisMin" : {
		type : "float",
		defaultValue : Number.POSITIVE_INFINITY
	},
	"xAxisMax" : {
		type : "float",
		defaultValue : Number.NEGATIVE_INFINITY
	},
	"xAxisType" : {
		type : "enum",
		defaultValue : "linear",
		choices : ["linear", "logarithmic", "log"]
	},
	"yAxisMin" : {
		type : "float",
		defaultValue : Number.POSITIVE_INFINITY
	},
	"yAxisMax" : {
		type : "float",
		defaultValue : Number.NEGATIVE_INFINITY
	},
	"yAxisType" : {
		type : "enum",
		defaultValue : "linear",
		choices : ["linear", "logarithmic", "log"]
	},
	"xLabel" : {
		type : "text",
		defaultValue : "x"
	},
	"yLabel" : {
		type : "text",
		defaultValue : "y"
	},
	"color" : {
		type : "text",
		defaultValue : "#5D7CBA"
	},
	"colorCoder" : {
		type : "text",
		defaultValue : null
	},
	"scroll" : {
		type : "boolean",
		defaultValue : false
	},
	"vertical" : {
		type : "boolean",
		defaultValue : true
	}
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
			attributeName : "xy",
			types : ["float", "text"],
			bindingNames : ["x", "y"]
		}]
	}, {
		bindings : [{
			attributeName : "x",
			type : "float",
			bindingName : "x"
		}, {
			attributeName : "y",
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

	view._axisFuncs.x = Exhibit.BarChartView._getAxisFunc(view._settings.xAxisType);
	view._axisInverseFuncs.x = Exhibit.BarChartView._getAxisInverseFunc(view._settings.xAxisType);

	//    view._axisFuncs.y = Exhibit.BarChartView._getAxisFunc(view._settings.yAxisType);
	//    view._axisInverseFuncs.y = Exhibit.BarChartView._getAxisInverseFunc(view._settings.yAxisType);

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
	var self = this;

	var collection = this.getUIContext().getCollection();
	var database = this.getUIContext().getDatabase();
	var settings = this._settings;
	var accessors = this._accessors;

	this._dom.plotContainer.innerHTML = "";

	var scaleX = self._axisFuncs.x;
	//    var scaleY = self._axisFuncs.y;
	var unscaleX = self._axisInverseFuncs.x;
	//    var unscaleY = self._axisInverseFuncs.y;

	var currentSize = collection.countRestrictedItems();
	var unplottableItems = [];

	this._dom.legendWidget.clear();
	if (currentSize > 0) {
		var currentSet = collection.getRestrictedItems();
		var hasColorKey = (this._accessors.getColorKey != null);
		var xyDataPub = [];
		var xyToData = {};
		var xAxisMin = settings.xAxisMin;
		var xAxisMax = settings.xAxisMax;
		//        var yAxisMin = settings.yAxisMin;
		//        var yAxisMax = settings.yAxisMax;

		/*
		 *  Iterate through all items, collecting min and max on both axes
		 */
		currentSet.visit(function(itemID) {
			var xys = [];
			//            self._getXY(itemID, database, function(xy) { if ("x" in xy && "y" in xy) xys.push(xy); console.log(xy.y);});
			self._getXY(itemID, database, function(xy) {
				if ("x" in xy && "y" in xy)
					xys.push(xy);
			});

			if (xys.length > 0) {
				var colorKeys = null;
				if (hasColorKey) {
					colorKeys = new Exhibit.Set();
					accessors.getColorKey(itemID, database, function(v) {
						colorKeys.add(v);
					});
				}

				for (var i = 0; i < xys.length; i++) {
					var xy = xys[i];
					var xyKey = xy.x + "," + xy.y;
					if ( xyKey in xyToData) {
						var xyData = xyToData[xyKey];
						xyData.items.push(itemID);
						if (hasColorKey) {
							xyData.colorKeys.addSet(colorKeys);
						}
					} else {
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

						var xyData = {
							xy : xy,
							items : [itemID]

						};
						if (hasColorKey) {
							xyData.colorKeys = colorKeys;
						}
						xyToData[xyKey] = xyData;

						if (settings.xAxisType == "logarithmic" || settings.xAxisType == "log") {
							xAxisMin = Math.min(0, Math.min(xAxisMin, xy.scaledX));
						} else {
							xAxisMin = Math.min(xAxisMin, xy.scaledX);
						}
						xAxisMax = Math.max(xAxisMax, xy.scaledX);
						//                        yAxisMin = Math.min(yAxisMin, xy.scaledY);
						//                        yAxisMax = Math.max(yAxisMax, xy.scaledY);
					}
				}
			} else {
				unplottableItems.push(itemID);
			}
			if ( typeof xyData == "object") {
				xyDataPub.push(xyData);
			}
		});

		/*
		 *  Figure out scales, mins, and maxes for both axes
		 */
		var xDiff = xAxisMax - xAxisMin;
		//        var yDiff = yAxisMax - yAxisMin;

		var xInterval = 1;
		if (xDiff > 1) {
			while (xInterval * 20 < xDiff) {
				xInterval *= 10;
			}
		} else {
			while (xInterval < xDiff * 20) {
				xInterval /= 10;
			}
		}
		xAxisMin = Math.floor(xAxisMin / xInterval) * xInterval;
		xAxisMax = Math.ceil(xAxisMax / xInterval) * xInterval;

		/*        var yInterval = 1;
		 if (yDiff > 1) {
		 while (yInterval * 20 < yDiff) {
		 yInterval *= 10;
		 }
		 } else {
		 while (yInterval < yDiff * 20) {
		 yInterval /= 10;
		 }
		 }
		 yAxisMin = Math.floor(yAxisMin / yInterval) * yInterval;
		 yAxisMax = Math.ceil(yAxisMax / yInterval) * yInterval;
		 */
		settings.xAxisMin = xAxisMin;
		settings.xAxisMax = xAxisMax;
		//        settings.yAxisMin = yAxisMin;
		//        settings.yAxisMax = yAxisMax;

		/*
		*  Construct plot's frame
		*/

		//COMMENTING OUT THE PART FROM HERE

		/*var canvasFrame = document.createElement("div");
		canvasFrame.className = "exhibit-barChartView-canvasFrame";
		this._dom.plotContainer.appendChild(canvasFrame);
		if (self._settings.scroll) {
		canvasFrame.style.overflow="scroll";
		}

		//******* Two column, one row table to put the barchart in.
		var theTable = document.createElement("table");
		var tableBody = document.createElement("tbody");
		var theRow = document.createElement("tr");
		var leftCol = document.createElement("td");
		var rightCol = document.createElement("td");
		var labelpart = document.createElement("div");
		var barpart = document.createElement("div");

		theTable.style.width="100%";
		//theTable.style.tableLayout="fixed";
		//rightCol.style.width="100%";
		barpart.style.position="relative";
		barpart.style.width="100%";
		//barpart.style.float="left";

		leftCol.appendChild(labelpart);
		rightCol.appendChild(barpart);
		theRow.appendChild(leftCol);
		theRow.appendChild(rightCol);
		tableBody.appendChild(theRow);
		theTable.appendChild(tableBody);

		canvasFrame.appendChild(theTable);*/
		//*********

		/*var canvasDiv = document.createElement("div");
		canvasDiv.className = "exhibit-barChartView-canvas";
		canvasDiv.style.height = "100%";
		//barpart.appendChild(canvasDiv);*/

		/*        var theTable = document.createElement("table");
		theTable.style.width="100%";
		*/
		/*var yAxisDiv = document.createElement("div");
		yAxisDiv.className = "exhibit-barChartView-yAxis";
		this._dom.plotContainer.appendChild(yAxisDiv);

		var yAxisDivInner = document.createElement("div");
		yAxisDivInner.style.position = "relative";
		yAxisDivInner.style.height = "100%";
		yAxisDiv.appendChild(yAxisDivInner);*/

		//commenting out the part above!

		/*
		 for (var y = yAxisMin + yInterval; y < yAxisMax; y += yInterval) {
		 var bottom = Math.floor((y - yAxisMin) * yScale);

		 var div = document.createElement("div");
		 div.className = "exhibit-barChartView-gridLine";
		 div.style.height = "1px";
		 div.style.bottom = bottom + "px";
		 div.style.left = "0px";
		 div.style.width = "100%";
		 canvasDiv.appendChild(div);

		 var labelDiv = document.createElement("div");
		 labelDiv.className = "exhibit-barChartView-yAxisLabel";
		 labelDiv.style.bottom = bottom + "px";
		 labelDiv.innerHTML = makeLabelY(y);
		 yAxisDivInner.appendChild(labelDiv);
		 }
		 */ /*var yNameDiv = document.createElement("div");
		 yNameDiv.className = "exhibit-barChartView-yAxisName";
		 yNameDiv.innerHTML = settings.yLabel;
		 yAxisDivInner.appendChild(yNameDiv);*/

		var xyDataPub2 = [];
		for (xyKey in xyToData) {
			xyDataPub2.push(xyToData[xyKey]);
		}

		var axisScale = settings.xAxisType;
		var vertical_chart = settings.vertical;
		//Adjusts the bar chart dimension and axis scaling.
		if (vertical_chart) {
			this._dom.plotContainer.style.height = xyDataPub.length * 20 + 75 + "px";
		} else {
			this._dom.plotContainer.style.width = xyDataPub.length * 20 + 75 + "px";
		}

		var container = document.createElement("div");
		container.className = "scatterplotViewContainer";
		container.style.height = "100%";
		this._dom.plotContainer.appendChild(container);

		/*
		 *  Plot the points
		 */
		var colorCodingFlags = {
			mixed : false,
			missing : false,
			others : false,
			keys : new Exhibit.Set()
		};
		(function() {
			//vertical_chart == true ? false: false;
			var d1 = [], point, datalen = xyDataPub.length;
			//SimileAjax.Debug.log(xyDataPub);
			var marker_position;
			axisScale.indexOf("log") >= 0 ? marker_position = "ml" : marker_position = "mr";
			var markers = {
				data : [],
				markers : {
					//labelFormatter: function(n){try{return xyDataPub[n.index].xy.x.toExponential(2);}catch(e){return "";};},
					labelFormatter : function(n) {
						try {
							return xyDataPub[n.index].xy.x;
						} catch(e) {
							return "";
						};
					},
					show : true,
					//position: function(){if(axisScale.indexOf("log")>=0){return "ml";}else{return "mr";}}
					position : marker_position
				}
			};
			for (var j = 0; j < datalen; j++) {
				if (vertical_chart) {
					if (axisScale == "linear") {
						point = [xyDataPub[j].xy.x, -j];
						markers.data.push(point);
					} else {
						point = [xyDataPub[j].xy.scaledX, -j];
						markers.data.push(point);
					}
				} else {
					if (axisScale == "linear") {
						point = [j, xyDataPub[j].xy.x];
					} else {
						point = [j, xyDataPub[j].xy.scaledX];
					}
				}
				//SimileAjax.Debug.log("ASDF: "+point);
				d1.push(point);
			}
			var numtick = function(horizontal_bars, axis, data) {
				if ((horizontal_bars && axis == "y") || (!horizontal_bars && axis == "x")) {
					return d1.length;
				} else {
					return Math.min(5, xyDataPub.length);
				}
			}
			/*var scalefn = function(horizontal_bars, axis){
			 if ((horizontal_bars&&axis=="x")||(!horizontal_bars&&axis=="y")){
			 SimileAjax.Debug.log("AAAAA: "+axisScale);
			 return axisScale;
			 }
			 else {
			 return "linear"
			 }
			 }
			 var tickfn = function(n, axis){
			 if ((horizontal_bars&&axis=="y")||(!horizontal_bars&&axis=="x")){
			 return xyDataPub[eval(n)].items;
			 }
			 else{
			 return n;
			 }
			 }*/

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
			vertical_chart == true ? ( xMin = xAxisMin, yMin = null, xAxislabel = settings.xLabel, yAxislabel = settings.yLabel) : ( xMin = null, yMin = xAxisMin, xAxislabel = settings.yLabel, yAxislabel = settings.xLabel);
			if (d1.length < 25) {
				label2 = "";
			} else {
				if (vertical_chart) {
					label2 = {
						data : d1,
						xaxis : 2
					};
				} else {
					label2 = {
						data : d1,
						yaxis : 2
					};
				}
			}
			//console.log("x: "+ xAxislabel + ", y: " + yAxislabel);
			/*var hitEvt;
			(function() {
				//SimileAjax.jQuery(container).click(function(clkEvt){
				console.log("click click");
				Flotr.addPlugin('clickHit', {
					callbacks : {
						'flotr:hit' : function(e) {
							//making the x,y coords from e accessible
							hitEvt = e;
						}
					}
				});
			})();

			$(container).click(function(e) {
				var disX = Math.abs(e.pageX - hitEvt.absX);
				var disY = Math.abs(e.pageY - hitEvt.absY);
				var distance = Math.sqrt(disX * disX + disY * disY);

				console.log(distance);
				if (distance < 20) {
					//var key = hitEvt.x + "," + hitEvt.y;
					var items = xyDataPub[hitEvt.index].items;
					Exhibit.ViewUtilities.openBubbleWithCoords(e.pageX, e.pageY, items, self.getUIContext());
				}
			});*/
			
			
			//var accessClosest;
			(function(Flotr) {
				console.log(Flotr);
				Flotr.addPlugin('clickHit', {
					callbacks : {
						'flotr:click' : function(e) {
							
							this.clickHit.clickHit(e);
						}
					},

					clickHit : function(mouse) {
						//console.log(mouse);
						var closest = this.clickHit.closest(mouse);
						accessClosest = closest;
						console.log(closest);
					},
					

					closest : function(mouse) {

						var series = this.series, options = this.options, mouseX = mouse.x, mouseY = mouse.y, compare = Number.MAX_VALUE, compareX = Number.MAX_VALUE, compareY = Number.MAX_VALUE, closest = {}, closestX = {}, closestY = {}, check = false, serie, data, distance, distanceX, distanceY, x, y, i, j,within_bar;
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

								if (x === null || y === null)
									continue;

								distanceX = Math.abs(x - mouseX);
								distanceY = Math.abs(y - mouseY);

								// Skip square root for speed
								distance = distanceX * distanceX + distanceY * distanceY;

								if (distance < compare) {
									compare = distance;
									setClosest(closest);
								}

								if (distanceX < compareX && vertical_chart == false) {
									compareX = distanceX;
									setClosest(closestX);
									(mouseY>=0 && mouseY-y<.04*xAxisMax)? within_bar = true : within_bar = false;
								}
								if (distanceY < compareY && vertical_chart == true) {
									compareY = distanceY;
									setClosest(closestY);
									(mouseX>=0 && mouseX-x<.04*xAxisMax)? within_bar = true : within_bar = false;
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
			})(Flotr)
			
			//pop is a boolean which tells you whether the PopUp is open or not
			// initialize it as false since there are no popUps at the beginning
			var pop = false;
			
			$(container).click(function(e) {
				console.log("access", accessClosest);
				// if there's popUp
				//close the existing popUp if the user has clicked outside the popUp
				if (pop) {
					console.log("a popUP exists, we need to close it")
					if (!$(e.target).closest('.simileAjax-bubble-container *').length) {
						pop = false;
						$('.simileAjax-bubble-container').hide();
					};
				}
				
				//if there is no popup, open the popUp
				if (!pop) {
					
					if ($(e.target).closest(container).length){
						console.log("hit inside the container");
						if (!vertical_chart){
							var items = xyDataPub[accessClosest.x.dataIndex].items;
						}
						else{
							var items = xyDataPub[accessClosest.y.dataIndex].items;
						}
						pop = true;
						Exhibit.ViewUtilities.openBubbleWithCoords(e.pageX, e.pageY, items, self.getUIContext());
					}
				
				}
			});


			Flotr.draw(container, [d1, markers, label2], {
				HtmlText : false,
				bars : {
					show : true,
					horizontal : vertical_chart,
					shadowSize : 0,
					fillColor : ["#00A8F0", "#00A8F0"],
					barWidth : .8 //keep at <= 1.0 for the bars to display properly.
				},
				mouse : {
					track : true,
					relative : true
					//trackY: true,
					//trackAll: true
				},
				xaxis : {
					min : xMin,
					labelsAngle : 45,
					noTicks : numtick(vertical_chart, "x", xyDataPub),
					//autoscale: true,
					title : xAxislabel,
					//tickformatter: function(n){},
					//tickFormatter: tickfn(n, "x"),
					tickFormatter : function(n) {
						var b = parseFloat(n);
						if (!vertical_chart) {
							try {
								return xyDataPub[b].items;
							} catch(e) {
								return "";
							}
						} else {
							if (axisScale == "logarithmic" || axisScale == "log") {
								return "10^" + n;
							}
							return n;
						}
					}
				},
				yaxis : {
					//max: xAxisMax*1.1,
					min : yMin,
					noTicks : numtick(vertical_chart, "y", xyDataPub),
					title : yAxislabel,
					//tickformatter: function(n){},
					//tickFormatter: tickfn(n, "y"),
					tickFormatter : function(n) {
						//SimileAjax.Debug.log(xyDataPub);
						var a = -parseFloat(n);
						if (vertical_chart) {
							try {
								//SimileAjax.Debug.log(xyDataPub[a].items);
								return xyDataPub[a].items;
							} catch(e) {
								return "";
							}
						} else {
							if (axisScale == "logarithmic" || axisScale == "log") {
								return "10^" + n;
							}
							return n;
						}
					}
				},
				x2axis : {
					min : xMin,
					labelsAngle : 45,
					noTicks : numtick(vertical_chart, "x", xyDataPub),
					tickFormatter : function(n) {
						var b = parseFloat(n);
						if (!vertical_chart) {
							try {
								return xyDataPub[b].items;
							} catch(e) {
								return "";
							}
						} else {
							if (axisScale == "logarithmic" || axisScale == "log") {
								return "10^" + n;
							}
							return n;
						}
					}
				},
				y2axis : {
					min : yMin,
					noTicks : numtick(vertical_chart, "y", xyDataPub),
					tickFormatter : function(n) {
						var a = -parseFloat(n);
						if (vertical_chart) {
							try {
								return xyDataPub[a].items;
							} catch(e) {
								return "";
							}
						} else {
							if (axisScale == "logarithmic" || axisScale == "log") {
								return "10^" + n;
							}
							return n;
						}
					}
				}
			});
		})(document.getElementById("editor-render-0"));
		//SimileAjax.Debug.log(xyToData);
		/*var addBarAtLocation = function(xyData) {
		var items = xyData.items;

		var color = settings.color;
		if (hasColorKey) {
		color = self._colorCoder.translateSet(xyData.colorKeys, colorCodingFlags);
		}

		var xy = xyData.xy;
		//*******

		var thelabel = document.createElement("div") ;
		var thetext= document.createTextNode(xy.y);
		thelabel.appendChild(thetext);
		thelabel.style.height="1.5em";
		labelpart.appendChild(thelabel);

		var bardiv = document.createElement("div") ;
		bardiv.style.position="relative";
		bardiv.style.height="1.5em";
		bardiv.style.zIndex="2";
		var bar= document.createElement("div");
		bar.className = "exhibit-barChartView-bar";
		bar.style.backgroundColor=color;
		bar.style.textAlign="right";
		bar.style.left="0";

		var barwidth = Math.floor(100*(scaleX(xy.x) - xAxisMin)/(xAxisMax-xAxisMin));
		bar.style.width= barwidth + "%";
		bar.style.borderStyle="solid";
		bar.style.borderWidth="1px";
		bar.style.paddingLeft="0px";
		var thetext= document.createTextNode(xy.x);
		bar.appendChild(thetext);
		bardiv.appendChild(bar);
		canvasDiv.appendChild(bardiv);
		SimileAjax.WindowManager.registerEvent(bar, "click",
		function(elmt, evt, target) { self._openPopup(bar, items); });
		SimileAjax.WindowManager.registerEvent(thelabel, "click",
		function(elmt, evt, target) { self._openPopup(thelabel, items); });*/

		//*******

		/*            var marker = Exhibit.BarChartView._makePoint(
		color,
		Math.floor((xy.scaledX - xAxisMin) * xScale),
		Math.floor((xy.scaledY - yAxisMin) * yScale),
		xyData.items + ": " +
		settings.xLabel + " = " + xy.x + ", " +
		settings.yLabel + " = " + xy.y
		);

		SimileAjax.WindowManager.registerEvent(marker, "click",
		function(elmt, evt, target) { self._openPopup(marker, items); });

		canvasDiv.appendChild(marker);
		*/
		//}

		/*leftCol.style.width="1px";
		theTable.style.tableLayout="auto";

		var xAxisDiv = document.createElement("div");
		xAxisDiv.className = "exhibit-barChartView-xAxis";
		//        xAxisDiv.style.clear="left";
		//        this._dom.plotContainer.appendChild(xAxisDiv);

		var xAxisDivInner = document.createElement("div");
		xAxisDivInner.style.position = "relative";
		xAxisDivInner.style.left = 0;
		xAxisDiv.appendChild(xAxisDivInner);

		var canvasWidth = canvasDiv.offsetWidth;
		var canvasHeight = canvasDiv.offsetHeight;
		var xScale = canvasWidth / (xAxisMax - xAxisMin);
		//        var yScale = canvasHeight / (yAxisMax - yAxisMin);

		canvasDiv.style.display = "none";*/

		/*
		*  Construct plot's grid lines and axis labels
		*/
		/*var makeMakeLabel = function(interval, unscale) {
		// Intelligently deal with non-linear scales
		if (interval >= 1000000) {
		return function (n) { return Math.floor(unscale(n) / 1000000) + "M"; };
		} else if (interval >= 1000) {
		return function (n) { return Math.floor(unscale(n) / 1000) + "K"; };
		} else {
		return function (n) { return unscale(n); };
		}
		};
		var makeLabelX = makeMakeLabel(xInterval, unscaleX);*/
		//        var makeLabelY = makeMakeLabel(yInterval, unscaleY);

		/*for (var x = xAxisMin + xInterval; x < xAxisMax; x += xInterval) {
		var left = Math.floor((x - xAxisMin) * xScale);

		var div = document.createElement("div");
		div.className = "exhibit-barChartView-gridLine";
		div.style.width = "1px";
		div.style.left = left + "px";
		div.style.top = "0px";
		div.style.height = "100%";
		div.style.zIndex = "1";
		canvasDiv.appendChild(div);

		var labelDiv = document.createElement("div");
		labelDiv.className = "exhibit-barChartView-xAxisLabel";
		labelDiv.style.left = left + "px";
		labelDiv.innerHTML = makeLabelX(x);
		xAxisDivInner.appendChild(labelDiv);
		}*/
		//var xNameDiv = document.createElement("div");
		/*xNameDiv.className = "exhibit-barChartView-xAxisName";
		 xNameDiv.innerHTML = "FAIL";*/

		/*xAxisDivInner.appendChild(xNameDiv);
		 barpart.appendChild(xAxisDiv);

		 canvasDiv.style.display = "block";*/
		if (hasColorKey) {
			var legendWidget = this._dom.legendWidget;
			var colorCoder = this._colorCoder;
			var keys = colorCodingFlags.keys.toArray().sort();
			if (this._colorCoder._gradientPoints != null) {
				legendWidget.addGradient(this._colorCoder._gradientPoints);
			} else {
				for (var k = 0; k < keys.length; k++) {
					var key = keys[k];
					var color = colorCoder.translate(key);
					legendWidget.addEntry(color, key);
				}
			}
			if (colorCodingFlags.others) {
				legendWidget.addEntry(colorCoder.getOthersColor(), colorCoder.getOthersLabel());
			}
			if (colorCodingFlags.mixed) {
				legendWidget.addEntry(colorCoder.getMixedColor(), colorCoder.getMixedLabel());
			}
			if (colorCodingFlags.missing) {
				legendWidget.addEntry(colorCoder.getMissingColor(), colorCoder.getMissingLabel());
			}
		}
	}
	this._dom.setUnplottableMessage(currentSize, unplottableItems);
};

