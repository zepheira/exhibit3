/**
 * @fileOverview The common parameters of this extension.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(function() {
    var FlotExtension;

    FlotExtension = {
        "params": {
            "bundle": true,
            "prefix": null
        },
        "paramTypes": {
            "bundle": Boolean,
            "prefix": String
        },
        "urlPrefix": null,
        "cssFiles": ["styles/main.css"],
        "bundledCssFile": "styles/flot-extension-bundle.css"
    };
        
    return FlotExtension;
});
