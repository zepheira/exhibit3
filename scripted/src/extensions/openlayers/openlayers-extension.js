/**
 * @fileOverview An extension to Exhibit adding a Google Maps v3 view.
 * @author David Huynh
 * @author <a href="mailto:karger@mit.edu">David Karger</a>
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "require",
    "module",
    "lib/jquery",
    "scripts/util/localizer",
    "scripts/util/debug",
    "exhibit",
    "ext/map/scripts/base",
    "ext/map/scripts/marker",
    "ext/map/scripts/canvas",
    "ext/map/scripts/painter",
    "i18n!ext/map/nls/locale",
    "./scripts/openlayers-view"
], function(require, module, $, _, Debug, Exhibit, MapExtension, Painter, Marker, Canvas, Locale, OLMapView) {
    MapExtension.Painter = Painter;
    MapExtension.Canvas = Canvas;
    MapExtension.Marker = Marker;
    MapExtension.OLMapView = OLMapView;

    MapExtension.bundledCssFile = "styles/openlayers-extension-bundle.css";
    MapExtension.openLayersVersion = "2.13.1";

    /**
     * @param {Exhibit} ex
     */
    MapExtension.register = function(ex) {
        ex.MapExtension = MapExtension;
        ex.OLMapView = OLMapView;
    };

    MapExtension.setup = function() {
        var prefix, url, i, conf, targets, keyArg;
        
        $(document).trigger("loadLocale.exhibit", Locale);
        url = null;
        conf = module.config();

        if (typeof Exhibit_MapExtension_urlPrefix === "string") {
            prefix = Exhibit_MapExtension_urlPrefix;
        }  else if (conf !== null && conf.hasOwnProperty("prefix")) {
            prefix = conf.prefix;
        } else {
            targets = ["/openlayers-extension.js", "/openlayers-extension-bundle.js"];
            for (i = 0; i < targets.length; i++) {
                url = Exhibit.findScript(document, targets[i]);
                if (url !== null) {
                    prefix = url.substr(0, url.indexOf(targets[i]));
                    break;
                }
            }
            if (url === null) {
                Debug.exception(new Error("Failed to derive URL prefix for SIMILE Exhibit OpenLayers Map Extension files"));
                return;
            }
        }
    
        if (prefix.substr(-1) !== "/") {
            prefix += "/";
        }

        MapExtension.urlPrefix = prefix;
        if (typeof Exhibit_MapExtension_parameters !== "undefined") {
            MapExtension.params = Exhibit.parseURLParameters(Exhibit_MapExtension_parameters, MapExtension.params, MapExtension.paramTypes);
        } else if (conf !== null) {
            MapExtension.params = conf;
        } else if (url !== null) {
            MapExtension.params = Exhibit.parseURLParameters(url, MapExtension.params, MapExtension.paramTypes);
        }

        if (typeof MapExtension.params.noStyle === "undefined") {
            MapExtension.params.noStyle = false;
        }
        
        if (!MapExtension.params.noStyle) {
            if (MapExtension.params.bundle) {
                Exhibit.includeCssFile(document, MapExtension.urlPrefix + MapExtension.bundledCssFile);
            } else {
                Exhibit.includeCssFiles(document, MapExtension.urlPrefix, MapExtension.cssFiles);
            }
        }

        if (typeof MapExtension.params.service === "string") {
            Debug.warn(_("%MapExtension.error.serviceDeprecated"));
        }
    };

    $(document).ready(MapExtension.setup);

    return MapExtension;
});
