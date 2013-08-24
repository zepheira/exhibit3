/**
 * @fileOverview Implements an Exhibit pie chart view based on Flot.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

// @@@ Break out to common utilities as other chart types are added.
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
     * @param {Array} chartData
     */
    PieChartView.prototype._reconstructChart = function(chartData) {
        var self, settings, plotDiv, opts, showTooltip, moveTooltip, colorCoder, columns;

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

        showTooltip = function(x, y, label, pct) {
            $('<div id="exhibit-piechartview-tooltip"><strong>' + label + '</strong> (' + pct + '%)</div>').css({
                "top": y + 5,
                "left": x + 5,
            }).appendTo("body");
        };

        moveTooltip = function(x, y) {
            $("#exhibit-piechartview-tooltip").css({
                "top": y + 5,
                "left": x + 5
            });
        };

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
                        showTooltip(pos.pageX, pos.pageY, obj.series.label, pct);
                    } else {
                        moveTooltip(pos.pageX, pos.pageY);
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
        // @@@ Cannot really fire off a selector from the chart side, but
        //     if a selector from another view is fired off, show which
        //     slice it belongs to, in some fashion.
    };

    return PieChartView;
});
