({
    "baseUrl": "../src/",
    "name": "lib/almond",
    "include": ["exhibit"],
    "wrap": {
        "startFile": "start.frag",
        "endFile": "end.frag"
    },
    "paths": {
        "lib": "lib",
        "nls": "nls",
        "i18n": "lib/i18n"
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
