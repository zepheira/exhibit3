({
    "baseUrl": "../src",
    "name": "exhibit",
    "paths": {
        "lib": "lib",
        "nls": "nls",
        "i18n": "lib/i18n"
    },
    "exclude": ["lib/jquery"],
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
    }
})
