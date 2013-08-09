({
    "baseUrl": "../src/",
    "name": "lib/almond",
    "include": ["exhibit"],
    "wrap": {
        "startFile": "start.frag",
        "endFile": "end.frag"
    },
    "paths": {
        "i18n": "lib/i18n"
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
