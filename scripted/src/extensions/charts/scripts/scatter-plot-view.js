/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:karger@mit.edu">David Karger</a>
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 * @author Baiaboo Rai
 * @Library in use : Flotr2
 */

/**
 * @class
 * @constructor
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 */
Exhibit.ScatterPlotView = function(containerElmt, uiContext) {
    var view = this;
    $.extend(this, new Exhibit.View("scatter", containerElmt, uiContext));
    this.addSettingSpecs(Exhibit.ScatterPlotView._settingSpecs);

    this._accessors = {
        "getPointLabel" : function(itemID, database, visitor) {
            visitor(database.getObject(itemID, "label"));
        },
        "getProxy" : function(itemID, database, visitor) {
            visitor(itemID);
        },
        "getColorKey" : null
    };

    // Function maps that allow for other axis scales (logarithmic, etc.), defaults to identity/linear
    this._axisFuncs = {
        x : function(x) {
            return x;
        },
        y : function(y) {
            return y;
        }
    };
    this._axisInverseFuncs = {
        x : function(x) {
            return x;
        },
        y : function(y) {
            return y;
        }
    };

    this._colorCoder = null;
    this._colorKeyCache = new Object();
    this._maxColor = 0;

    this._onItemsChanged = function() {
        view._reconstruct();
    };

    $(uiContext.getCollection().getElement()).bind("onItemsChanged.exhibit", view._onItemsChanged);

    this.register();
};

/**
 * @constant
 */
Exhibit.ScatterPlotView._settingSpecs = {
    "plotHeight" : {
        type : "int",
        defaultValue : 400
    },
    "plotWidth" : {
        type : "int",
        defaultValue : 689
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
        choices : ["linear", "log"]
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
        choices : ["linear", "log"]
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
        defaultValue : "#0000aa"
    },
    "colorCoder" : {
        type : "text",
        defaultValue : null
    },
    "legendPosition" : {
        type:"enum",
        defaultValue :'nw',
        choices: ['nw','ne','sw','se']
    }
};

/**
 * @constant 
 */
Exhibit.ScatterPlotView._accessorSpecs = [{
    "accessorName" : "getProxy",
    "attributeName" : "proxy"
}, {
    "accessorName" : "getPointLabel",
    "attributeName" : "pointLabel"
}, {
    "accessorName" : "getXY",
    "alternatives" : [{
        "bindings" : [{
            "attributeName" : "xy",
            "types" : ["float", "float"],
            "bindingNames" : ["x", "y"]
        }]
    }, {
        "bindings" : [{
            "attributeName" : "x",
            "type" : "float",
            "bindingName" : "x"
        }, {
            "attributeName" : "y",
            "type" : "float",
            "bindingName" : "y"
        }]
    }]
}, {
    "accessorName" : "getColorKey",
    "attributeName" : "colorKey",
    "type" : "text"
}];


/**
 * @param {Object} configuration
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.MapView}
 */
Exhibit.ScatterPlotView.create = function(configuration, containerElmt, uiContext) {
    var view = new Exhibit.ScatterPlotView(containerElmt, Exhibit.UIContext.create(configuration, uiContext));
    Exhibit.ScatterPlotView._configure(view, configuration);

    view._internalValidate();
    view._initializeUI();
    return view;
};

/**
 * @param {Element} configElmt
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.MapView}
 */
