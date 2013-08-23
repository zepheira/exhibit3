/*==================================================
 *  Exhibit.OLMapView
 *
 *  Utilizing OpenLayers map API
 *  http://openlayers.org/
 *
 *  Funding for development of this extension in part
 *  by Zepheira.  Copyright (c) Zepheira 2009.
 *  http://zepheira.com/
 *  See the main Exhibit LICENSE.txt for licensing.
 *==================================================
 */

// FUTURE PLANS
//  extend map type concept to cover custom map layers via OL in exhibit; this could be done with the generic mapConstructor setting, but perhaps a less programming intensive way can be made available
//  change popup on polygon to location of click instead of centroid
//  hide/show instead of erase/redraw features
//  test cases
//  incorporate an editor based on OL editing API

define([
    "lib/jquery",
    "exhibit",
    "openlayers",
    "ext/map/scripts/base",
    "ext/map/scripts/marker",
    "scripts/util/debug",
    "scripts/util/set",
    "scripts/util/accessors",
    "scripts/util/settings",
    "scripts/util/views",
    "scripts/data/expression-parser",
    "scripts/ui/ui-context",
    "scripts/ui/views/view",
    "scripts/ui/formatter",
    "scripts/ui/coders/default-color-coder",
    "lib/jquery.simile.dom"
], function($, Exhibit, OpenLayers, MapExtension, Marker, Debug, Set, AccessorsUtilities, SettingsUtilities, ViewUtilities, ExpressionParser, UIContext, View, Formatter, DefaultColorCoder) {
    var OLMapView = function(containerElmt, uiContext) {
        OLMapView._initialize();

        var view = this;
        $.extend(this, new View(
            "map",
            containerElmt,
            uiContext
        ));
        this.addSettingSpecs(OLMapView._settingSpecs);

        this._settings = {};
        this._accessors = {
            "getProxy":    function(itemID, database, visitor) {
                visitor(itemID);
            },
            "getColorKey": null,
            "getSizeKey":  null,
            "getIconKey":  null,
            "getIcon":     null
        };
        this._colorCoder = null;
        this._sizeCoder = null;
        this._iconCoder = null;
    
        this._selectListener = null;
        this._itemIDToMarker = {};

        this._markerLabelExpression = null;
        this._markerCache = {};

        this._shown = false;

        this._onItemsChanged = function() {
            view._reconstruct(); 
        };
        $(uiContext.getCollection().getElement()).bind(
            "onItemsChanged.exhibit",
            view._onItemsChanged
        );

        this.register();
    };

    OLMapView.contexts = {};

    /**
     * @constant
     */
    OLMapView._settingSpecs = {
        "latlngOrder":      { type: "enum",     "defaultValue": "latlng", "choices": [ "latlng", "lnglat" ] },
        "latlngPairSeparator": { "type": "text",  "defaultValue": ";"   },
        "center":           { "type": "float",    "defaultValue": null,     "dimensions": 2 },
        "zoom":             { "type": "float",    "defaultValue": null      },
        
        "scrollWheelZoom":  { "type": "boolean",  "defaultValue": true      },
        "scaleControl":     { "type": "boolean",  "defaultValue": true      },
        "overviewControl":  { "type": "boolean",  "defaultValue": false     },
        "type":             { "type": "enum",     "defaultValue": "osm", "choices": [ "osm", "wms", "gmap", "gsat", "ghyb", "gter", "vmap", "vsat", "vhyb", "ymap", "ysat", "yhyb" ] },
        "bubbleTip":        { "type": "enum",     "defaultValue": "top",    "choices": [ "top", "bottom" ] },
        "mapHeight":        { "type": "int",      "defaultValue": 400       },
        "mapConstructor":   { "type": "function", "defaultValue": null      },
        "markerLabel":      { "type": "text",     "defaultValue": ".label"  },
        "projection":       { "type": "function", "defaultValue": null      },
        "color":            { "type": "text",     "defaultValue": "#FF9000" },
        "colorCoder":       { "type": "text",     "defaultValue": null      },
        "sizeCoder":        { "type": "text",     "defaultValue": null      },
        "iconCoder":        { "type": "text",     "defaultValue": null      },
        "selectCoordinator":  { "type": "text",   "defaultValue": null      },
        
        "iconSize":         { "type": "int",      "defaultValue": 0         },
        "iconFit":          { "type": "text",     "defaultValue": "smaller" },
        "iconScale":        { "type": "float",    "defaultValue": 1         },
        "iconOffsetX":      { "type": "float",    "defaultValue": 0         },
        "iconOffsetY":      { "type": "float",    "defaultValue": 0         },
        "shape":            { "type": "text",     "defaultValue": "circle"  },
        "shapeWidth":       { "type": "int",      "defaultValue": 24        },
        "shapeHeight":      { "type": "int",      "defaultValue": 24        },
        "shapeAlpha":       { "type": "float",    "defaultValue": 0.7       },
        "pin":              { "type": "boolean",  "defaultValue": true      },
        "pinHeight":        { "type": "int",      "defaultValue": 6         },
        "pinWidth":         { "type": "int",      "defaultValue": 6         },
    
        "borderOpacity":    { "type": "float",    "defaultValue": 0.5       },
        "borderWidth":      { "type": "int",      "defaultValue": 1         },
        "borderColor":      { "type": "text",     "defaultValue": null      },
        "opacity":          { "type": "float",    "defaultValue": 0.7       },
        
        "sizeLegendLabel":  { "type": "text",     "defaultValue": null      },
        "colorLegendLabel": { "type": "text",     "defaultValue": null      },
        "iconLegendLabel":  { "type": "text",     "defaultValue": null      },
        "markerFontFamily": { "type": "text",     "defaultValue": "12pt sans-serif" },
        "markerFontColor":  { "type": "text",     "defaultValue": "black"   },
        "markerScale":      { "type": "text",     "defaultValue": null      },
        "showHeader":       { "type": "boolean",  "defaultValue": true      },
        "showSummary":      { "type": "boolean",  "defaultValue": true      },
        "showFooter":       { "type": "boolean",  "defaultValue": true      },
        "showToolbox":      { "type": "boolean",  "defaultValue": true      },
        "mapURL":           { "type": "text",     "defaultValue": "http://otile1.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png" },
        "aerialURL":        { "type": "text",     "defaultValue": "http://otile2.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg" }
    };

    /**
     * @constant
     */
    OLMapView._accessorSpecs = [
        {   "accessorName":   "getProxy",
            "attributeName":  "proxy"
        },
        {   "accessorName": "getLatlng",
            "alternatives": [
                {   "bindings": [
                    {   "attributeName":  "latlng",
                        "types":          [ "float", "float" ],
                        "bindingNames":   [ "lat", "lng" ]
                    },
                    {   "attributeName":  "maxAutoZoom",
                        "type":           "float",
                        "bindingName":    "maxAutoZoom",
                        "optional":       true
                    }
                ]
                },
                {   "bindings": [
                    {   "attributeName":  "lat",
                        "type":           "float",
                        "bindingName":    "lat"
                    },
                    {   "attributeName":  "lng",
                        "type":           "float",
                        "bindingName":    "lng"
                    },
                    {   "attributeName":  "maxAutoZoom",
                        "type":           "float",
                        "bindingName":    "maxAutoZoom",
                        "optional":       true
                    }
                ]
                }
            ]
        },
        {   "accessorName":   "getPolygon",
            "attributeName":  "polygon",
            "type":           "text"
        },
        {   "accessorName":   "getPolyline",
            "attributeName":  "polyline",
            "type":           "text"
        },
        {   "accessorName":   "getColorKey",
            "attributeName":  "marker", // backward compatibility
            "type":           "text"
        },
        {   "accessorName":   "getColorKey",
            "attributeName":  "colorKey",
            "type":           "text"
        },
        {   "accessorName":   "getSizeKey",
            "attributeName":  "sizeKey",
            "type":           "text"
        },
        {   "accessorName":   "getIconKey",
            "attributeName":  "iconKey",
            "type":           "text"
        },
        {   "accessorName":   "getIcon",
            "attributeName":  "icon",
            "type":           "url"
        }
    ];

    /**
     * @private
     * @static
     */
    OLMapView._initialize = function() {
        if (!MapExtension.initialized) {
            var rel, canvas;
            $('head link').each(function(i, el) {
                rel = $(el).attr("rel");
                if (rel.match(/\b(exhibit-map-painter|exhibit\/map-painter)\b/)) {
                    MapExtension.markerUrlPrefix = $(el).attr("href") + "?";
                }
            });
            
            Marker.detectCanvas();

            if (MapExtension.urlPrefix !== null) {
                OpenLayers.ImgPath = MapExtension.urlPrefix + "images/";
            } else if (Exhibit.urlPrefix !== null) {
                OpenLayers.ImgPath = Exhibit.urlPrefix + "extensions/openlayers/images/";
            } else {
                OpenLayers.ImgPath = "http://openlayers/org/api/" + MapExtension.openLayersVersion + "/img/";
            }

            MapExtension.initialized = true;
        }
    };
   
    /**
     * @param {Object} configuration
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.OLMapView}
     */
    OLMapView.create = function(configuration, containerElmt, uiContext) {
        var view = new OLMapView(
            containerElmt,
            UIContext.create(configuration, uiContext)
        );
        OLMapView._configure(view, configuration);
    
        view._internalValidate();
        view._initializeUI();
        return view;
    };

    /**
     * @param {Element} configElmt
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.OLMapView}
     */
    OLMapView.createFromDOM = function(configElmt, containerElmt, uiContext) {
        var configuration, view;
        configuration = Exhibit.getConfigurationFromDOM(configElmt);
        view = new OLMapView(
            (typeof containerElmt !== "undefined" && containerElmt !== null) ? containerElmt : configElmt, 
            UIContext.createFromDOM(configElmt, uiContext)
        );
    
        AccessorsUtilities.createAccessorsFromDOM(configElmt, OLMapView._accessorSpecs, view._accessors);
        SettingsUtilities.collectSettingsFromDOM(configElmt, view.getSettingSpecs(), view._settings);
        OLMapView._configure(view, configuration);
    
        view._internalValidate();
        view._initializeUI();
        return view;
    };

    /**
     * @static
     * @param {Exhibit.OLMapView} view
     * @param {Object} configuration
     */
    OLMapView._configure = function(view, configuration) {
        var accessors;
        AccessorsUtilities.createAccessors(configuration, OLMapView._accessorSpecs, view._accessors);
        SettingsUtilities.collectSettings(configuration, view.getSettingSpecs(), view._settings);
        
        accessors = view._accessors;
        view._getLatlng = (typeof accessors.getLatlng !== "undefined" && accessors.getLatlng !== null) ?
            function(itemID, database, visitor) {
                accessors.getProxy(itemID, database, function(proxy) {
                    accessors.getLatlng(proxy, database, visitor);
                });
            } : 
        null;

        view._markerLabelExpression = ExpressionParser.parse(view._settings.markerLabel);
    };

    /**
     *
     */
    OLMapView.prototype.dispose = function() {
        var view = this;
        $(this.getUIContext().getCollection().getElement()).unbind(
            "onItemsChanged.exhibit",
            view._onItemsChanged
        );

        this._map.destroy();    
        this._map = null;
    
        if (this._selectListener !== null) {
            this._selectListener.dispose();
            this._selectListener = null;
        }
        this._itemIDToMarker = {};
        this._markerCache = null;
    
        this._dom.dispose();
        this._dom = null;
    
        this._dispose();
    };

    /**
     * @private
     */
    OLMapView.prototype._internalValidate = function() {
        var exhibit, selectCoordinator, self;
        exhibit = this.getUIContext().getMain();
        if (this._accessors.getColorKey !== null) {
            if (this._settings.colorCoder !== null) {
                this._colorCoder = exhibit.getComponent(this._settings.colorCoder);
            }
        
            if (this._colorCoder === null) {
                this._colorCoder = new DefaultColorCoder(this.getUIContext());
            }
        }
        if (this._accessors.getSizeKey !== null) {
            if (this._settings.sizeCoder !== null) {
                this._sizeCoder = exhibit.getComponent(this._settings.sizeCoder);
                if (typeof this._settings.markerScale !== "undefined" && this._settings.markerScale !== null) {
                    this._sizeCoder._settings.markerScale = this._settings.markerScale;
                }
            }
        }
        if (this._accessors.getIconKey !== null) {  
            if (this._settings.iconCoder !== null) {
                this._iconCoder = exhibit.getComponent(this._settings.iconCoder);
            }
        }
        if (typeof this._settings.selectCoordinator !== "undefined") {
            selectCoordinator = exhibit.getComponent(this._settings.selectCoordinator);
            if (selectCoordinator !== null) {
                self = this;
                this._selectListener = selectCoordinator.addListener(function(o) {
                    self._select(o);
                });
            }
        }
    };

    /**
     * @private
     */
    OLMapView.prototype._initializeUI = function() {
        var self, legendWidgetSettings, mapDiv;
        self = this;
        legendWidgetSettings = {};
        legendWidgetSettings.colorGradient = (this._colorCoder !== null && typeof this._colorCoder._gradientPoints !== "undefined");
        legendWidgetSettings.colorMarkerGenerator = this._createColorMarkerGenerator();
        legendWidgetSettings.sizeMarkerGenerator = this._createSizeMarkerGenerator();
        legendWidgetSettings.iconMarkerGenerator = this._createIconMarkerGenerator();

        $(this.getContainer()).empty();
    
        this._dom = ViewUtilities.constructPlottingViewDom(
            this.getContainer(), 
            this.getUIContext(), 
            this._settings.showSummary && this._settings.showHeader,
            {
                "onResize": function() { 
                    self._map.checkResize(); 
                } 
            },
            legendWidgetSettings
        );
    
        mapDiv = this._dom.plotContainer;
        $(mapDiv)
            .attr("class", "exhibit-mapView-map")
            .css("height", this._settings.mapHeight);
    
        this._map = this._constructMap(mapDiv);
        this._reconstruct();
    };

    OLMapView.prototype._constructMap = function(mapDiv) {
        var settings, map, osm, aerial, availableLayers, availability, vectors, self, selectControl;

        settings = this._settings;

        if (typeof settings.projection !== "undefined" && settings.projection !== null) {
	        this._projection = settings.projection();
        } else {
            this._projection = new OpenLayers.Projection("EPSG:4326");
        }

        if (typeof settings.mapConstructor !== "undefined" && settings.mapConstructor !== null) {
            return settings.mapConstructor(mapDiv);
        } else {
            map = new OpenLayers.Map({
		        "div": mapDiv,
		        "controls": [],
		        "projection": new OpenLayers.Projection("EPSG:900913"),
		        "displayProjection": this._projection,
	            "units": "m",
	            "numZoomLevels": 18,
	            "maxResolution": 156543.0339,
	            "maxExtent": new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
                "theme": null
            });

	        osm = new OpenLayers.Layer.OSM(
                "Street",
                settings.mapURL,
                { "wrapDateLine": true,
                  "attribution": "&copy; <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors. Tiles Courtesy of <a href='http://www.mapquest.com/' target='_blank'>MapQuest</a> <img src='http://developer.mapquest.com/content/osm/mq_logo.png'>" });
	        osm.setVisibility(false);

            aerial = new OpenLayers.Layer.OSM(
		        "Aerial",
		        settings.aerialURL,
                { "wrapDateLine": true,
                  "attribution": "Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency. Tiles Courtesy of <a href='http://www.mapquest.com/' target='_blank'>MapQuest</a> <img src='http://developer.mapquest.com/content/osm/mq_logo.png'>" });
	        aerial.setVisibility(false);

	        availableLayers = [osm, aerial];
	        availability = { "osm": osm, "aerial": aerial };

            // Use Vector layer instead of Markers for markers, because
            // markers can then be combined with polygons/polylines in the
            // same map layer without needing to sort out which layer is
            // receiving clicks.  Also simplifies matters.
	        vectors = new OpenLayers.Layer.Vector("Features", { "wrapDateLine": true, "projection": new OpenLayers.Projection("EPSG:900913") });
	        availableLayers.push(vectors);
            
	        if (typeof availability[settings.type] !== "undefined") {
	            availability[settings.type].setVisibility(true);
	        } else {
	            osm.setVisibility(true);
	        }

            map.addLayers(availableLayers);

            if (settings.center !== null && typeof settings.center[0] !== "undefined" && typeof settings.center[1] !== "undefined") {
                if (settings.zoom !== null) {
                    map.setCenter(new OpenLayers.LonLat(settings.center[1], settings.center[0]).transform(this._projection, map.getProjectionObject()), settings.zoom);
                } else {
                    map.setCenter(new OpenLayers.LonLat(settings.center[1], settings.center[0]).transform(this._projection, map.getProjectionObject()));
                }
            }
            
            map.addControl(new OpenLayers.Control.PanPanel());
            if (settings.overviewControl) {
                map.addControl(new OpenLayers.Control.OverviewMap());
            }
            if (settings.scaleControl) {
                map.addControl(new OpenLayers.Control.ZoomPanel());
            }
            
	        self = this;
            selectControl = new OpenLayers.Control.SelectFeature(vectors, {
                "onSelect": function(feature) {
		            self._onFeatureSelect(self, feature);
	            },
	            "onUnselect": function(feature) {
	                self._onFeatureUnselect(self, feature);
	            }
	        });
            map.addControl(selectControl);
	        selectControl.activate();
            
	        map.addControl(new OpenLayers.Control.Navigation(settings.scrollWheelZoom, true, OpenLayers.Handler.MOD_SHIFT, true));
            
            map.addControl(new OpenLayers.Control.LayerSwitcher());

            map.addControl(new OpenLayers.Control.Attribution());

            // @@@ replace
            // map.events.register("click", null, SimileAjax.WindowManager.cancelPopups);

            return map;
        }
    };

    /**
     * @private
     * @returns {Function}
     */
    OLMapView.prototype._createColorMarkerGenerator = function() {
        var settings = this._settings;

        return function(color) {
            return $.simileBubble(
                "createTranslucentImage",
                Marker.makeIcon(settings.shapeWidth, settings.shapeHeight, color, null, null, settings.iconSize, settings).iconURL,
                "middle"
            );
        };
    };

    /**
     * @returns {Function}
     */
    OLMapView.prototype._createSizeMarkerGenerator = function() {
        var settings = $.extend({}, this._settings);
        settings.pinHeight = 0;
        return function(iconSize) {
            return $.simileBubble(
                "createTranslucentImage",
                Marker.makeIcon(settings.shapeWidth, settings.shapeHeight, settings.color, null, null, iconSize, settings).iconURL,
                "middle"
            );
        };
    };

    /**
     * @private
     * @returns {Function}
     */
    OLMapView.prototype._createIconMarkerGenerator = function() {
        return function(iconURL) {
            var elmt = $("img")
                .attr("src", iconURL)
                .css("vertical-align", "middle")
                .css("height", 40);
            return $(elmt).get(0);
        };
    };

    /**
     * @private
     */
    OLMapView.prototype._clearOverlays = function() {
        var vectorLayer;
        vectorLayer = this._map.getLayersByClass("OpenLayers.Layer.Vector");
        if (vectorLayer.length === 1) {
            vectorLayer[0].destroyFeatures();
        }

        while (this._map.popups.length > 0) {
            this._map.removePopup(this._map.popups[0]);
        }
    };

    OLMapView.prototype._reconstruct = function() {
        var currentSize, unplottableItems;

        this._clearOverlays();

        if (typeof this._dom.legendWidget !== "undefined" && this._dom.legendWidget !== null) {
	        this._dom.legendWidget.clear();
        }

        if (typeof this._dom.legendGradientWidget !== "undefined" && this._dom.legendWidgetGradient !== null) {
            this._dom.legendGradientWidget.reconstruct();
        }

        this._itemIDToMarker = {};
    
        currentSize = this.getUIContext().getCollection().countRestrictedItems();
        unplottableItems = [];

        if (currentSize > 0) {
            this._rePlotItems(unplottableItems);
        }

        this._dom.setUnplottableMessage(currentSize, unplottableItems);
    };

    /**
     * @private
     * @param {Array} unplottableItems
     */
    OLMapView.prototype._rePlotItems = function(unplottableItems) {
        var self, collection, database, settings, accessors, currentSet, locationToData, hasColorKey, hasSizeKey, hasIconKey, hasIcon, hasPoints, hasPolygons, hasPolylines, colorCodingFlags, sizeCodingFlags, iconCodingFlags, makeLatLng,  bounds, maxAutoZoom, addMarkerAtLocation, latlngKey, legendWidget, colorCoder, keys, legendGradientWidget, k, key, color, sizeCoder, points, space, i, size, iconCoder, icon, zoom;
        self = this;
        collection = this.getUIContext().getCollection();
        database = this.getUIContext().getDatabase();
        settings = this._settings;
        accessors = this._accessors;

        currentSet = collection.getRestrictedItems();
        locationToData = {};
        hasColorKey = (accessors.getColorKey !== null);
        hasSizeKey = (accessors.getSizeKey !== null);
        hasIconKey = (accessors.getIconKey !== null);
        hasIcon = (accessors.getIcon !== null);
    
        hasPoints = (this._getLatlng !== null);
        hasPolygons = (accessors.getPolygon !== null);
        hasPolylines = (accessors.getPolyline !== null);

        colorCodingFlags = {
            "mixed": false,
            "missing": false,
            "others": false,
            "keys": new Set()
        };
        sizeCodingFlags = {
            "mixed": false,
            "missing": false,
            "others": false,
            "keys": new Set()
        };
        iconCodingFlags = {
            "mixed": false,
            "missing": false,
            "others": false,
            "keys": new Set()
        };

        makeLatLng = settings.latlngOrder === "latlng" ? 
        function(first, second) {
            return new OpenLayers.Geometry.Point(second, first);
        } :
        function(first, second) {
            return new OpenLayers.Geometry.Point(first, second);
        };
        
        currentSet.visit(function(itemID) {
            var latlngs, polygons, polylines, color, colorKeys, sizeKeys, iconKeys, n, latlng, latlngKey, locationData, p;
            latlngs = [];
            polygons = [];
            polylines = [];
            
            if (hasPoints) {
                self._getLatlng(itemID, database, function(v) {
                    if (v !== null && v.hasOwnProperty("lat") && v.hasOwnProperty("lng")) {
                        latlngs.push(v);
                    }
                });
            }
            if (hasPolygons) {
                accessors.getPolygon(itemID, database, function(v) {
                    if (v !== null) {
                        polygons.push(v);
                    }
                });
            }
            if (hasPolylines) {
                accessors.getPolyline(itemID, database, function(v) {
                    if (v !== null) {
                        polylines.push(v);
                    }
                });
            }
            
            if (latlngs.length > 0 || polygons.length > 0 || polylines.length > 0) {
                color = self._settings.color;
                
                colorKeys = null;
                if (hasColorKey) {
                    colorKeys = new Set();
                    accessors.getColorKey(itemID, database, function(v) {
                        colorKeys.add(v);
                    });
                    
                    color = self._colorCoder.translateSet(colorKeys, colorCodingFlags);
                }
                
                if (latlngs.length > 0) {
                    sizeKeys = null;
                    if (hasSizeKey) {
                        sizeKeys = new Set();
                        accessors.getSizeKey(itemID, database, function(v) {
                            sizeKeys.add(v);
                        });
                    }
                    iconKeys = null;
                    if (hasIconKey) {
                        iconKeys = new Set();
                        accessors.getIconKey(itemID, database, function(v) {
                            iconKeys.add(v);
                        });
                    }
                    for (n = 0; n < latlngs.length; n++) {
                        latlng = latlngs[n];
                        latlngKey = latlng.lat + "," + latlng.lng;
                        if (locationToData.hasOwnProperty(latlngKey)) {
                            locationData = locationToData[latlngKey];
                            locationData.items.push(itemID);
                            if (hasColorKey) {
                                locationData.colorKeys.addSet(colorKeys);
                            }
                            if (hasSizeKey) {
                                locationData.sizeKeys.addSet(sizeKeys);
                            }
                            if (hasIconKey) {
                                locationData.iconKeys.addSet(iconKeys);
                            }
                        } else {
                            locationData = {
                                latlng:     latlng,
                                items:      [ itemID ]
                            };
                            if (hasColorKey) {
                                locationData.colorKeys = colorKeys;
                            }
                            if (hasSizeKey) {
                                locationData.sizeKeys = sizeKeys;
                            }
                            if (hasIconKey) {
                                locationData.iconKeys = iconKeys;
                            }
                            locationToData[latlngKey] = locationData;
                        }
                    }
                }
            
                for (p = 0; p < polygons.length; p++) {
                    self._plotPolygon(itemID, polygons[p], color, makeLatLng); 
                }
                for (p = 0; p < polylines.length; p++) {
                    self._plotPolyline(itemID, polylines[p], color, makeLatLng); 
                }
            } else {
                unplottableItems.push(itemID);
            }
        });
    
        maxAutoZoom = Infinity;
        addMarkerAtLocation = function(locationData) {
            var itemCount, shape, color, iconSize, icon, point, layer, marker, popup, popupContent, x;
            itemCount = locationData.items.length;
            if (typeof bounds === "undefined" || bounds === null) {
                bounds = new OpenLayers.Bounds();
            }
            
            shape = self._settings.shape;
            
            color = self._settings.color;
            if (hasColorKey) {
                color = self._colorCoder.translateSet(locationData.colorKeys, colorCodingFlags);
            }

            iconSize = self._settings.iconSize;
            if (hasSizeKey) {
                iconSize = self._sizeCoder.translateSet(locationData.sizeKeys, sizeCodingFlags);
            }
            
            icon = null;
            if (itemCount === 1) {
                if (hasIcon) {
                    accessors.getIcon(locationData.items[0], database, function(v) { icon = v; });
                }
            }
            if (hasIconKey) {
                icon = self._iconCoder.translateSet(locationData.iconKeys, iconCodingFlags);
            }

            point = new OpenLayers.LonLat(locationData.latlng.lng, locationData.latlng.lat).transform(self._projection, self._map.getProjectionObject());
            marker = self._makeMarker(
                point,
                shape,
                color, 
                iconSize,
                icon,
                itemCount === 1 ? "" : itemCount.toString(),
                self._settings
            );
            marker.map = self._map;
            marker.attributes = { "locationData": locationData };
	        layer = self._map.getLayersByClass("OpenLayers.Layer.Vector")[0];
	        layer.addFeatures([marker]);

            popupContent = self._createInfoWindow(locationData.items);
            popup = new OpenLayers.Popup.FramedCloud(
                "markerPoup"+Math.floor(Math.random() * 10000),
                point,
		        new OpenLayers.Size(200, 200), // arbitrary, autoresized later
                $(popupContent).html(),
                null,
                true
            );
            // constructor only takes a string as opposed to adorned DOM,
            // so until it can take a DOM element, pass in string and replace
            // it underhandedly with DOM.
            marker.attributes.dom = popupContent;
            marker.popup = popup;
            popup.feature = marker;
            popup.autoSize = true;

            if (maxAutoZoom > locationData.latlng.maxAutoZoom) {
                maxAutoZoom = locationData.latlng.maxAutoZoom;
            }
            bounds.extend(point);
            
            for (x = 0; x < locationData.items.length; x++) {
                self._itemIDToMarker[locationData.items[x]] = marker;
            }
        };
        
        for (latlngKey in locationToData) {
            if (locationToData.hasOwnProperty(latlngKey)) {
                addMarkerAtLocation(locationToData[latlngKey]);
            }
        }
        if (hasColorKey) {
            legendWidget = this._dom.legendWidget;
            colorCoder = this._colorCoder;
            keys = colorCodingFlags.keys.toArray().sort();
            if (settings.colorLegendLabel !== null) {
                legendWidget.addLegendLabel(settings.colorLegendLabel, 'color');
            }
            if (typeof colorCoder._gradientPoints !== "undefined" && colorCoder._gradientPoints !== null) {
                legendGradientWidget = this._dom.legendWidget;
                legendGradientWidget.addGradient(this._colorCoder._gradientPoints);
                if (typeof settings.colorLegendLabel !== "undefined" && settings.colorLegendLabel !== null) {
                    legendGradientWidget.addLegendLabel(settings.colorLegendLabel);
                }
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
    
        if (hasSizeKey) {
            legendWidget = this._dom.legendWidget;
            sizeCoder = this._sizeCoder;
            keys = sizeCodingFlags.keys.toArray().sort();    
            if (settings.sizeLegendLabel !== null) {
                legendWidget.addLegendLabel(settings.sizeLegendLabel, 'size');
            }
            if (sizeCoder._gradientPoints !== null) {
                points = sizeCoder._gradientPoints;
                space = (points[points.length - 1].value - points[0].value)/5;
                keys = [];
                for (i = 0; i < 6; i++) {
                    keys.push(Math.floor(points[0].value + space*i));
                }
                for (k = 0; k < keys.length; k++) {
                    key = keys[k];
                    size = sizeCoder.translate(key);
                    legendWidget.addEntry(size, key, 'size');
                }
            } else {       
                for (k = 0; k < keys.length; k++) {
                    key = keys[k];
                    size = sizeCoder.translate(key);
                    legendWidget.addEntry(size, key, 'size');
                }
                if (sizeCodingFlags.others) {
                    legendWidget.addEntry(sizeCoder.getOthersSize(), sizeCoder.getOthersLabel(), 'size');
                }
                if (sizeCodingFlags.mixed) {
                    legendWidget.addEntry(sizeCoder.getMixedSize(), sizeCoder.getMixedLabel(), 'size');
                }
                if (sizeCodingFlags.missing) {
                    legendWidget.addEntry(sizeCoder.getMissingSize(), sizeCoder.getMissingLabel(), 'size');
                }
            }
        } 

        if (hasIconKey) {
            legendWidget = this._dom.legendWidget;
            iconCoder = this._iconCoder;
            keys = iconCodingFlags.keys.toArray().sort();    
            if (settings.iconLegendLabel !== null) {
                legendWidget.addLegendLabel(settings.iconLegendLabel, 'icon');
            }      
            for (k = 0; k < keys.length; k++) {
                key = keys[k];
                icon = iconCoder.translate(key);
                legendWidget.addEntry(icon, key, 'icon');
            }
            if (iconCodingFlags.others) {
                legendWidget.addEntry(iconCoder.getOthersIcon(), iconCoder.getOthersLabel(), 'icon');
        }
            if (iconCodingFlags.mixed) {
                legendWidget.addEntry(iconCoder.getMixedIcon(), iconCoder.getMixedLabel(), 'icon');
            }
            if (iconCodingFlags.missing) {
                legendWidget.addEntry(iconCoder.getMissingIcon(), iconCoder.getMissingLabel(), 'icon');
            }
        }  
        
        if (typeof bounds !== "undefined" && bounds !== null && settings.zoom === null && !this._shown) {
            if (maxAutoZoom > 12) {
                maxAutoZoom = 12;
            }
            zoom = Math.max(0, self._map.getZoomForExtent(bounds) - 1);
            zoom = Math.min(zoom, maxAutoZoom);
            self._map.zoomTo(zoom);
        } else {
	        self._map.zoomTo(settings.zoom);
        }

        if (typeof bounds !== "undefined" && bounds !== null && settings.zoom === null && settings.center === null) {
            self._map.setCenter(bounds.getCenterLonLat());
        }

        this._shown = true;
    };

    /**
     * @private
     * @param {String} itemID
     * @param {String} polygonString
     * @param {String} color
     * @param {Function} makeLatLng
     * @returns {OpenLayers.Feature.Vector}
     */
    OLMapView.prototype._plotPolygon = function(itemID, polygonString, color, makeLatLng) {
        var coords, settings, borderColor, polygon, polygonStyle, polygonFeature;
        coords = this._parsePolygonOrPolyline(polygonString, makeLatLng);
        if (coords.length > 1) {
            settings = this._settings;
            borderColor = settings.borderColor !== null ? settings.borderColor : color;
            polygon = new OpenLayers.Geometry.LinearRing(coords).transform(this._projection, this._map.getProjectionObject());
	        polygonStyle = {
	            "strokeColor": borderColor,
	            "strokeWidth": settings.borderWidth,
	            "strokeOpacity": settings.borderOpacity,
	            "fillColor": color,
	            "fillOpacity": settings.opacity
	        };
	        polygonFeature = new OpenLayers.Feature.Vector(polygon, null, polygonStyle);
            polygonFeature.map = this._map;
            polygonFeature.attributes = { "locationData": { "items" : [itemID] } };
            return this._addPolygonOrPolyline(itemID, polygonFeature);
        }
        return null;
    };
    
    /**
     * @private
     * @param {String} itemID
     * @param {String} polylineString
     * @param {String} color
     * @param {Function} makeLatLng
     * @returns {OpenLayers.Feature.Vector}
     */
    OLMapView.prototype._plotPolyline = function(itemID, polylineString, color, makeLatLng) {
        var coords, settings, borderColor, polyline, polylineStyle, polylineFeature;
        coords = this._parsePolygonOrPolyline(polylineString, makeLatLng);
        if (coords.length > 1) {
            settings = this._settings;
            borderColor = settings.borderColor !== null ? settings.borderColor : color;
            polyline = new OpenLayers.Geometry.LineString(coords).transform(this._projection, this._map.getProjectionObject());
	        polylineStyle = {
	            "strokeColor": borderColor,
	            "strokeWidth": settings.borderWidth,
	            "strokeOpacity": settings.borderOpacity
	        };
	        polylineFeature = new OpenLayers.Feature.Vector(polyline, null, polylineStyle);
            polylineFeature.map = this._map;
            polylineFeature.attributes = { "locationData": { "items" : [itemID] } };

            return this._addPolygonOrPolyline(itemID, polylineFeature);
        }
        return null;
    };

    /**
     * @param {String} itemID
     * @param {OpenLayers.Feature.Vector} poly
     * @returns {OpenLayers.Feature.Vector}
     */
    OLMapView.prototype._addPolygonOrPolyline = function(itemID, poly) {
        var vectors, vectorLayer, self, centroid, popup;
        vectors = this._map.getLayersByClass("OpenLayers.Layer.Vector");
        if (vectors.length > 0) {
	        vectorLayer = vectors[0];
	        vectorLayer.addFeatures([poly]);
        } else {
	        return null;
        }
    
        self = this;
        centroid = poly.geometry.getCentroid();
        popup = new OpenLayers.Popup.FramedCloud(
            "vectorPopup"+Math.floor(Math.random() * 10000),
            new OpenLayers.LonLat(centroid.x, centroid.y),
            null,
            self._createInfoWindow([ itemID ]).innerHTML,
            null,
            true
        );
        poly.popup = popup;
        popup.feature = poly;
        popup.autoSize = true;

        this._itemIDToMarker[itemID] = poly;
    
        return poly;
    };

    /**
     * @param {String} s
     * @param {Function} makeLatLng
     * @returns {Array}
     */
    OLMapView.prototype._parsePolygonOrPolyline = function(s, makeLatLng) {
        var coords, a, i, pair;
        coords = [];
        
        a = s.split(this._settings.latlngPairSeparator);
        for (i = 0; i < a.length; i++) {
            pair = a[i].split(",");
            coords.push(makeLatLng(parseFloat(pair[0]), parseFloat(pair[1])));
        }
        
        return coords;
    };

    /**
     * @param {OLMapView} self
     * @param {OpenLayers.Feature.Vector} feature
     */
    OLMapView.prototype._onFeatureSelect = function(self, feature) {
        self._map.addPopup(feature.popup, true);
        $(feature.popup.contentDiv).html(feature.attributes.dom);
        if (self._selectListener !== null) {
            self._selectListener.fire({
                "itemIDs": feature.attributes.locationData.items
            });
        }
    };

    /**
     * @param {OLMapView} self
     * @param {OpenLayers.Feature.Vector} feature
     */
    OLMapView.prototype._onFeatureUnselect = function(self, feature) {
        // @@@ replace
        // SimileAjax.WindowManager.cancelPopups();
        self._map.removePopup(feature.popup);
    };

    /**
     * @param {Object} selection
     */
    OLMapView.prototype._select = function(selection) {
        var self, itemID, marker;
        self = this;
        itemID = selection.itemIDs[0];
        marker = this._itemIDToMarker[itemID];
        if (typeof marker !== "undefined" && marker !== null) {
            self._map.addPopup(marker.popup, true);
            marker.popup.show();
        }
    };

    /**
     * @param {Array} items
     * @returns {Element}
     */
    OLMapView.prototype._createInfoWindow = function(items) {
        return ViewUtilities.fillBubbleWithItems(
            null, 
            items,
            items._markerLabelExpression,
            this.getUIContext()
        );
    };

    /**
     * @static
     * @param {MapExtension.Marker} marker
     * @param {OpenLayers.LonLat} position
     * @returns {OpenLayers.Marker}
     */
    OLMapView.markerToMap = function(marker, position) {
        var icon, shadow, m;
        icon = marker.getIcon();
	    return new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(position.lon, position.lat),
            null,
            {
                "fill": false,
                "stroke": false,
                "graphic": true,
                "externalGraphic": icon.url,
                "graphicWidth": icon.size[0],
                "graphicHeight": icon.size[1],
                "graphicXOffset": -icon.anchor[0],
                "graphicYOffset": -icon.anchor[1]
            }
        );
    };

    /**
     * Update a cached marker's display icon.
     * @param {String} key
     * @param {String} iconURL
     */
    OLMapView.prototype.updateMarkerIcon = function(key, iconURL) {
        var cached;
        cached = this._markerCache[key];
        if (typeof cached !== "undefined" && cached !== null) {
            cached.style.externalGraphic = iconURL;
            // Suboptimal, hard to avoid.  At least it doesn't appear
            // like it's being redrawn for every icon to the user, unless
            // watching the CPU usage.
            cached.layer.redraw();
        }
    };

    /**
     * @private
     * @param {Object} position
     * @param {String} shape
     * @param {String} color
     * @param {Numeric} iconSize
     * @param {String} iconURL
     * @param {String} label
     * @param {Object} settings
     * @returns {OpenLayers.Marker}
     */
    OLMapView.prototype._makeMarker = function(position, shape, color, iconSize, iconURL, label, settings) {
        var key, cached, marker, gmarker;
        
        key = Marker._makeMarkerKey(shape, color, iconSize, iconURL, label);

        cached = this._markerCache[key];

        // The settings comparison is of dubious use; ideally the settings
        // would be an actual type and have a comparison method instead of
        // assuming all settings refer to the same location in memory.  Also,
        // it's a bit unclear under what circumstances it would ever be
        // different.
        if (typeof cached !== "undefined" && (cached.settings === settings)) {
	        gmarker = OLMapView.markerToMap(cached, position);
        } else {
            marker = Marker.makeMarker(shape, color, iconSize, iconURL, label, settings, this);
            gmarker = OLMapView.markerToMap(marker, position);
	        this._markerCache[key] = gmarker;
        }
        return gmarker;
    };

    return OLMapView;
});
