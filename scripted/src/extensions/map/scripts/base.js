/**
 * @fileOverview The common parameters of this extension.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(function() {
    var MapExtension = {
        "params": {
            "bundle": false,
            "gmapKey": null,
            "service": "google",
            "mapPrefix": "http://api.simile-widgets.org"
        },
        "urlPrefix": null,
        "markerUrlPrefix" :"http://service.simile-widgets.org/painter/painter?",
        "initialized": false, // used in the view
        "hasCanvas": false, // used in the view
        "_CORSWarned": false // used in the view
    };

    // end define
    return MapExtension;
});
