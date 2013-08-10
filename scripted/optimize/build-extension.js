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
        "timeline": "empty:"
    },
    "shim": {
        "lib/jquery": {
            "exports": "jQuery"
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
})
