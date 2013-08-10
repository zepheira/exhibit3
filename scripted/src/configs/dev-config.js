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
            "prefix": "http://api.simile.zepheira.com/timeline/3.0.0/",
            "ajax": "http://api.simile.zepheira.com/ajax/3.0.0/",
            "bundle": true
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
        "timeline": "http://api.simile.zepheira.com/timeline/3.0.0/timeline-bundle",
        "simile-ajax": "http://api.simile.zepheira.com/ajax/3.0.0/simile-ajax-bundle"
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
        "lib/jquery.history": {
            "deps": ["lib/jquery"],
            "exports": "History"
        },
        "lib/jquery.history.shim": {
            "deps": ["lib/jquery.history"]
        }
    }
});
