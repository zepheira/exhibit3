/**
 * @fileOverview Implements an Exhibit pie chart view based on Flot.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

// @@@ x-axis label
// @@@ y-axis label
// @@@ highlight? don't really care
// @@@ click pops up list of items?
// @@@ ordering - alpha, numeric, or explicit
// @@@ coordinator
// @@@ use with raw data mode, not grouping mode

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
    "../lib/jquery.flot",
    "../lib/jquery.flot.pie"
], function($, Exhibit, FlotExtension, Set, AccessorsUtilities, SettingsUtilities, ViewUtilities, UIContext, View, DefaultColorCoder) {
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
        "width": { "type": "int", "defaultValue": 480 },
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
        var self, plotDiv;
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
            "width": self._settings.width,
            "height": self._settings.height
        });
        
        self._initializeViewUI();
        
        this._reconstruct();
    };

    /**
     * @param {Array} chartData
     */
    BarChartView.prototype._reconstructChart = function(chartData) {
        var self, settings, plotDiv, opts, showTooltip, moveTooltip, colorCoder;

        self = this;
        settings = self._settings;
        plotDiv = self._dom.plotContainer;
        colorCoder = self._colorCoder;
        opts = {
            "legend": {
                "show": false
            },
            "grid": {
                "hoverable": true
            },
            "xaxis": {
                "ticks": chartData.labels,
                "tickLength": 0
            }
        };
        console.log(chartData);
        self._plot = $.plot($(plotDiv), chartData.data, opts);
        showTooltip = function(x, y, label, value) {
            $('<div id="exhibit-barchartview-tooltip"><strong>' + label + '</strong> (' + value + ')</div>').css({
                "top": y + 5,
                "left": x + 5,
            }).appendTo("body");
        };

        moveTooltip = function(x, y) {
            $("#exhibit-barchartview-tooltip").css({
                "top": y + 5,
                "left": x + 5
            });
        };

        if (settings.hoverEffect) {
            $(plotDiv).data("previous", -1);
            $(plotDiv).bind("plothover", function(evt, pos, obj) {
                if (obj) {
                    if ($(plotDiv).data("previous") !== obj.seriesIndex) {
                        $(plotDiv).data("previous", obj.seriesIndex);
                        $("#exhibit-barchartview-tooltip").remove();
                        self._plot.unhighlight();
                        self._plot.highlight(obj.series, obj.datapoint);
                        showTooltip(pos.pageX, pos.pageY, obj.series.label, obj.datapoint[1]);
                    } else {
                        moveTooltip(pos.pageX, pos.pageY);
                    }
                } else {
                    self._plot.unhighlight();
                    $("#exhibit-barchartview-tooltip").remove();
                    $(plotDiv).data("previous", -1); 
                }
            });
            
            $(plotDiv).bind("mouseout", function(evt) {
                self._plot.unhighlight();
                $("#exhibit-barchartview-tooltip").remove();
                $(plotDiv).data("previous", -1);
            });

            // No need to call unbind later, .empty() does that already.
        }
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
        }

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
                } else {
                    unplottableItems.push(itemID);
                }
            });
        });

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
        // @@@ Cannot really fire off a selector from the chart side, but
        //     if a selector from another view is fired off, show which
        //     slice it belongs to, in some fashion.
    };

    return BarChartView;
});
