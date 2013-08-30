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
    "urlArgs": "bust=" + (new Date()).getTime(),
    "config": {
        "exhibit": {
            "prefix": "/exhibit/api/",
            "bundle": false
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
        }
    },
    "paths": {
        "lib": "lib",
        "nls": "nls",
        "ext": "extensions",
        "map": "extensions/map/scripts",
        "time": "extensions/time/scripts",
        "invalid-json": "extensions/invalid-json/scripts",
        "async": "lib/async",
        "i18n": "lib/i18n",
        "timeline": "/timeline/api/timeline-bundle",
        "simile-ajax": "/ajax/api/simile-ajax-bundle",
        "openlayers": "extensions/openlayers/lib/OpenLayers"
    },
    "shim": {
        "lib/jquery": {
            "exports": "jQuery"
        },
        "lib/json2": {
            "exports": "JSON"
        },
        "lib/sprintf": {
            "exports": "vsprintf"
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
        },
        "extensions/flot/lib/jquery.flot": {
            "deps": ["lib/jquery"]
        },
        "extensions/flot/lib/jquery.flot.pie": {
            "deps": ["extensions/flot/lib/jquery.flot.pie"]
        }
    }
});
