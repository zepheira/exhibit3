({
    "baseUrl": "../src",
    "name": "exhibit",
    "paths": {
        "lib": "lib",
        "nls": "nls",
        "i18n": "lib/i18n"
    },
    "exclude": ["lib/jquery"]
,
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
