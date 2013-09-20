({
    "baseUrl": "../src/",
    "name": "exhibit",
    "include": [
        "ext/map/map-extension",
        "ext/time/time-extension",
        "ext/openlayers/openlayers-extension",
        "ext/flot/flot-extension"
    ],
    "paths": {
        "ext": "extensions",
        "lib": "lib",
        "nls": "nls",
        "i18n": "lib/i18n",
        "async": "lib/async",
        "openlayers": "extensions/openlayers/lib/OpenLayers",
        "timeline": "../tools/timeline/api/timeline-bundle",
        "simile-ajax": "../tools/ajax/api/simile-ajax-bundle",
        "gmaps": "empty:"
    },
    "shim": {
        "lib/jquery": {
            "exports": "jQuery"
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
            "deps": ["extensions/flot/lib/jquery.flot"]
        },
        "extensions/flot/lib/jquery.flot.axislabels": {
            "deps": ["extensions/flot/lib/jquery.flot"]
        },
        "extensions/flot/lib/jquery.flot.navigate": {
            "deps": ["extensions/flot/lib/jquery.flot"]
        },
        "extensions/flot/lib/jquery.flot.resize": {
            "deps": ["extensions/flot/lib/jquery.flot"]
        }
    }
})
