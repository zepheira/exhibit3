/**
 * @fileOverview The common parameters of this extension.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(function() {
    var MapExtension = {
        "params": {
            "bundle": false,
            "gmapKey": null,
            "service": null,
            "mapPrefix": "http://api.simile-widgets.org"
        },
        "paramTypes": {
            "bundle": Boolean,
            "service": String,
            "gmapKey": String,
            "mapPrefix": String
        },
        "cssFiles": [ "styles/main.css" ],
        "bundledCssFile": "styles/map-extension-bundle.css",
        "urlPrefix": null,
        "markerUrlPrefix" :"http://service.simile-widgets.org/painter/painter?",
        "initialized": false, // used in the view
        "hasCanvas": false, // used in the view
        "_CORSWarned": false // used in the view
    };

    // end define
    return MapExtension;
});
