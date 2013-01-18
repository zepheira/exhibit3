/**
 * @fileOverview General backwards compatibility material.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(function() {
    /**
     * @namespace
     */
    var Backwards = {
        "enabled": {
            "Attributes": false
        }
    };

    /**
     * Enable a backwards compatibility module.
     * @param {String} module
     */
    Backwards.enable = function(module) {
        Backwards[module].enable();
    };
    
    // end define
    return Backwards;
});
