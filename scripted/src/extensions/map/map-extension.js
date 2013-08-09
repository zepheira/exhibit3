/**
 * @fileOverview An extension to Exhibit adding a map view with options for
 *    different mapping services.
 * @author David Huynh
 * @author <a href="mailto:karger@mit.edu">David Karger</a>
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "require",
    "lib/jquery",
    "exhibit",
    "./scripts/base",
    "./scripts/marker",
    "./scripts/canvas",
    "./scripts/painter",
    "i18n!ext/map/nls/locale",
    "./scripts/map-view"
    // @@@requirejs + multiple options for mapping = bad
    // "map/google-maps-v2-view"
], function(require, $, Exhibit, MapExtension, Painter, Marker, Canvas, Locale) {
    var cssFiles, paramTypes, url, cssURLs, i;

    $(document).trigger("loadLocale.exhibit", Locale);
        
    Exhibit.MapExtension = MapExtension;
    Exhibit.MapExtension.Painter = Painter;
    Exhibit.MapExtension.Canvas = Canvas;
    Exhibit.MapExtension.Marker = Marker;

    cssFiles = [
        "map-view.css"
    ];
    paramTypes = {
        "bundle": Boolean,
        "service": String,
        "gmapKey": String,
        "mapPrefix": String
    };
        
    if (typeof Exhibit_MapExtension_urlPrefix === "string") {
        Exhibit.MapExtension.urlPrefix = Exhibit_MapExtension_urlPrefix;
        if (typeof Exhibit_MapExtension_parameters !== "undefined") {
            Exhibit.parseURLParameters(
                Exhibit_MapExtension_parameters,
                Exhibit.MapExtension.params,
                paramTypes
            );
        }
    } else {
        //url = Exhibit.findScript(document, "/map-extension.js");
        //if (url === null) {
        //    Exhibit.Debug.exception(new Error("Failed to derive URL prefix for SIMILE Exhibit Map Extension files"));
        //    return;
        //}
        //Exhibit.MapExtension.urlPrefix = url.substr(0, url.indexOf("map-extension.js"));
            
        //Exhibit.parseURLParameters(
        //    url,
        //    Exhibit.MapExtension.params,
        //    paramTypes
        //);
    }
        
    cssURLs = [];

    if (Exhibit.MapExtension.params.service === "google2" &&
        typeof GMap2 === "undefined") {
/**        if (typeof Exhibit.params.gmapKey !== "undefined") {
            require("http://maps.google.com/maps?file=api&v=2&sensor=false&callback=Exhibit.MapExtension.noop&async=2&key=" + Exhibit.params.gmapKey);
        } else if (typeof Exhibit.MapExtension.params.gmapKey !== "undefined") {
	        require("http://maps.google.com/maps?file=api&v=2&sensor=false&callback=Exhibit.MapExtension.noop&async=2&key=" + Exhibit.MapExtension.params.gmapKey);
        } else {
	        require("http://maps.google.com/maps?file=api&v=2&sensor=false&callback=Exhibit.MapExtension.noop&async=2");
        }
        */
        //if (!Exhibit.MapExtension.params.bundle) {
            Exhibit.GoogleMaps2View = require("./scripts/google-maps-v2-view");
        //}
    } else {
        // if author is referring to an unknown service, default to google
        //if (!Exhibit.MapExtension.params.bundle) {
            Exhibit.MapView = require("./scripts/map-view");
        //}
    }
        
    // @@@ ideally these bundles would be service-specific instead of
    // loading everything
    //if (Exhibit.MapExtension.params.bundle) {
        //scriptURLs.push(Exhibit.MapExtension.urlPrefix + "map-extension-bundle.js");
   //     cssURLs.push(Exhibit.MapExtension.urlPrefix + "styles/map-extension-bundle.css");
   // } else {
   //     Exhibit.prefixURLs(cssURLs, Exhibit.MapExtension.urlPrefix + "styles/", cssFiles);
    //}
    
    Exhibit.includeCssFiles(document, null, cssURLs);

    // end define
    return Exhibit;
});
