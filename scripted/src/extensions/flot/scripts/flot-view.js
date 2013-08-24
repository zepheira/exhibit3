/**
 * @fileOverview Implements the glue between an Exhibit view and Flot.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

// @@@ take out excess
define([
    "lib/jquery",
    "exhibit",
    "./flot-base",
    "scripts/util/debug",
    "scripts/util/set",
    "scripts/util/accessors",
    "scripts/util/settings",
    "scripts/util/views",
    "scripts/ui/ui-context",
    "scripts/ui/views/view",
    "scripts/ui/coders/default-color-coder",
    "../lib/jquery.flot",
    "../lib/jquery.flot.pie"
], function($, Exhibit, FlotExtension, Debug, Set, AccessorsUtilities, SettingsUtilities, ViewUtilities, UIContext, View, DefaultColorCoder) {
    /**
     * @class
     * @constructor
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     */
    var FlotView = function(containerElmt, uiContext) {
        var view = this;
        $.extend(this, new View(
            "flot",
            containerElmt,
            uiContext
        ));
        this.addSettingSpecs(FlotView._settingSpecs);

        this._accessors = {
            "getEventLabel":  function(itemID, database, visitor) {
                visitor(database.getObject(itemID, "label"));
            },
            "getProxy":       function(itemID, database, visitor) {
                visitor(itemID);
            },
            "getColorKey":    null
        };

        this._dom = null;
        this._selectListener = null;
        this._colorCoder = null;

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
    FlotView._settingSpecs = {
        "height": { "type": "int", "defaultValue": 640 },
        "width": { "type": "int", "defaultValue": 480 },
        "groupingProperties": { "type": "text", "defaultValue": null },
        "chartClass": { "type": "text", "defaultValue": "pie" },
        "colorCoder": { "type": "text", "defaultValue": null },
        "selectCoordinator": { "type": "text",  "defaultValue": null },
        "showHeader": { "type": "boolean", "defaultValue": true },
        "showSummary": { "type": "boolean", "defaultValue": true },
        "showFooter": { "type": "boolean", "defaultValue": true }
    };

    /**
     * @constant
     */
    FlotView._accessorSpecs = [
        {   "accessorName":   "getProxy",
            "attributeName":  "proxy"
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
     * @returns {Exhibit.FlotView}
     */
    FlotView.create = function(configuration, containerElmt, uiContext) {
        var view = new FlotView(
            containerElmt,
            UIContext.create(configuration, uiContext)
        );
        FlotView._configure(view, configuration);
        
        view._internalValidate();
        view._initializeUI();
        return view;
    };

    /**
     * @param {Element} configElmt
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.FlotView}
     */
    FlotView.createFromDOM = function(configElmt, containerElmt, uiContext) {
        var configuration, view;
        configuration = Exhibit.getConfigurationFromDOM(configElmt);
        view = new FlotView(
            containerElmt !== null ? containerElmt : configElmt, 
            UIContext.createFromDOM(configElmt, uiContext)
        );
    
        AccessorsUtilities.createAccessorsFromDOM(configElmt, FlotView._accessorSpecs, view._accessors);
        SettingsUtilities.collectSettingsFromDOM(configElmt, view.getSettingSpecs(), view._settings);
        FlotView._configure(view, configuration);

        view._settings.groupingProperties = Exhibit.getAttribute(configElmt, "groupingProperties", ",") || [];
        
        view._internalValidate();
        view._initializeUI();

        return view;
    };

    /**
     * @param {Exhibit.FlotView} view
     * @param {Object} configuration
     */
    FlotView._configure = function(view, configuration) {
        var accessors;
        AccessorsUtilities.createAccessors(configuration, FlotView._accessorSpecs, view._accessors);
        SettingsUtilities.collectSettings(configuration, view.getSettingSpecs(), view._settings);
        
        accessors = view._accessors;
    };

    /**
     *
     */
    FlotView.prototype.dispose = function() {
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
        
        this._dispose();
    };

    /**
     *
     */
    FlotView.prototype._internalValidate = function() {
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
    FlotView.prototype._initializeUI = function() {
        var self, legendWidgetSettings;
        self = this;
        legendWidgetSettings = {};
        
        legendWidgetSettings.colorGradient = (this._colorCoder !== null && typeof this._colorCoder._gradientPoints !== "undefined");
    
        $(this.getContainer()).empty();
        $(this.getContainer()).css({
            "width": self._settings.width,
            "height": self._settings.height
        });

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
        
        self._initializeViewUI();
        
        this._reconstruct();
    };

    /**
     * @param {Array} chartData
     */
    FlotView.prototype._reconstructChart = function(chartData) {
        var settings, opts, self;

        self = this;
        settings = self._settings;
        opts = {
            "series": {},
            "legend": {
                "show": true
            },
            "grid": {
                "hoverable": true,
                "clickable": true
            }
        };

        opts.series[settings.chartClass] = {
            "show": true,
            "radius": 1,
            "combine": {
                "threshold": 0.01
            }
        };
        
        // @@@ use color coder to fix built-in legend, not make a new one
        // @@@ fx for hover, click - label, percentage - setting to turn off
        // @@@ "combine" threshold setting
        // @@@ add a setting for groupingproperties that uses expressions
        // @@@ include dropdown for picking expression to use
        
        $.plot($(self.getContainer()), chartData, opts);
    };

    /**
     *
     */
    FlotView.prototype._reconstruct = function() {
        var self, collection, database, settings, accessors, currentSize, unplottableItems, currentSet, hasColorKey, hasHoverText, hasCaption, colorCodingFlags, legendWidget, colorCoder, color, groupingProperty, chartData, plottableData;

        self = this;
        collection = this.getUIContext().getCollection();
        database = this.getUIContext().getDatabase();
        settings = this._settings;
        accessors = this._accessors;

        // @@@@
        groupingProperty = this._settings.groupingProperties[0];
        chartData = {};
        plottableData = [];

        /*
         *  Get the current collection and check if it's empty
         */
        currentSize = collection.countRestrictedItems();
        unplottableItems = [];

        this._dom.legendWidget.clear();

        if (currentSize > 0) {
            currentSet = collection.getRestrictedItems();
            hasColorKey = (this._accessors.getColorKey !== null);
            colorCodingFlags = { mixed: false, missing: false, others: false, keys: new Set() };
            //
        }

        currentSet.visit(function(itemID) {
            var color, hoverText, colorKeys, hoverKeys, i, obj;
            obj = database.getObject(itemID, groupingProperty);
            if (typeof obj !== null) {
                if (typeof chartData[obj] === "undefined") {
                    chartData[obj] = {"label": obj, "data": 1 };
                } else {
                    chartData[obj].data++;
                }
            } else {
                unplottableItems.push(item);
            }
        });

        if (hasColorKey) {
            legendWidget = this._dom.legendWidget;
            colorCoder = this._colorCoder;
            keys = colorCodingFlags.keys.toArray().sort();
            if (typeof this._colorCoder._gradientPoints !== "undefined" && this._colorCoder._gradientPoints !== null) {
                legendWidget.addGradient(this._colorCoder._gradientPoints);
            } else {
                for (k = 0; k < keys.length; k++) {
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
    FlotView.prototype._select = function(selection) {
        var itemID, c, i, band, evt;
        itemID = selection.itemIDs[0];
    };

    /**
     * @param {Timeline.DefaultEventSource.Event} evt
     * @param {Element} elmt
     * @param {Object} [theme] Ignored.
     * @param {Object} [labeller] Ignored.
     */
    FlotView.prototype._fillInfoBubble = function(evt, elmt, theme, labeller) {
        this.getUIContext().getLensRegistry().createLens(evt._itemID, $(elmt), this.getUIContext());
    };

    return FlotView;
});
