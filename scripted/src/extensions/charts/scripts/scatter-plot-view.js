/*==================================================
 *  Exhibit.ScatterPlotView
 *==================================================
 */
Exhibit.ScatterPlotView = function(containerElmt, uiContext) {
	var view = this;
	$.extend(this, new Exhibit.View(
		"scatter",
		containerElmt,
		uiContext
	));
	this.addSettingSpecs(Exhibit.ScatterPlotView._settingSpecs);
	
	this._accessors = {
        "getPointLabel":  function(itemID, database, visitor) { visitor(database.getObject(itemID, "label")); },
        "getProxy":       function(itemID, database, visitor) { visitor(itemID); },
        "getColorKey":    null
    };
    
    // Function maps that allow for other axis scales (logarithmic, etc.), defaults to identity/linear
    this._axisFuncs = { x: function (x) { return x; }, y: function (y) { return y; } };
    this._axisInverseFuncs = { x: function (x) { return x; }, y: function (y) { return y; } };

    this._colorKeyCache = new Object();
    this._maxColor = 0;
    
    this._onItemsChanged = function(){
    	view._reconstruct(); 
    };
    
    $(uiContext.getCollection().getElement()).bind(
    	"onItemsChanged.exhibit",
    	view._onItemsChanged
    );
    
    this.register();
};

Exhibit.ScatterPlotView._settingSpecs = {
    "plotHeight":   { type: "int",   defaultValue: 400 },
    "bubbleWidth":  { type: "int",   defaultValue: 400 },
    "bubbleHeight": { type: "int",   defaultValue: 300 },
    "xAxisMin":     { type: "float", defaultValue: Number.POSITIVE_INFINITY },
    "xAxisMax":     { type: "float", defaultValue: Number.NEGATIVE_INFINITY },
    "xAxisType":    { type: "enum",  defaultValue: "linear", choices: [ "linear", "log" ] },
    "yAxisMin":     { type: "float", defaultValue: Number.POSITIVE_INFINITY },
    "yAxisMax":     { type: "float", defaultValue: Number.NEGATIVE_INFINITY },
    "yAxisType":    { type: "enum",  defaultValue: "linear", choices: [ "linear", "log" ] },
    "xLabel":       { type: "text",  defaultValue: "x" },
    "yLabel":       { type: "text",  defaultValue: "y" },
    "color":        { type: "text",  defaultValue: "#0000aa" },
    "colorCoder":   { type: "text",  defaultValue: null }
};

Exhibit.ScatterPlotView._accessorSpecs = [
    {   "accessorName":   "getProxy",
        "attributeName":  "proxy"
    },
    {   "accessorName":   "getPointLabel",
        "attributeName":  "pointLabel"
    },
    {   "accessorName": "getXY",
        "alternatives": [
            {   "bindings": [
                    {   "attributeName":  "xy",
                        "types":          [ "float", "float" ],
                        "bindingNames":   [ "x", "y" ]
                    }
                ]
            },
            {   "bindings": [
                    {   "attributeName":  "x",
                        "type":           "float",
                        "bindingName":    "x"
                    },
                    {   "attributeName":  "y",
                        "type":           "float",
                        "bindingName":    "y"
                    }
                ]
            }
        ]
    },
    {   "accessorName":   "getColorKey",
        "attributeName":  "colorKey",
        "type":           "text"
    }
];

Exhibit.ScatterPlotView.create = function(configuration, containerElmt, uiContext) {
    var view = new Exhibit.ScatterPlotView(
        containerElmt,
        Exhibit.UIContext.create(configuration, uiContext)
    );
    Exhibit.ScatterPlotView._configure(view, configuration);
    
    view._internalValidate();
    view._initializeUI();
    return view;
};

