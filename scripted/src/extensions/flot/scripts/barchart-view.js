/**
 * @fileOverview Implements an Exhibit pie chart view based on Flot.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

// @@@ highlight action gone? don't really care...
// @@@ ordering - alpha, numeric, or explicit
// @@@ add use with raw data mode, not grouping mode

define([
    "lib/jquery",
    "exhibit",
    "./flot-base",
    "./utils",
    "scripts/util/set",
    "scripts/util/accessors",
    "scripts/util/settings",
    "scripts/util/views",
    "scripts/ui/ui-context",
    "scripts/ui/views/view",
    "scripts/ui/coders/default-color-coder",
    "../lib/jquery.flot.axislabels"
], function($, Exhibit, FlotExtension, FlotUtilities, Set, AccessorsUtilities, SettingsUtilities, ViewUtilities, UIContext, View, DefaultColorCoder) {
    /**
     * @class
     * @constructor
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     */
    var BarChartView = function(containerElmt, uiContext) {
        var view = this;
        $.extend(this, new View(
            "flot",
            containerElmt,
            uiContext
        ));

        this.addSettingSpecs(BarChartView._settingSpecs);

        this._accessors = {
            "getProxy": function(itemID, database, visitor) {
                visitor(itemID);
            },
            "getColorKey": null
        };

        this._dom = null;
        this._selectListener = null;
        this._colorCoder = null;
        this._plot = null;
        this._tooltipID = null;
        this._bound = false;
        this._itemIDToSeries = {};
        this._seriesToItemIDs = {};

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
    BarChartView._settingSpecs = {
        "height": { "type": "int", "defaultValue": 640 },
        "xLabel": { "type": "text", "defaultValue": null },
        "yLabel": { "type": "text", "defaultValue": null },
        "hoverEffect": { "type": "boolean", "defaultValue": true },
        "colorCoder": { "type": "text", "defaultValue": null },
        "selectCoordinator": { "type": "text",  "defaultValue": null },
        "showHeader": { "type": "boolean", "defaultValue": true },
        "showSummary": { "type": "boolean", "defaultValue": true },
        "showFooter": { "type": "boolean", "defaultValue": true }
    };

    /**
     * @constant
     */
    BarChartView._accessorSpecs = [
        {   "accessorName":   "getProxy",
            "attributeName":  "proxy"
        },
        {   "accessorName":   "getGrouping",
            "attributeName":  "grouping"
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
     * @returns {Exhibit.BarChartView}
     */
    BarChartView.create = function(configuration, containerElmt, uiContext) {
        var view = new BarChartView(
            containerElmt,
            UIContext.create(configuration, uiContext)
        );
        BarChartView._configure(view, configuration);
        
        view._internalValidate();
        view._initializeUI();
        return view;
    };

    /**
     * @param {Element} configElmt
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.BarChartView}
     */
    BarChartView.createFromDOM = function(configElmt, containerElmt, uiContext) {
        var configuration, view;
        configuration = Exhibit.getConfigurationFromDOM(configElmt);
        view = new BarChartView(
            containerElmt !== null ? containerElmt : configElmt, 
            UIContext.createFromDOM(configElmt, uiContext)
        );
    
        AccessorsUtilities.createAccessorsFromDOM(configElmt, BarChartView._accessorSpecs, view._accessors);
        SettingsUtilities.collectSettingsFromDOM(configElmt, view.getSettingSpecs(), view._settings);
        BarChartView._configure(view, configuration);
        
        view._internalValidate();
        view._initializeUI();

        return view;
    };

    /**
     * @param {Exhibit.BarChartView} view
     * @param {Object} configuration
     */
    BarChartView._configure = function(view, configuration) {
        var accessors;
        AccessorsUtilities.createAccessors(configuration, BarChartView._accessorSpecs, view._accessors);
        SettingsUtilities.collectSettings(configuration, view.getSettingSpecs(), view._settings);
        
        accessors = view._accessors;
    };

    /**
     *
     */
    BarChartView.prototype.dispose = function() {
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
        this._itemIDToSeries = null;
        this._seriesToItemIDs = null;

        this._plot = null;

        this._dispose();
    };

    /**
     *
     */
    BarChartView.prototype._internalValidate = function() {
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
    BarChartView.prototype._initializeUI = function() {
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
            "width": "100%",
            "height": self._settings.height
        });
        self._tooltipID = FlotUtilities.makeTooltipID(self, "barchartview");
        
        self._initializeViewUI();
        
        this._reconstruct();
    };

    /**
     * @param {Array} chartData
     */
    BarChartView.prototype._reconstructChart = function(chartData) {
        var self, settings, plotDiv, opts, makeArgs, tooltipFormatter, itemsAccessor, colorCoder;

        self = this;
        settings = self._settings;
        plotDiv = self._dom.plotContainer;
        colorCoder = self._colorCoder;
        opts = {
            "legend": {
                "show": false
            },
            "grid": {
                "hoverable": true,
                "clickable": true
            },
            "xaxis": {
                "ticks": chartData.labels,
                "tickLength": 0,
                "axisLabel": settings.xLabel
            },
            "yaxis": {
                "axisLabel": settings.yLabel
            }
        };

        self._plot = $.plot($(plotDiv), chartData.data, opts);

        makeArgs = function(obj) {
            return [obj.series.label, obj.datapoint[1]];
        };

        tooltipFormatter = function(args) {
            return '<strong>' + args[0] + '</strong> (' + args[1] + ')';
        };

        itemsAccessor = function(obj) {
            return self._seriesToItemIDs[obj.series.label];
        };

        if (settings.hoverEffect && !self._bound) {
            FlotUtilities.setupHover(plotDiv, self, makeArgs, tooltipFormatter);
        }

        if (!self._bound) {
            FlotUtilities.setupClick(plotDiv, self, itemsAccessor);
        }

        // No need to call unbind later, .empty() does that already.
        self._bound = true;
    };

    /**
     *
     */
    BarChartView.prototype._reconstruct = function() {
        var self, collection, database, settings, accessors, currentSize, unplottableItems, currentSet, colorCoder, chartData, plottableData, k, i;

        self = this;
        collection = this.getUIContext().getCollection();
        database = this.getUIContext().getDatabase();
        settings = this._settings;
        accessors = this._accessors;
        colorCoder = this._colorCoder;

        chartData = {};
        plottableData = {"labels": [], "data": []};

        /*
         *  Get the current collection and check if it's empty
         */
        currentSize = collection.countRestrictedItems();
        unplottableItems = [];

        if (currentSize > 0) {
            currentSet = collection.getRestrictedItems();
            currentSet.visit(function(itemID) {
                var color;
                accessors.getGrouping(itemID, database, function(v) {
                    if (v !== null) {
                        if (typeof chartData[v] === "undefined") {
                            color = colorCoder.translate(v);
                            chartData[v] = {
                                "label": v,
                                "data": [[0, 1]],
                                "bars": {
                                    "show": true,
                                    "fill": true,
                                    "align": "center",
                                    "lineWidth": 0
                                }
                            };
                            if (color !== null) {
                                chartData[v].color = color;
                                chartData[v].bars.fillColor = color;
                            }
                        } else {
                            chartData[v].data[0][1] = chartData[v].data[0][1] + 1;
                        }
                        self._itemIDToSeries[itemID] = v;
                        if (typeof self._seriesToItemIDs[v] !== "undefined") {
                            self._seriesToItemIDs[v].push(itemID);
                        } else {
                            self._seriesToItemIDs[v] = [itemID];
                        }
                    } else {
                        unplottableItems.push(itemID);
                    }
                });
            });
        }

        i = 0;
        for (k in chartData) {
            if (chartData.hasOwnProperty(k)) {
                plottableData.labels.push([i, k]);
                chartData[k].data[0][0] = i++;
                plottableData.data.push(chartData[k]);
            }
        }
        this._reconstructChart(plottableData);
        this._dom.setUnplottableMessage(currentSize, unplottableItems);
    };

    /**
     * @param {Object} selection
     * @param {Array} selection.itemIDs
     */
    BarChartView.prototype._select = function(selection) {
        var itemID, pct, selected, series, i, point, plot;
        itemID = selection.itemIDs[0];
        selected = this._itemIDToSeries[itemID];
        if (typeof selected !== "undefined" && selected !== null) {
            series = this._plot.getData();
            for (i = 0; i < series.length; i++) {
                if (series[i].label === selected) {
                    FlotUtilities.removeTooltip(this._tooltipID);
                    this._plot.unhighlight();
                    // see piechart-view for more on why this doesn't yet work
                }
            }
        }
    };

    return BarChartView;
});
