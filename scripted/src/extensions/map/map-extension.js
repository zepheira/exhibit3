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
    "scripts/util/debug",
    "exhibit",
    "./scripts/base",
    "./scripts/marker",
    "./scripts/canvas",
    "./scripts/painter",
    "i18n!ext/map/nls/locale",
    "./scripts/map-view"
], function(require, module, $, _, Exhibit, MapExtension, Painter, Marker, Canvas, Locale, MapView) {
    MapExtension.Painter = Painter;
    MapExtension.Canvas = Canvas;
    MapExtension.Marker = Marker;

    /**
     * @param {Exhibit} ex
     */
    MapExtension.register = function(ex) {
        ex.MapExtension = MapExtension;
        ex.MapView = MapView;
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
            targets = ["/map-extension.js", "/map-extension-bundle.js"];
            for (i = 0; i < targets.length; i++) {
                url = Exhibit.findScript(document, targets[i]);
                if (url !== null) {
                    prefix = url.substr(0, url.indexOf(targets[i]));
                    break;
                }
            }
            if (url === null) {
                Debug.exception(new Error("Failed to derive URL prefix for SIMILE Exhibit Map Extension files"));
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
        
        if (MapExtension.params.bundle) {
            Exhibit.includeCssFiles(document, MapExtension.urlPrefix, MapExtension.cssFiles);
        } else {
            Exhibit.includeCssFile(document, MapExtension.urlPrefix + MapExtension.bundledCssFile);
        }

        if (Exhibit.params.gmapKey !== null) {
            keyArg = "&key=" + Exhibit.params.gmapKey;
        } else {
            keyArg = "";
        }

        if (typeof MapExtension.params.service === "string") {
            Debug.warn(_("%MapExtension.error.serviceDeprecated"));
            if (MapExtension.params.service === "google2") {
                Debug.warn(_("%MapExtension.error.otherExtension", "gmap2"));
            } else if (MapExtension.params.service === "openlayers") {
                Debug.warn(_("%MapExtension.error.otherExtension", "openlayers"));
            }
        }

        /**
         * decent idea, doesn't work; back to the drawing board
        define("gmaps", ["async!https://maps.googleapis.com/maps/api/js?v=3&sensor=false" + keyArg], function() {
            return window.google;
        });
        */
    };

    $(document).ready(MapExtension.setup);

    return MapExtension;
});
