/**
 * @fileOverview An extension to Exhibit adding a Google Maps v2 view.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

/**
 * You must include:
 *   define("gmaps2", "http://maps.google.com/maps?file=api&v=2&sensor=false&key={API_KEY}");
 * in your RequireJS configuration.  Note that Google Maps v2 is deprecated
 * and will start wrapping Google Maps v3 late in 2013.  Use of v2 is not
 * encouraged, and this material is both untested and unmaintained.  Switch
 * to v3.
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
    "./scripts/gmap2-view"
], function(require, module, $, _, Debug, Exhibit, MapExtension, Painter, Marker, Canvas, Locale, GoogleMaps2View) {
    MapExtension.Painter = Painter;
    MapExtension.Canvas = Canvas;
    MapExtension.Marker = Marker;

    /**
     * @param {Exhibit} ex
     */
    MapExtension.register = function(ex) {
        ex.MapExtension = MapExtension;
        ex.GoogleMaps2View = GoogleMaps2View;
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

        if (typeof MapExtension.params.noStyle === "undefined") {
            MapExtension.params.noStyle = false;
        }
        
        if (!MapExtension.params.noStyle) {
            if (MapExtension.params.bundle) {
                Exhibit.includeCssFiles(document, MapExtension.urlPrefix, MapExtension.cssFiles);
            } else {
                Exhibit.includeCssFile(document, MapExtension.urlPrefix + MapExtension.bundledCssFile);
            }
        }

        if (Exhibit.params.gmapKey !== null) {
            keyArg = "&key=" + Exhibit.params.gmapKey;
        } else {
            keyArg = "";
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
