/**
 * @fileOverview Implements an Exhibit scatter plot view based on Flot.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

// @@@ color - assemble colorKey related points into a series
// @@@ legend for more than one series, plus setting to show / hide
// @@@ click to open up lens
// @@@ listener behaves differently, highlight / open itemID, not series
// @@@ add zoom control

// @@@ axis autolabel? from facets:
/**
    if (typeof settings.xLabel === "undefined") {
        if (facet.getExpression() !== null && facet.getExpression().isPath()) {
            segment = facet.getExpression().getPath().getLastSegment();
            property = facet.getUIContext().getDatabase().getProperty(segment.pr
operty);
            if (typeof property !== "undefined" && property !== null) {
                facet._settings.facetLabel = segment.forward ? property.getLabel() : property.getReverseLabel();
            }
        }
     }
*/

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
    "../lib/jquery.flot.axislabels"
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

        this._colors = [
            "FF9000",
            "5D7CBA",
            "A97838",
            "8B9BBA",
            "FFC77F",
            "003EBA",
            "29447B",
            "543C1C"
        ];
        this._mixColor = "FFFFFF";
        
        this._colorKeyCache = new Object();
        this._maxColor = 0;

        this._dom = null;
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
        "hoverEffect": { "type": "boolean", "defaultValue": true },
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
        legendWidgetSettings = {};
        
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
        console.log(settings);
        plotDiv = self._dom.plotContainer;
        colorCoder = self._colorCoder;
        opts = {
            "legend": {
                "show": false
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

        // @@@fillColor in points, color in series should match if fill is true

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

        self._plot = $.plot($(plotDiv), [chartData.data], opts);
        // @@@ maybe make div id based on view registry key
        showTooltip = function(x, y, label, xVal, yVal) {
            $('<div id="exhibit-scatterplotview-tooltip"><strong>' + label + '</strong> (' + xVal + "," + yVal + ')</div>').css({
                "top": y + 5,
                "left": x + 5,
            }).appendTo("body");
        };

        moveTooltip = function(x, y) {
            $("#exhibit-scatterplotview-tooltip").css({
                "top": y + 5,
                "left": x + 5
            });
        };

        if (settings.hoverEffect) {
            $(plotDiv).data("previous", -1);
            $(plotDiv).bind("plothover", function(evt, pos, obj) {
                if (obj) {
                    if ($(plotDiv).data("previous") !== obj.dataIndex) {
                        $(plotDiv).data("previous", obj.dataIndex);
                        $("#exhibit-scatterplotview-tooltip").remove();
                        self._plot.unhighlight();
                        self._plot.highlight(obj.series, obj.datapoint);
                        showTooltip(pos.pageX, pos.pageY, obj.series.data[obj.dataIndex][2], obj.datapoint[0], obj.datapoint[1]);
                    } else {
                        moveTooltip(pos.pageX, pos.pageY);
                    }
                } else {
                    self._plot.unhighlight();
                    $("#exhibit-scatterplotview-tooltip").remove();
                    $(plotDiv).data("previous", -1); 
                }
            });
            
            $(plotDiv).bind("mouseout", function(evt) {
                self._plot.unhighlight();
                $("#exhibit-scatterplotview-tooltip").remove();
                $(plotDiv).data("previous", -1);
            });

            // No need to call unbind later, .empty() does that already.
        }
    };

    /**
     *
     */
    ScatterPlotView.prototype._reconstruct = function() {
        var self, collection, database, settings, accessors, currentSize, unplottableItems, currentSet, hasColorKey, xyToData, xAxisMin, xAxisMax, yAxisMin, yAxisMax, colorCoder, plottableData, k, i;

        self = this;
        collection = this.getUIContext().getCollection();
        database = this.getUIContext().getDatabase();
        settings = this._settings;
        accessors = this._accessors;
        colorCoder = this._colorCoder;

        plottableData = {"data": []};

        /*
         *  Get the current collection and check if it's empty
         */
        currentSize = collection.countRestrictedItems();
        unplottableItems = [];

        // @@@ handle multiple items per point
        if (currentSize > 0) {
            currentSet = collection.getRestrictedItems();
            hasColorKey = (self._accessors.getColorKey !== null);

            xyToData = {};

            currentSet.visit(function(itemID) {
                var xys, colorKeys, j, label;
                xys = [];
                self._getXY(itemID, database, function(xy) {
                    if (xy.hasOwnProperty("x") && xy.hasOwnProperty("y")) {
                        xys.push([xy.x, xy.y]);
                    }
                });
                accessors.getPointLabel(itemID, database, function(v) {
                    label = v;
                    return true;
                });

                if (xys.length > 0) {
                    for (j = 0; j < xys.length; j++) {
                        xys[j].push(label);
                    }
                    /**
                    colorKeys = null;
                    if (hasColorKey) {
                        colorKeys = new Set();
                        accessors.getColorKey(itemID, database, function(v) {
                            colorKeys.add(v);
                        });
                    }
                    for (i = 0; i < xys.length; i++) {
                        xy = xys[i];
                        xyKey = xy.x + "," + xy.y;
                    */
                    plottableData.data = plottableData.data.concat(xys);
                } else {
                    unplottableItems.push(itemID);
                }
            });
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
                    $("#exhibit-scatterplotview-tooltip").remove();
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
