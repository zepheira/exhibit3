/**
 * @fileOverview Implements an Exhibit scatter plot view based on Flot.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

// @@@ click to open up lens
// @@@ listener behaves differently, highlight / open itemID, not series

define([
    "lib/jquery",
    "exhibit",
    "./flot-base",
    "scripts/util/set",
    "scripts/util/accessors",
    "scripts/util/settings",
    "scripts/util/views",
    "scripts/ui/ui-context",
    "scripts/ui/views/view",
    "scripts/ui/coders/default-color-coder",
    "../lib/jquery.flot.axislabels",
    "../lib/jquery.flot.navigate"
], function($, Exhibit, FlotExtension, Set, AccessorsUtilities, SettingsUtilities, ViewUtilities, UIContext, View, DefaultColorCoder) {
    /**
     * @class
     * @constructor
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     */
    var ScatterPlotView = function(containerElmt, uiContext) {
        var view = this;
        $.extend(this, new View(
            "flot",
            containerElmt,
            uiContext
        ));
        this.addSettingSpecs(ScatterPlotView._settingSpecs);

        this._accessors = {
            "getPointLabel": function(itemID, database, visitor) {
                visitor(database.getObject(itemID, "label"));
            },
            "getProxy": function(itemID, database, visitor) {
                visitor(itemID);
            },
            "getColorKey": null
        };
        
        this._dom = null;
        this._tooltipID = null;
        this._selectListener = null;
        this._colorCoder = null;
        this._plot = null;

        this._onItemsChanged = function() {
            view._reconstruct(); 
        };

        $(uiContext.getCollection().getElement()).bind(
            "onItemsChanged.exhibit",
            view._onItemsChanged
        );
        
        this.register();
    };

    /**
     * @constant
     */
    ScatterPlotView._settingSpecs = {
        // These are new relative to the homebrew scatter plot view
        "plotWidth": { "type": "int", "defaultValue": 800 },
        "pointFill": { "type": "boolean", "defaultValue": true },
        "pointRadius": { "type" : "int", "defaultValue": 3 },
        "hoverEffect": { "type": "boolean", "defaultValue": true },
        "showZoomControls": { "type": "boolean", "defaultValue": true },

        "plotHeight": { "type": "int", "defaultValue": 400 },
        "bubbleWidth": { "type": "int", "defaultValue": 400 },
        "bubbleHeight": { "type": "int", "defaultValue": 300 },
        "xAxisMin": { "type": "float", "defaultValue": Number.POSITIVE_INFINITY },
        "xAxisMax": { "type": "float", "defaultValue": Number.NEGATIVE_INFINITY },
        "xAxisType": { "type": "enum", "defaultValue": "linear", "choices": [ "linear", "log" ] },
        "yAxisMin": { "type": "float", "defaultValue": Number.POSITIVE_INFINITY },
        "yAxisMax": { "type": "float", "defaultValue": Number.NEGATIVE_INFINITY },
        "yAxisType": { "type": "enum", "defaultValue": "linear", "choices": [ "linear", "log" ] },
        "xLabel": { "type": "text", "defaultValue": null },
        "yLabel": { "type": "text", "defaultValue": null },
        "color": { "type": "text", "defaultValue": "#0000aa" },
        "colorCoder": { "type": "text", "defaultValue": null },
        "selectCoordinator": { "type": "text",  "defaultValue": null },
        "showHeader": { "type": "boolean", "defaultValue": true },
        "showSummary": { "type": "boolean", "defaultValue": true },
        "showFooter": { "type": "boolean", "defaultValue": true }
    };

    /**
     * @constant
     */
    ScatterPlotView._accessorSpecs = [
        {   "accessorName":   "getProxy",
            "attributeName":  "proxy"
        },
        {   "accessorName":   "getPointLabel",
            "attributeName":  "pointLabel",
            "type": "text"
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

    /**
     * @param {Object} configuration
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.ScatterPlotView}
     */
    ScatterPlotView.create = function(configuration, containerElmt, uiContext) {
        var view = new ScatterPlotView(
            containerElmt,
            UIContext.create(configuration, uiContext)
        );
        ScatterPlotView._configure(view, configuration);
        
        view._internalValidate();
        view._initializeUI();
        return view;
    };

    /**
     * @param {Element} configElmt
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.ScatterPlotView}
     */
    ScatterPlotView.createFromDOM = function(configElmt, containerElmt, uiContext) {
        var configuration, view;
        configuration = Exhibit.getConfigurationFromDOM(configElmt);
        view = new ScatterPlotView(
            containerElmt !== null ? containerElmt : configElmt, 
            UIContext.createFromDOM(configElmt, uiContext)
        );
    
        AccessorsUtilities.createAccessorsFromDOM(configElmt, ScatterPlotView._accessorSpecs, view._accessors);
        SettingsUtilities.collectSettingsFromDOM(configElmt, view.getSettingSpecs(), view._settings);
        ScatterPlotView._configure(view, configuration);
        
        view._internalValidate();
        view._initializeUI();

        return view;
    };

    /**
     * @param {Exhibit.ScatterPlotView} view
     * @param {Object} configuration
     */
    ScatterPlotView._configure = function(view, configuration) {
        var accessors;
        AccessorsUtilities.createAccessors(configuration, ScatterPlotView._accessorSpecs, view._accessors);
        SettingsUtilities.collectSettings(configuration, view.getSettingSpecs(), view._settings);
        
        accessors = view._accessors;
        view._getXY = function(itemID, database, visitor) {
            accessors.getProxy(itemID, database, function(proxy) {
                accessors.getXY(proxy, database, visitor);
            });
        };
    };

    /**
     * @param {Exhibit.Expression} expression
     * @param {String} itemID
     * @param {Exhibit.Database} database
     */
    ScatterPlotView.evaluateSingle = function(expression, itemID, database) {
        return expression.evaluateSingleOnItem(itemID, database).value;
    };

    /**
     *
     */
    ScatterPlotView.prototype.dispose = function() {
        $(this.getUIContext().getCollection().getElement()).unbind(
            "onItemsChanged.exhibit",
            this._onItemsChanged
        );
    
        if (this._selectListener !== null) {
            this._selectListener.dispose();
            this._selectListener = null;
        }
    
        this._dom.dispose();
        this._dom = null;

        this._plot = null;

        this._dispose();
    };

    /**
     *
     */
    ScatterPlotView.prototype._internalValidate = function() {
        var selectCoordinator, self;
        if (typeof this._accessors.getColorKey !== "undefined") {
            if (typeof this._settings.colorCoder !== "undefined") {
                this._colorCoder = this.getUIContext().getMain().getComponent(this._settings.colorCoder);
            }
            
            if (this._colorCoder === null) {
                this._colorCoder = new DefaultColorCoder(this.getUIContext());
            }
        }
        if (typeof this._settings.selectCoordinator !== "undefined") {
            selectCoordinator = this.getUIContext().getMain().getComponent(this._settings.selectCoordinator);
            if (selectCoordinator !== null) {
                self = this;
                this._selectListener = selectCoordinator.addListener(function(o) {
                    self._select(o);
                });
            }
        }
    };

    /**
     *
     */
    ScatterPlotView.prototype._initializeUI = function() {
        var self, plotDiv, legendWidgetSettings;
        self = this;
        legendWidgetSettings = (typeof self._colorCoder.gradient !== "undefined") ? "gradient" : {};
        
        $(self.getContainer()).empty();

        this._dom = ViewUtilities.constructPlottingViewDom(
            this.getContainer(), 
            this.getUIContext(), 
            this._settings.showSummary && this._settings.showHeader,
            {
                "onResize": function() { 
                } 
            },
            legendWidgetSettings
        );    

        $(self._dom.plotContainer).css({
            "width": self._settings.plotWidth,
            "height": self._settings.plotHeight
        });

        self._tooltipID = "#exhibit-" + self.getID() + "-scatterplotview-tooltip";
        
        self._initializeViewUI();
        
        this._reconstruct();
    };

    /**
     * @param {Array} chartData
     */
    ScatterPlotView.prototype._reconstructChart = function(chartData) {
        var self, settings, plotDiv, opts, showTooltip, moveTooltip, colorCoder;

        self = this;
        settings = self._settings;

        plotDiv = self._dom.plotContainer;
        colorCoder = self._colorCoder;
        opts = {
            "legend": {
                "show": false
            },
            "zoom": {
                "interactive": true
            },
            "pan": {
                "interactive": true
            },
            "xaxis": {
                "axisLabel": settings.xLabel,
                "min": (settings.xAxisMin === Number.POSITIVE_INFINITY) ? null : settings.xAxisMin,
                "max": (settings.xAxisMax === Number.NEGATIVE_INFINITY) ? null : settings.xAxisMax
            },
            "yaxis": {
                "axisLabel": settings.yLabel,
                "min": (settings.yAxisMin === Number.POSITIVE_INFINITY) ? null : settings.yAxisMin,
                "max": (settings.yAxisMax === Number.NEGATIVE_INFINITY) ? null : settings.yAxisMax
            },
            "grid": {
                "hoverable": true
            },
            "series": {
                "points": {
                    "show": true,
                    "fill": settings.pointFill,
                    "radius": settings.pointRadius
                }
            }
        };

        if (settings.xAxisType === "log") {
            opts.xaxis.transform = function(v) {
                return v === 0 ? null : Math.log(v);
            };
            opts.xaxis.inverseTransform = function(v) {
                return Math.exp(v);
            };
        }

        if (settings.yAxisType === "log") {
            opts.yaxis.transform = function(v) {
                return v === 0 ? null : Math.log(v);
            };
            opts.yaxis.inverseTransform = function(v) {
                return Math.exp(v);
            };
        }

        self._plot = $.plot($(plotDiv), chartData.data, opts);
        
        // @@@ add tooltips to each control
        $('<div class="flot-chartControl zoomIn">+</div>')
            .on("click", function(evt) {
                self._plot.zoom({amount: 1.5});
                evt.preventDefault();
            })
            .appendTo(self._dom.plotContainer);
        $('<div class="flot-chartControl zoomReset">&middot;</div>')
            .on("click", function(evt) {
                // @@@ reset viewport to pre-defined
                evt.preventDefault();
            })
            .appendTo(self._dom.plotContainer);
        $('<div class="flot-chartControl zoomOut">-</div>')
            .on("click", function(evt) {
                self._plot.zoomOut();
                evt.preventDefault();
            })
            .appendTo(self._dom.plotContainer);

        showTooltip = function(x, y, labels, xVal, yVal) {
            var i, str;
            str = "";
            for (i = 0; i < labels.length; i++) {
                str += '<p><strong>' + labels[i] + '</strong> (' + xVal + ',' + yVal + ')</p>';
            }
            $('<div id="' + self._tooltipID.substr(1) + '" class="exhibit-scatterplotview-tooltip">' + str + '</div>').css({
                "top": y + 5,
                "left": x + 5,
            }).appendTo("body");
        };

        moveTooltip = function(x, y) {
            $(self._tooltipID).css({
                "top": y + 5,
                "left": x + 5
            });
        };

        if (settings.hoverEffect) {
            $(plotDiv).data("previous", -1);
            $(plotDiv).bind("plothover", function(evt, pos, obj) {
                var key;
                if (obj) {
                    key = obj.seriesIndex + ":" + obj.dataIndex;
                    if ($(plotDiv).data("previous") !== key) {
                        $(plotDiv).data("previous", key);
                        $(self._tooltipID).remove();
                        self._plot.unhighlight();
                        self._plot.highlight(obj.series, obj.datapoint);
                        showTooltip(pos.pageX, pos.pageY, obj.series.data[obj.dataIndex][2], obj.datapoint[0], obj.datapoint[1]);
                    } else {
                        moveTooltip(pos.pageX, pos.pageY);
                    }
                } else {
                    self._plot.unhighlight();
                    $(self._tooltipID).remove();
                    $(plotDiv).data("previous", -1); 
                }
            });
            
            $(plotDiv).bind("mouseout", function(evt) {
                self._plot.unhighlight();
                $(self._tooltipID).remove();
                $(plotDiv).data("previous", -1);
            });

            // No need to call unbind later, .empty() does that already.
        }
    };

    /**
     *
     */
    ScatterPlotView.prototype._reconstruct = function() {
        var self, collection, database, settings, accessors, currentSize, unplottableItems, currentSet, hasColorKey, xyToData, xyKey, colorCoder, plottableData, k, i, colorCodingFlags, series, color, items, legendWidget, keys;

        self = this;
        collection = this.getUIContext().getCollection();
        database = this.getUIContext().getDatabase();
        settings = this._settings;
        accessors = this._accessors;
        colorCoder = this._colorCoder;

        plottableData = { "data": [] };

        /*
         *  Get the current collection and check if it's empty
         */
        currentSize = collection.countRestrictedItems();
        unplottableItems = [];
        this._dom.legendWidget.clear();

        if (currentSize > 0) {
            currentSet = collection.getRestrictedItems();
            hasColorKey = (self._accessors.getColorKey !== null);

            xyToData = {};

            currentSet.visit(function(itemID) {
                var xys, xyData, colorKeys, j, label;
                xys = [];
                self._getXY(itemID, database, function(xy) {
                    if (xy.hasOwnProperty("x") && xy.hasOwnProperty("y")) {
                        xys.push(xy);
                    }
                });
                accessors.getPointLabel(itemID, database, function(v) {
                    label = v;
                    return true;
                });

                if (xys.length > 0) {
                    colorKeys = null;
                    if (hasColorKey) {
                        colorKeys = new Set();
                        accessors.getColorKey(itemID, database, function(v) {
                            colorKeys.add(v);
                        });
                    }

                    for (j = 0; j < xys.length; j++) {
                        xy = xys[j];
                        xyKey = xy.x + "," + xy.y;
                        if (xyToData.hasOwnProperty(xyKey)) {
                            xyData = xyToData[xyKey];
                            xyData.items.push(itemID);
                            xyData.labels.push(label);
                            if (hasColorKey) {
                                xyData.colorKeys.addSet(colorKeys);
                            }
                        } else {
                            xyData = {
                                "xy": xy,
                                "items": [ itemID ],
                                "labels": [ label ]
                            };
                            if (hasColorKey) {
                                xyData.colorKeys = colorKeys;
                            }
                            xyToData[xyKey] = xyData;
                        }
                    }
                } else {
                    unplottableItems.push(itemID);
                }
            });
        }

        colorCodingFlags = {
            "mixed": false,
            "missing": false,
            "others": false,
            "keys": new Set()
        };

        series = {};

        for (xyKey in xyToData) {
            if (xyToData.hasOwnProperty(xyKey)) {
                items = xyToData[xyKey].items;
                color = settings.color;
                if (hasColorKey) {
                    color = self._colorCoder.translateSet(xyToData[xyKey].colorKeys, colorCodingFlags);
                }
                if (series.hasOwnProperty(color)) {
                    series[color].push([
                        xyToData[xyKey].xy.x,
                        xyToData[xyKey].xy.y,
                        xyToData[xyKey].labels,
                        xyToData[xyKey].items
                    ]);
                } else {
                    series[color] = [[
                        xyToData[xyKey].xy.x,
                        xyToData[xyKey].xy.y,
                        xyToData[xyKey].labels,
                        xyToData[xyKey].items
                    ]];
                }
            }
        }

        for (color in series) {
            if (series.hasOwnProperty(color)) {
                seriesOpts = {
                    "data": series[color],
                    "color": color
                };
                if (settings.pointFill) {
                    seriesOpts.points = {
                        "fillColor": color
                    };
                }
                plottableData.data.push(seriesOpts);
            }
        }

        if (hasColorKey) {
            legendWidget = self._dom.legendWidget;
            // @@@ if using an ordered coder, use that order, not alpha
            keys = colorCodingFlags.keys.toArray().sort();
            if (typeof colorCoder._gradientPoints !== "undefined" && colorCoder._gradientPoints !== null) {
                legendWidget.addGradient(colorCoder._gradientPoints);
            } else {
                for (i = 0; i < keys.length; i++) {
                    legendWidget.addEntry(colorCoder.translate(keys[i]), keys[i]);
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

        this._reconstructChart(plottableData);
        this._dom.setUnplottableMessage(currentSize, unplottableItems);
    };

    /**
     * @param {Object} selection
     * @param {Array} selection.itemIDs
     */
    ScatterPlotView.prototype._select = function(selection) {
        var itemID, pct, selected, series, i, point, plot;
        itemID = selection.itemIDs[0];
        selected = this._itemIDToSlice[itemID];
        if (typeof selected !== "undefined" && selected !== null) {
            series = this._plot.getData();
            for (i = 0; i < series.length; i++) {
                if (series[i].label === selected) {
                    $(this._tooltipID).remove();
                    this._plot.unhighlight();
                    // Flot's highlighting is currently broken in 0.8.1 and is scheduled for a fix in 0.9
                    // this._plot.highlight(i, 0);
                    
                    // Flot does not yet offer a way to map data to page coordinates in a pie chart
                    // pct = parseFloat(series[i].percent).toFixed(2);
                    // PieChartView.showTooltip(point.left, point.top, selected, pct);
                }
            }
        }
    };

    return ScatterPlotView;
});