Exhibit.ScatterPlotView.createFromDOM = function(configElmt, containerElmt, uiContext) {
    var configuration = Exhibit.getConfigurationFromDOM(configElmt);
    var view = new Exhibit.ScatterPlotView(containerElmt != null ? containerElmt : configElmt, Exhibit.UIContext.createFromDOM(configElmt, uiContext));

    Exhibit.SettingsUtilities.createAccessorsFromDOM(configElmt, Exhibit.ScatterPlotView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettingsFromDOM(configElmt, view.getSettingSpecs(), view._settings);
    Exhibit.ScatterPlotView._configure(view, configuration);

    view._internalValidate();
    view._initializeUI();
    return view;
};

/**
 * @static
 * @param {Exhibit.MapView} view
 * @param {Object} configuration
 */
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

/**
 * Convenience function that maps strings to respective functions 
 * @private
 * @param {String} s 
 * @returns {Function}
 */
Exhibit.ScatterPlotView._getAxisFunc = function(s) {
    if (s == "log") {
        return function(x) {
            return (Math.log(x) / Math.log(10.0));
        };
    } else {
        return function(x) {
            return x;
        };
    }
}

/**
 * Convenience function that maps strings to respective functions 
 * @private
 * @param {String} s 
 * @returns {Function}
 */
Exhibit.ScatterPlotView._getAxisInverseFunc = function(s) {
    if (s == "log") {
        return function(x) {
            return Math.pow(10, x);
        };
    } else {
        return function(x) {
            return x;
        };
    };
}

/**
 * 
 */
Exhibit.ScatterPlotView.prototype.dispose = function() {
    $(this.getUIContext().getCollection().getElement()).unbind("onItemsChanged.exhibit", this._onItemsChanged);

    this._dom.dispose();
    this._dom = null;

    this._dispose();
};

/**
 * 
 */
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

/**
 * 
 */
Exhibit.ScatterPlotView.prototype._initializeUI = function() {
    var self = this;
    var legendWidgetSettings = "_gradientPoints" in this._colorCoder ? "gradient" : {}

    this._dom = Exhibit.ViewUtilities.constructPlottingViewDom(this.getContainer(), this.getUIContext(), true, // showSummary
    {
        "onResize" : function() {
            self._reconstruct();
        }
    }, legendWidgetSettings);
    this._dom.plotContainer.className = "exhibit-scatterPlotView-plotContainer";
    this._dom.plotContainer.style.height = this._settings.plotHeight + "px";
    this._dom.plotContainer.style.width = this._settings.plotWidth + "px";
    self._initializeViewUI();
    this._reconstruct();
};

/**
 * 
 */
Exhibit.ScatterPlotView.prototype._reconstruct = function() {
    var self, collection, database, settings, accessors, colorCoder, colorCodingFlags, hasColorKey, currentSize, prepareData, unplottableItems;
    var xyToData, dataToPlot;

    self = this;
    collection = this.getUIContext().getCollection();
    database = this.getUIContext().getDatabase();
    settings = this._settings;
    accessors = this._accessors;
    colorCoder = this._colorCoder;
    colorCodingFlags = {
        mixed : false,
        missing : false,
        others : false,
        keys : new Exhibit.Set()
    };
    hasColorKey = (this._accessors.getColorKey != null);
    currentSize = collection.countRestrictedItems();
    xyToData = {}; //dictionary that maps xy coord to data id. useful for popUp
    dataToPlot = {}; //data that will be passed to the scatterplot constructor
    unplottableItems = [];

    this._dom.plotContainer.innerHTML = "";

    prepareData = function() {
        var scaleX, scaleY, unscaleX, unscaleY, currentSet, xAxisMin, yAxisMin, xAxisMax, yAxisMax, i, xys, colorKeys, color;
        scaleX = self._axisFuncs.x;
        scaleY = self._axisFuncs.y;
        currentSet = collection.getRestrictedItems();
        xAxisMin = settings.xAxisMin;
        xAxisMax = settings.xAxisMax;
        yAxisMin = settings.yAxisMin;
        yAxisMax = settings.yAxisMax;

        /*
         *  Iterate through all items, collecting min and max on both axes
         *  get all the x,y coordinates in dataToPlot list that will be passed to jit Constructor
         */

        color = settings.color;
        currentSet.visit(function(itemID) {
            xys = [];

            self._getXY(itemID, database, function(xy) {
                if (itemID == "China"){
                    console.log(xy, xy);
                }
                if ("x" in xy && "y" in xy) {
                    xys.push(xy);
                }
            });
            

            if (xys.length > 0) {
                colorKeys = null;

                if (hasColorKey) {
                    colorKeys = new Exhibit.Set();
                    accessors.getColorKey(itemID, database, function(v) {
                        colorKeys.add(v);
                    });
                    color = colorCoder.translateSet(colorKeys, colorCodingFlags);
                }

                for (var i = 0; i < xys.length; i++) {
                    var xy = xys[i];

                    try {
                        xy.scaledX = scaleX(xy.x);
                        xy.scaledY = scaleY(xy.y);
                        if (!isFinite(xy.scaledX) || !isFinite(xy.scaledY)) {
                            continue;
                        }
                    } catch (e) {
                        continue;
                        // ignore the point since we can't scale it, e.g., log(0)
                    }
                    var xyKey = xy.scaledX + "," + xy.scaledY;
                    var xyData = {
                        xy : xy,
                        items : [itemID]
                    };
                    xyToData[xyKey] = xyData;

                    if (!( color in dataToPlot)) {
                        dataToPlot[color] = [];
                    }

                    dataToPlot[color].push([xy.scaledX, xy.scaledY])

                    xAxisMin = Math.min(xAxisMin, xy.scaledX);
                    xAxisMax = Math.max(xAxisMax, xy.scaledX);
                    yAxisMin = Math.min(yAxisMin, xy.scaledY);
                    yAxisMax = Math.max(yAxisMax, xy.scaledY);
                }
            } else {
                unplottableItems.push(itemID);
            }
        });
        
        /*
         * finalize min/max for both axis
         */
        var xDiff, yDiff, xInterval, yInterval;
        
        xDiff = xAxisMax - xAxisMin;
        yDiff = yAxisMax - yAxisMin;
        xInterval = 1;
        yInterval = 1;
        
        if (xDiff > 1) {
            while (xInterval * 20 < xDiff) { 
                xInterval *= 10;
            }
        } else {
            while (xInterval < xDiff * 20) {
                xInterval /= 10;
            }
        }
        
        if (yDiff > 1) {
            while (yInterval * 20 < yDiff) {
                yInterval *= 10;
            }
        } else {
            while (yInterval < yDiff * 20) {
                yInterval /= 10;
            }
        }
        
        settings.xAxisMin = Math.floor(xAxisMin / xInterval) * xInterval;
        settings.xAxisMax = Math.ceil(xAxisMax / xInterval) * xInterval;
        settings.yAxisMin = Math.floor(yAxisMin / yInterval) * yInterval;
        settings.yAxisMax = Math.ceil(yAxisMax / yInterval) * yInterval;

    }
    
    createLegend = function() {
        var legendWidget, keys, key, color;
        
        if (hasColorKey) {
            legendWidget = self._dom.legendWidget;
            colorCoder = self._colorCoder;
            keys = colorCodingFlags.keys.toArray().sort();

            if (self._colorCoder._gradientPoints != null) {
                legendWidget.addGradient(this._colorCoder._gradientPoints);
            } else {
                for (var k = 0; k < keys.length; k++) {
                    key = keys[k];
                    color = colorCoder.translate(key);
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
    
    if (currentSize > 0) {
        var flotr, legendLabels, scatterDiv;
        
        flotr = Flotr; // pass the same Flotr instance to clickHandler and createFlotrScatter functions
        legendLabels = colorCodingFlags.keys.toArray();
        scatterDiv = this._dom.plotContainer;
        
        prepareData();
        this._clickHandler(flotr, scatterDiv, xyToData);
        this._createFlotrScatter(flotr,scatterDiv, dataToPlot, xyToData, legendLabels);
        
        //createLegend();
    }

    this._dom.setUnplottableMessage(currentSize, unplottableItems);
}

/** 
 * @private
 * @param {Object} xyToData
 */
Exhibit.ScatterPlotView.prototype._clickHandler = function(flotr, container, xyToData) {
    var self, hitEvt, popupPresent;
    self = this;
    hitEvt = null;  
    popupPresent = false;

    //capturing the last hit event
    flotr.addPlugin('clickHit', {
        callbacks : {
            'flotr:hit' : function(e) {
                hitEvt = e;
            }
        }
    });

    $("body").click( function(e) {
        console.log("click in scatter");
        var disX, disY, key, items;
        
        //close the existing popUp if the user has clicked outside the popUp
        if (popupPresent) {
            if (!$(e.target).closest('.simileAjax-bubble-contentContainer.simileAjax-bubble-contentContainer-pngTranslucent').length) {
                popupPresent = false;
                $('.simileAjax-bubble-container').hide();
            };
        }

        if (!popupPresent) {
            disX = Math.abs(e.pageX - hitEvt.absX);
            disY = Math.abs(e.pageY - hitEvt.absY);
            distance = Math.sqrt(disX * disX + disY * disY);

            if (distance < 10) {
                key = hitEvt.x + "," + hitEvt.y;
                items = xyToData[key].items;
                popupPresent = true;
                Exhibit.ViewUtilities.openBubbleWithCoords(e.pageX, e.pageY, items, self.getUIContext());
            }
        }
    });
}

/**
 * @private 
 * @param {Object} container
 * @param {Object} dataToPlot
 * @param {Object} xyToData
 * @param {Object} legendLabels
 */
Exhibit.ScatterPlotView.prototype._createFlotrScatter = function(flotr, container, dataToPlot, xyToData, legendLabels) {
    var self, settings, dataList, i;
    self = this;
    settings = this._settings;
    dataList = [];
    unscaleX = self._axisInverseFuncs.x;
    unscaleY = self._axisInverseFuncs.y;
    
    i = 0;
    for (key in dataToPlot) {
        dataList.push({
            data : dataToPlot[key],
            label : legendLabels[i],
            points : {
                show : true
            },
            lines : {
                show : false
            },
            color : key
        });
        i++
    }
    this._track = null; 
        var trackFn, x, y, key, id, graph, r;
        
        //shows the data info when the point is hovered over
        trackFn = function(o) {
            x = o.x;
            y = o.y;
            console.log(x,y);

            key = x + "," + y;
            if ( key in xyToData) {
                id = xyToData[key].items[0];
            }

            x = Math.round(unscaleX(x));
            y = Math.round(unscaleY(y));
            return id + ": " + settings.xLabel + ' = ' + x + ', ' + settings.yLabel + ' = ' + y;
        }
        // Draw the graph
        graph = flotr.draw(container,
             dataList,
            {
                //colors : colorList,
                xaxis : {
                    title : settings.xLabel,
                    //ticks : xAxis,
                    min : settings.xAxisMin, // Part of the series is not displayed.
                    max : settings.xAxisMax // Part of the series is not displayed.
                },
                yaxis : {
                    title : settings.yLabel,
                    //ticks : yAxis,            // Set Y-Axis ticks
                    min : settings.yAxisMin,
                    max : settings.yAxisMax // Maximum value along Y-Axis
                },
                grid : {
                    backgroundColor : {
                        colors : [[0, '#fff'], [1, '#eee']],
                        start : 'top',
                        end : 'bottom'
                    }
                },
                mouse : {
                    track : true,
                    sensibility : 3,
                    relative : true,
                    position : 'ne',
                    trackFormatter : trackFn
                },
                legend : {
                    position : settings.legendPosition
                }
        });

};

