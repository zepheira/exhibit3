// Placeholder configuration for Exhibit RequireJS development
requirejs.config({
    "baseUrl": "/exhibit/api/",
    "urlArgs": "bust=" + (new Date()).getTime(),
    "config": {
        "../exhibit": {
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
        "lib": "../lib",
        "nls": "../nls",
        "ext": "../extensions",
        "map": "../extensions/map/scripts",
        "time": "../extensions/time/scripts",
        "invalid-json": "../extensions/invalid-json/scripts",
        "async": "../lib/async",
        "i18n": "../lib/i18n",
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

/**
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

require(["require", "lib/jquery", "exhibit", "ext/map/map-extension", "ext/time/time-extension"], function(require, $, Exhibit) {
    if (typeof window.JSON === "undefined" || window.JSON === null) {
        window.JSON = require("lib/json2");
    }
    $(document).trigger("scriptsLoaded.exhibit");
    window.Exhibit = Exhibit; // for debugging
});
*/
