// Placeholder configuration for Exhibit RequireJS development
requirejs.config({
    "baseUrl": "http://localhost/~ryanlee/dev/src/scripts",
    "urlArgs": "bust=" + (new Date()).getTime(),
    "paths": {
        "lib": "../lib",
        "nls": "../nls",
        "ext": "../extensions",
        "map": "../extensions/map/scripts",
        "time": "../extensions/time/scripts",
        "invalid-json": "../extensions/invalid-json/scripts",
        "async": "../lib/async",
        "i18n": "../lib/i18n"
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

// Define Google Maps API v3
define('gmaps', ['async!https://maps.googleapis.com/maps/api/js?v=3&sensor=false'],
    function() {
        return window.google;
    }
);

// Define Google Maps API v2
define('gmaps2', ['async!http://maps.googleapis.com/maps/api/js?v=2&sensor=false&async=2&key='],
    function() {
        return window.GMap2;
    }
);

requirejs(
    ["require", "lib/jquery", "exhibit", "util/history", "util/localization", "final", "ext/map/map-extension"],
    function(require, $, Exhibit) {
        if (typeof window.JSON === "undefined" || window.JSON === null) {
            window.JSON = require("lib/json2");
        }
        Exhibit.initializeEvents();
        $(document).trigger("scriptsLoaded.exhibit");
        // window.Exhibit = Exhibit; // @@@ for debugging for now
    }
);
