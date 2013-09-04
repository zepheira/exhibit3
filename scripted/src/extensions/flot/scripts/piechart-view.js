/**
 * @fileOverview Implements an Exhibit pie chart view based on Flot.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

// @@@ ordering - alpha, numeric, or explicit

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
    "scripts/ui/coordinator",
    "scripts/ui/coders/coder",
    "scripts/ui/coders/default-color-coder",
    "../lib/jquery.flot.pie"
], function($, Exhibit, FlotExtension, Set, AccessorsUtilities, SettingsUtilities, ViewUtilities, UIContext, View, Coordinator, Coder, DefaultColorCoder) {
    /**
     * @class
     * @constructor
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     */
    var PieChartView = function(containerElmt, uiContext) {
        var view = this;
        $.extend(this, new View(
            "flot",
            containerElmt,
            uiContext
        ));
        this.addSettingSpecs(PieChartView._settingSpecs);

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
        this._itemIDToSlice = {};

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
    PieChartView._settingSpecs = {
        "height": { "type": "int", "defaultValue": 640 },
        "width": { "type": "int", "defaultValue": 480 },
        "threshold": { "type": "int", "defaultValue": 1 },
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
    PieChartView._accessorSpecs = [
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
     * @returns {Exhibit.PieChartView}
     */
    PieChartView.create = function(configuration, containerElmt, uiContext) {
        var view = new PieChartView(
            containerElmt,
            UIContext.create(configuration, uiContext)
        );
        PieChartView._configure(view, configuration);
        
        view._internalValidate();
        view._initializeUI();
        return view;
    };

    /**
     * @param {Element} configElmt
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.PieChartView}
     */
    PieChartView.createFromDOM = function(configElmt, containerElmt, uiContext) {
        var configuration, view;
        configuration = Exhibit.getConfigurationFromDOM(configElmt);
        view = new PieChartView(
            containerElmt !== null ? containerElmt : configElmt, 
            UIContext.createFromDOM(configElmt, uiContext)
        );
    
        AccessorsUtilities.createAccessorsFromDOM(configElmt, PieChartView._accessorSpecs, view._accessors);
        SettingsUtilities.collectSettingsFromDOM(configElmt, view.getSettingSpecs(), view._settings);
        PieChartView._configure(view, configuration);
        
        view._internalValidate();
        view._initializeUI();

        return view;
    };

    /**
     * @param {Exhibit.PieChartView} view
     * @param {Object} configuration
     */
    PieChartView._configure = function(view, configuration) {
        var accessors;
        AccessorsUtilities.createAccessors(configuration, PieChartView._accessorSpecs, view._accessors);
        SettingsUtilities.collectSettings(configuration, view.getSettingSpecs(), view._settings);
        
        accessors = view._accessors;
    };

    /**
     *
     */
    PieChartView.prototype.dispose = function() {
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

        this._itemIDToSlice = null;
        this._plot = null;

        this._dispose();
    };

    /**
     *
     */
    PieChartView.prototype._internalValidate = function() {
        var selectCoordinator, self;
        if (typeof this._accessors.getColorKey !== "undefined") {
            if (typeof this._settings.colorCoder !== "undefined") {
                this._colorCoder = this.getUIContext().getMain().getRegistry().get(Coder.getRegistryKey(), this._settings.colorCoder);
            }
            
            if (this._colorCoder === null) {
                this._colorCoder = new DefaultColorCoder(this.getUIContext());
            }
        }
        if (typeof this._settings.selectCoordinator !== "undefined") {
            selectCoordinator = this.getUIContext().getMain().getRegistry().get(Coordinator.getRegistryKey(), this._settings.selectCoordinator);
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
    PieChartView.prototype._initializeUI = function() {
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
     * @static
     * @param {Number} x
     * @param {Number} y
     * @param {String} label
     * @param {String} pct
     */
    PieChartView.showTooltip = function(x, y, label, pct) {
        $('<div id="exhibit-piechartview-tooltip"><strong>' + label + '</strong> (' + pct + '%)</div>').css({
            "top": y + 5,
            "left": x + 5,
        }).appendTo("body");
    };

    /**
     * @static
     * @param {Number} x
     * @param {Number} y
     */
    PieChartView.moveTooltip = function(x, y) {
        $("#exhibit-piechartview-tooltip").css({
            "top": y + 5,
            "left": x + 5
        });
    };

    /**
     * @param {Array} chartData
     */
    PieChartView.prototype._reconstructChart = function(chartData) {
        var self, settings, plotDiv, opts, colorCoder, columns;

        self = this;
        settings = self._settings;
        plotDiv = self._dom.plotContainer;
        colorCoder = self._colorCoder;
        columns = (chartData.length > 15) ? 2 : 1;
        opts = {
            "series": {},
            "legend": {
                "show": true,
                "noColumns": columns
            },
            "grid": {
                "hoverable": true
            }
        };

        opts.series["pie"] = {
            "show": true,
            "radius": 1,
            "combine": {
                "threshold": settings.threshold / 100.0,
                "label": colorCoder.getOthersLabel() + " (&lt;" + settings.threshold + "%)"
            }
        };
        self._plot = $.plot($(plotDiv), chartData, opts);

        if (settings.hoverEffect) {
            $(plotDiv).data("previous", -1);
            $(plotDiv).bind("plothover", function(evt, pos, obj) {
                var pct;
                if (obj) {
                    if ($(plotDiv).data("previous") !== obj.seriesIndex) {
                        $(plotDiv).data("previous", obj.seriesIndex);
                        $("#exhibit-piechartview-tooltip").remove();
                        self._plot.unhighlight();
                        self._plot.highlight(obj.series, obj.datapoint);
                        pct = parseFloat(obj.series.percent).toFixed(2);
                        PieChartView.showTooltip(pos.pageX, pos.pageY, obj.series.label, pct);
                    } else {
                        PieChartView.moveTooltip(pos.pageX, pos.pageY);
                    }
                } else {
                    self._plot.unhighlight();
                    $("#exhibit-piechartview-tooltip").remove();
                    $(plotDiv).data("previous", -1); 
                }
            });
            
            $(plotDiv).bind("mouseout", function(evt) {
                self._plot.unhighlight();
                $("#exhibit-piechartview-tooltip").remove();
                $(plotDiv).data("previous", -1);
            });

            // No need to call unbind later, .empty() does that already.
        }
    };

    /**
     *
     */
    PieChartView.prototype._reconstruct = function() {
        var self, collection, database, settings, accessors, currentSize, unplottableItems, currentSet, colorCoder, chartData, plottableData, k;

        self = this;
        collection = this.getUIContext().getCollection();
        database = this.getUIContext().getDatabase();
        settings = this._settings;
        accessors = this._accessors;
        colorCoder = this._colorCoder;

        chartData = {};
        plottableData = [];

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
                        chartData[v] = {"label": v, "data": 1 };
                        if (color !== null) {
                            chartData[v].color = color;
                        }
                    } else {
                        chartData[v].data++;
                    }
                    self._itemIDToSlice[itemID] = v;
                } else {
                    unplottableItems.push(itemID);
                }
            });
        });

        for (k in chartData) {
            if (chartData.hasOwnProperty(k)) {
                plottableData.push(chartData[k]);
            }
        }
        this._reconstructChart(plottableData);
        this._dom.setUnplottableMessage(currentSize, unplottableItems);
    };

    /**
     * @param {Object} selection
     * @param {Array} selection.itemIDs
     */
    PieChartView.prototype._select = function(selection) {
        var itemID, pct, selected, series, i, point, plot;
        itemID = selection.itemIDs[0];
        selected = this._itemIDToSlice[itemID];
        if (typeof selected !== "undefined" && selected !== null) {
            series = this._plot.getData();
            for (i = 0; i < series.length; i++) {
                if (series[i].label === selected) {
                    $("#exhibit-piechartview-tooltip").remove();
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

    return PieChartView;
});
