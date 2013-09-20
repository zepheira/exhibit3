/**
 * Potentially re-usable config for Exhibit.  Include with the following
 * require block:
 *
 * require(["require", "lib/jquery", "exhibit"],
 *         function(require, $, Exhibit) {
 *     if (typeof window.JSON === "undefined" || window.JSON === null) {
 *         window.JSON = require("lib/json2");
 *     }
 *     $(document).trigger("scriptsLoaded.exhibit");
 *     window.Exhibit = Exhibit; // for debugging
 * });
 *
 */

requirejs.config({
    "baseUrl": "/exhibit/api/",
    "config": {
        "exhibit": {
            "prefix": "/exhibit/api/",
            "bundle": true
        },
        "timeline": {
            "prefix": "/timeline/api/",
            "ajax": "/ajax/api/",
            "bundle": true
        },
        "ext/time/time-extension": {
            "bundle": true,
            "prefix": "/exhibit/api/extensions/time/"
        },
        "ext/map/map-extension": {
            "bundle": true,
            "prefix": "/exhibit/api/extensions/map/"
        },
        "ext/openlayers/openlayers-extension": {
            "bundle": true,
            "prefix": "/exhibit/api/extensions/openlayers/"
        },
        "ext/flot/flot-extension": {
            "bundle": true,
            "prefix": "/exhibit/api/extensions/flot/"
        }
    },
    "paths": {
        "async": "lib/async",
        "i18n": "lib/i18n"
    },
    "shim": {
        "lib/jquery": {
            "exports": "jQuery"
        },
        "lib/json2": {
            "exports": "JSON"
        },
        "lib/base64": {
            "exports": "Base64"
        },
        "lib/jquery.history": {
            "deps": ["lib/jquery"],
            "exports": "History"
        },
        "lib/jquery.history.shim": {
            "deps": ["lib/jquery.history"]
        },
        "lib/jquery.nouislider": {
            "deps": ["lib/jquery"]
        },
        "openlayers": {
            "exports": "OpenLayers"
        }
    }
});
