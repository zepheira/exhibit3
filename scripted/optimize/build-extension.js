({
    "baseUrl": "../src/",
    "paths": {
        "lib": "lib",
        "i18n": "lib/i18n",
        "ext": "extensions",
        "map": "extensions/map/scripts",
        "time": "extensions/time/scripts",
        "exhibit": "empty:",
        "gmaps": "empty:",
        "gmaps2": "empty:",
        "openlayers": "empty:",
        "timeline": "empty:"
    },
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
        }
    },
    "exclude": [
        "lib/jquery",
        "scripts/ui/views/view",
        "scripts/util/views",
        "scripts/util/coders",
        "scripts/util/accessors",
        "scripts/ui/coders/default-color-coder"
    ]
})
