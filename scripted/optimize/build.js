({
    "baseUrl": "../src/",
    "name": "lib/almond",
    "include": ["exhibit"],
    "out": "../build/exhibit-api.js",
    "wrap": {
        "startFile": "start.frag",
        "endFile": "end.frag"
    },
    "paths": {
        "jquery": "lib/jquery",
        "i18n": "lib/i18n",
        "domReady": "lib/domReady",
    },
    // r.js does not provide a way to include all language bundles, so force
    "deps": [
        "nls/de/locale",
        "nls/es/locale",
        "nls/fr/locale",
        "nls/nl/locale",
        "nls/no/locale",
        "nls/pt-br/locale",
        "nls/sv/locale"
    ]
})