Exhibit.ScatterPlotView.createFromDOM = function(configElmt, containerElmt, uiContext) {
    var configuration = Exhibit.getConfigurationFromDOM(configElmt);
    var view = new Exhibit.ScatterPlotView(
        containerElmt != null ? containerElmt : configElmt, 
        Exhibit.UIContext.createFromDOM(configElmt, uiContext)
    );

    Exhibit.SettingsUtilities.createAccessorsFromDOM(configElmt, Exhibit.ScatterPlotView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettingsFromDOM(configElmt, view.getSettingSpecs(), view._settings);
    Exhibit.ScatterPlotView._configure(view, configuration);
    
    view._internalValidate();
    view._initializeUI();
    return view;
};

Exhibit.ScatterPlotView._configure = function(view, configuration) {
    Exhibit.SettingsUtilities.createAccessors(configuration, Exhibit.ScatterPlotView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettings(configuration, view.getSettingSpecs(), view._settings);

    view._axisFuncs.x = Exhibit.ScatterPlotView._getAxisFunc(view._settings.xAxisType);
    view._axisInverseFuncs.x = Exhibit.ScatterPlotView._getAxisInverseFunc(view._settings.xAxisType);
    
    view._axisFuncs.y = Exhibit.ScatterPlotView._getAxisFunc(view._settings.yAxisType);
    view._axisInverseFuncs.y = Exhibit.ScatterPlotView._getAxisInverseFunc(view._settings.yAxisType);
    
    var accessors = view._accessors;
    view._getXY = function(itemID, database, visitor) {
        accessors.getProxy(itemID, database, function(proxy) {
            accessors.getXY(proxy, database, visitor);
        });
    };
};

// Convenience function that maps strings to respective functions
Exhibit.ScatterPlotView._getAxisFunc = function(s) {
    if (s == "log") {
        return function (x) { return (Math.log(x) / Math.log(10.0)); };
    } else {
        return function (x) { return x; };
    }
}

// Convenience function that maps strings to respective functions
Exhibit.ScatterPlotView._getAxisInverseFunc = function(s) {
    if (s == "log") {
        return function (x) { return Math.pow(10, x); };
    } else {
        return function (x) { return x; };
    };
}


Exhibit.ScatterPlotView._colors = [
    "FF9000",
    "5D7CBA",
    "A97838",
    "8B9BBA",
    "FFC77F",
    "003EBA",
    "29447B",
    "543C1C"
];
Exhibit.ScatterPlotView._mixColor = "FFFFFF";

Exhibit.ScatterPlotView.evaluateSingle = function(expression, itemID, database) {
    return expression.evaluateSingleOnItem(itemID, database).value;
}

//Note:come back to this later and remove the redundant objects
Exhibit.ScatterPlotView.prototype.dispose = function() {
	$(this.getUIContext().getCollection().getElement()).unbind(
		"onItemsChanged.exhibit",
		this._onItemsChanged
	);
	
    
    this._dom.dispose();
    this._dom = null;
    
    this._dispose();
};

Exhibit.ScatterPlotView.prototype._internalValidate = function() {
    if ("getColorKey" in this._accessors) {
        if ("colorCoder" in this._settings) {
            this._colorCoder = this.getUIContext().getMain().getComponent(this._settings.colorCoder);
        }
        
        if (this._colorCoder == null) {
            this._colorCoder = new Exhibit.DefaultColorCoder(this.getUIContext());
        }
    }
};

Exhibit.ScatterPlotView.prototype._initializeUI = function() {
    var self = this;
	var legendWidgetSettings="_gradientPoints" in this._colorCoder ? "gradient" : {}

    this._dom = Exhibit.ViewUtilities.constructPlottingViewDom(
        this.getContainer(), 
        this.getUIContext(), 
        true, // showSummary
        {   "onResize": function() { 
                self._reconstruct();
            } 
        }, 
        legendWidgetSettings
    );
    this._dom.plotContainer.className = "exhibit-scatterPlotView-plotContainer";
    this._dom.plotContainer.style.height = this._settings.plotHeight + "px";
    
    self._initializeViewUI();
    this._reconstruct();
};

Exhibit.ScatterPlotView.prototype._reconstruct = function() {
    var self = this;
    var collection = this.getUIContext().getCollection();
    var database = this.getUIContext().getDatabase();
    var settings = this._settings;
    var accessors = this._accessors;
    
    this._dom.plotContainer.innerHTML = "";
    
    var scaleX = self._axisFuncs.x;
    var scaleY = self._axisFuncs.y;
    var unscaleX = self._axisInverseFuncs.x;
    var unscaleY = self._axisInverseFuncs.y;
    
    var currentSize = collection.countRestrictedItems();
    var unplottableItems = [];
    
    this._dom.legendWidget.clear();
    if (currentSize > 0) {
        var currentSet = collection.getRestrictedItems();
        var hasColorKey = (this._accessors.getColorKey != null);
        
        var xyToData = {};
        var xAxisMin = settings.xAxisMin;
        var xAxisMax = settings.xAxisMax;
        var yAxisMin = settings.yAxisMin;
        var yAxisMax = settings.yAxisMax;
        
        /*
         *  Iterate through all items, collecting min and max on both axes
         */
        var i =0;
        currentSet.visit(function(itemID) {
            var xys = [];
            
            /*
             * Note: xy = ['x','y'] where x is birthrate and y is deathrate
             * 
             */
          
            self._getXY(itemID, database, function(xy) { if ("x" in xy && "y" in xy) xys.push(xy); });
            //SimileAjax.Debug.log(SimileAjax.Debug.objectToString(xys));
            if (xys.length > 0) {
                var colorKeys = null;
                if (hasColorKey) {
                    colorKeys = new Exhibit.Set();
                    accessors.getColorKey(itemID, database, function(v) { colorKeys.add(v); });
                }
                
                for (var i = 0; i < xys.length; i++) {
                    var xy = xys[i];
                    var xyKey = xy.x + "," + xy.y;
                    if (xyKey in xyToData) {
                        var xyData = xyToData[xyKey];
                        xyData.items.push(itemID);
                        if (hasColorKey) {
                            xyData.colorKeys.addSet(colorKeys);
                        }
                    } else {
                        try {
                            xy.scaledX = scaleX(xy.x);
                            xy.scaledY = scaleY(xy.y);
                            if (!isFinite(xy.scaledX) || !isFinite(xy.scaledY)) {
                                continue;
                            }
                        } catch (e) {
                            continue; // ignore the point since we can't scale it, e.g., log(0)
                        }
                        
                        var xyData = {
                            xy:         xy,
                            items:      [ itemID ]
                        };
                        if (hasColorKey) {
                            xyData.colorKeys = colorKeys;
                        }
                        xyToData[xyKey] = xyData;
                        
                        xAxisMin = Math.min(xAxisMin, xy.scaledX);
                        xAxisMax = Math.max(xAxisMax, xy.scaledX);
                        yAxisMin = Math.min(yAxisMin, xy.scaledY);
                        yAxisMax = Math.max(yAxisMax, xy.scaledY);
                    }
                }
            } else {
                unplottableItems.push(itemID);
            }
        });
        
        /*
         *  Figure out scales, mins, and maxes for both axes
         */
        var xDiff = xAxisMax - xAxisMin;
        var yDiff = yAxisMax - yAxisMin;
        
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
        //SimileAjax.Debug.log(xAxisMin+" "+xAxisMax);
        
        var yInterval = 1;
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
        
        settings.xAxisMin = xAxisMin;
        settings.xAxisMax = xAxisMax;
        settings.yAxisMin = yAxisMin;
        settings.yAxisMax = yAxisMax;
        
        /*
         *  Construct plot's frame
         */

        var xScale = 629/ (xAxisMax - xAxisMin);
        var yScale =  364/ (yAxisMax - yAxisMin);
        
        var container = document.createElement("div");
		container.className = "scatterplotViewContainer";
		container.style.height = "100%"
		this._dom.plotContainer.appendChild(container);      
		
        
         /*
         *  Calculate the points for the axis
         * @param xAxis : all the labeled points in the X-Axis
         * @param yAxis : all the labeled points in the Y-Axis
         */
        
        var makeMakeLabel = function(interval, unscale) {
            // Intelligently deal with non-linear scales
            if (interval >= 1000000) {
                return function (n) { return Math.floor(unscale(n) / 1000000) + "M"; };
            } else if (interval >= 1000) {
                return function (n) { return Math.floor(unscale(n) / 1000) + "K"; };
            } else {
                return function (n) { return unscale(n); };
            }
        };
        var makeLabelX = makeMakeLabel(xInterval, unscaleX);
        var makeLabelY = makeMakeLabel(yInterval, unscaleY);

        var xAxis = [];
        for (var x = xAxisMin + xInterval; x < xAxisMax; x += xInterval) {            
            xAxis.push(makeLabelX(x));
        }
            
        var yAxis = [];
        for (var y = yAxisMin + yInterval; y < yAxisMax; y += yInterval) {
			yAxis.push(makeLabelY(y));
        }
        
		xAxisTitle = settings.xLabel;
		yAxisTitle = settings.yLabel;
		
        
        /*
         * getting all the data points for the scatterPlot
         * @param: dataToBePlotted = list of the data points
         * 
         */
        
        var colorCodingFlags = { mixed: false, missing: false, others: false, keys: new Exhibit.Set() };
        
        var dataToBePlotted = new Array(); 
        var count = 0;

		for (xyKey in xyToData) {
			var xyData = xyToData[xyKey];

			var items = xyData.items;

			var color = settings.color;
			if (hasColorKey) {
				color = self._colorCoder.translateSet(xyData.colorKeys, colorCodingFlags);
			}

			var xy = xyData.xy;
			dataToBePlotted.push([xy.x, xy.y]);

		}

              
        /*replacing the original scatter plot with a new scatterplot*/
               	
		var hitEvt;
		(function() {
				Flotr.addPlugin('clickHit', {
				callbacks : {						
					'flotr:hit' : function(e) {
						hitEvt = e; //making the x,y coords from e accessible
						//console.log(e);
					}
				}
				});
			})();		
		

		//pop is a boolean which tells you whether the PopUp is open or not
		// initialize it as false since there are no popUps at the beginning
		var pop = false;
		
		$('body').click(function(e) {
			
			// if there's popUp
			//close the existing popUp if the user has clicked outside the popUp
			if (pop) {
				if (!$(e.target).closest('.simileAjax-bubble-container *').length) {
					console.log("yes!!");
					pop = false;
					$('.simileAjax-bubble-container').hide();
				};
			}
			
			//if there is no popup, open the popUp
			if (!pop) {
				var disX = Math.abs(e.pageX - hitEvt.absX);
				var disY = Math.abs(e.pageY - hitEvt.absY);
				var distance = Math.sqrt(disX * disX + disY * disY);

				//console.log(distance);
				if (distance < 10) {
					var key = hitEvt.x + "," + hitEvt.y;
					var items = xyToData[key].items;
					pop = true;
					Exhibit.ViewUtilities.openBubbleWithCoords(e.pageX, e.pageY, items, self.getUIContext());
				}
			}
		});

/*
		$(container).click(function(e) {

		});
*/


		
	
  		
        (function () {
        	
        	//shows the data info when the point is hovered over
        	var trackFn = function(o){
        		//to get rid of the padded 0's        		
        		var x = eval(o.x);
        		var y = eval(o.y);
        		
        		var key = x + "," + y;
        		if (key in xyToData){
        			var id = xyToData[key].items[0];
        		}
        		
        		return id + ": " + xAxisTitle + ' = ' + x +', '+ yAxisTitle + ' = ' + y;
         	}
         	
  


	   
		  // Draw the graph
		  var graph = Flotr.draw(container, 
		  	[{data: dataToBePlotted, label : "y=x", points : { show : true }, lines : {show:false}}], //bracket very imp!!
		   {
		   	colors : [color],	
			xaxis : {
				title: xAxisTitle,
		        ticks : xAxis,              
				min : xAxisMin,                  // Part of the series is not displayed.
				max : xAxisMax                 // Part of the series is not displayed.
		      }, 
			yaxis : {
		      	title: yAxisTitle,
		        ticks : yAxis,            // Set Y-Axis ticks
				min : yAxisMin,
				max : yAxisMax,              // Maximum value along Y-Axis
		      },
			grid : {
				backgroundColor : {
					colors : [[0,'#fff'], [1,'#eee']],
					start : 'top',
					end : 'bottom'
					}
				},
			mouse : {
			 	track : true,
			 	sensibility : 3,
			 	relative        : true,
			 	position        : 'ne',
			 	trackDecimals   : 2,
			 	trackFormatter  : trackFn
				}
      		});
		})(document.getElementById("editor-render-0"));

        if (hasColorKey) {
            var legendWidget = this._dom.legendWidget;
            var colorCoder = this._colorCoder;
            var keys = colorCodingFlags.keys.toArray().sort();
if(this._colorCoder._gradientPoints != null) {
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
