/*==================================================
 *  Exhibit.ScatterPlotView
 *==================================================
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

Exhibit.ScatterPlotView._settingSpecs = {
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
    }
};

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

Exhibit.ScatterPlotView.create = function(configuration, containerElmt, uiContext) {
    var view = new Exhibit.ScatterPlotView(containerElmt, Exhibit.UIContext.create(configuration, uiContext));
    Exhibit.ScatterPlotView._configure(view, configuration);

    view._internalValidate();
    view._initializeUI();
    return view;
};

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
/*
 Exhibit.ScatterPlotView._colors = [
 "FF9000",
 "5D7CBA",
 "A97838",
 "8B9BBA",
 "FFC77F",
 "003EBA",
 "29447B",
 "543C1C"
 ];*/

/*
 Exhibit.ScatterPlotView._mixColor = "FFFFFF";
 */

Exhibit.ScatterPlotView.prototype.dispose = function() {
    $(this.getUIContext().getCollection().getElement()).unbind("onItemsChanged.exhibit", this._onItemsChanged);

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
    var legendWidgetSettings = "_gradientPoints" in this._colorCoder ? "gradient" : {}

    this._dom = Exhibit.ViewUtilities.constructPlottingViewDom(this.getContainer(), this.getUIContext(), true, // showSummary
    {
        "onResize" : function() {
            self._reconstruct();
        }
    }, legendWidgetSettings);
    this._dom.plotContainer.className = "exhibit-scatterPlotView-plotContainer";
    this._dom.plotContainer.style.height = this._settings.plotHeight + "px";

    self._initializeViewUI();
    this._reconstruct();
};

Exhibit.ScatterPlotView.prototype._reconstruct = function() {
    var self, collection, database, settings, accessors, colorCoder, colorCodingFlags, hasColorKey, currentSize, prepareData, unplottableItems;
    var xyToData, xAxisMin, yAxisMin, xAxisMax, yAxisMax, dataToPlot;

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

    this._dom.plotContainer.innerHTML = "";

    prepareData = function() {
        var currentSet, unscaleX, unscaleY, scaleX, scaleY, i, xys, colorKeys, color;
        dataToPlot = {};
        unplottableItems = [];
        scaleX = self._axisFuncs.x;
        scaleY = self._axisFuncs.y;
        unscaleX = self._axisInverseFuncs.x;
        unscaleY = self._axisInverseFuncs.y;
        currentSet = collection.getRestrictedItems();
        hasColorKey = (accessors.getColorKey != null);
        xyToData = {};
        xAxisMin = settings.xAxisMin;
        xAxisMax = settings.xAxisMax;
        yAxisMin = settings.yAxisMin;
        yAxisMax = settings.yAxisMax;

        /*
         *  Iterate through all items, collecting min and max on both axes
         *  get all the x,y coordinates in dataToPlot list that will be passed to jit Constructor
         */

        color = settings.color;
        var colork = {};
        currentSet.visit(function(itemID) {
            xys = [];

            self._getXY(itemID, database, function(xy) {
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
    }
    createLegened = function() {
        if (hasColorKey) {
            var legendWidget = self._dom.legendWidget;
            var colorCoder = self._colorCoder;
            var keys = colorCodingFlags.keys.toArray().sort();

            if (self._colorCoder._gradientPoints != null) {
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
    if (currentSize > 0) {
        prepareData();
        var legendLabels = colorCodingFlags.keys.toArray();
        var container = document.createElement("div");
        container.id = "scatterplotViewContainer";
        container.style.height = "100%"
        this._dom.plotContainer.appendChild(container);
        this._clickHandler(xyToData);
        this._createFlotrScatter(container, dataToPlot, xAxisMin, xAxisMax, yAxisMin, yAxisMax, xyToData, legendLabels);
        //createLegened();
    }

    this._dom.setUnplottableMessage(currentSize, unplottableItems);
}

Exhibit.ScatterPlotView.prototype._clickHandler = function(xyToData) {
    var self, hitEvt, pop;

    self = this;
    hitEvt = null;
    pop = false;

    //capturing the last hit event
    Flotr.addPlugin('clickHit', {
        callbacks : {
            'flotr:hit' : function(e) {
                hitEvt = e;
            }
        }
    });

    $("body").bind("click", function(e) {

        //close the existing popUp if the user has clicked outside the popUp
        if (pop) {
            if (!$(e.target).closest('.simileAjax-bubble-container *').length) {
                pop = false;
                $('.simileAjax-bubble-container').hide();
            };
        }

        if (!pop) {
            var disX = Math.abs(e.pageX - hitEvt.absX);
            var disY = Math.abs(e.pageY - hitEvt.absY);
            var distance = Math.sqrt(disX * disX + disY * disY);

            if (distance < 10) {
                var key = hitEvt.x + "," + hitEvt.y;
                var items = xyToData[key].items;
                pop = true;
                Exhibit.ViewUtilities.openBubbleWithCoords(e.pageX, e.pageY, items, self.getUIContext());
            }
        }
    });
}

Exhibit.ScatterPlotView.prototype._createFlotrScatter = function(container, dataToPlot, xAxisMin, xAxisMax, yAxisMin, yAxisMax, xyToData, legendLabels) {
    var self, dataList, i;
    self = this;
    dataList = [];
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

    (function() {

        //shows the data info when the point is hovered over
        var trackFn = function(o) {
            //to get rid of the padded 0's
            var x = eval(o.x);
            var y = eval(o.y);

            var key = x + "," + y;
            if ( key in xyToData) {
                var id = xyToData[key].items[0];
            }

            return id + ": " + self._settings.xLabel + ' = ' + x + ', ' + self._settings.yLabel + ' = ' + y;
        }
        // Draw the graph
        var graph = Flotr.draw(container, dataList,
        //[{data: dataList, label : "y=x", points : { show : true }, lines : {show:false}}], //bracket very imp!!
        {
            //colors : colorList,
            xaxis : {
                title : self._settings.xLabel,
                //ticks : xAxis,
                min : xAxisMin, // Part of the series is not displayed.
                max : xAxisMax // Part of the series is not displayed.
            },
            yaxis : {
                title : self._settings.yLabel,
                //ticks : yAxis,            // Set Y-Axis ticks
                min : yAxisMin,
                max : yAxisMax // Maximum value along Y-Axis
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
                trackDecimals : 2,
                trackFormatter : trackFn
            }
        });
    })(document.getElementById("editor-render-0"));

};

