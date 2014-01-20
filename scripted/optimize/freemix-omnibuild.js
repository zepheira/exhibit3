({
    "baseUrl": "../src/",
    "name": "exhibit",
    "include": [
        "ext/map/map-extension",
        "ext/time/time-extension",
        "ext/openlayers/openlayers-extension",
        "ext/flot/flot-extension"
    ],
    // "wrap": {
    //     "startFile": "omni-start.frag",
    //     "endFile": "omni-end.frag"
    // },
    "paths": {
        "ext": "extensions",
        "lib": "lib",
        "nls": "nls",
        "i18n": "lib/i18n",
        "async": "lib/async",
        "timeline": "../tools/timeline/api/timeline-bundle",
        "simile-ajax": "../tools/ajax/api/simile-ajax-bundle",
        "gmaps": "empty:",
        "openlayers": "empty:"    },
    "shim": {
        "lib/jquery": {
            "exports": "jQuery"
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
})
