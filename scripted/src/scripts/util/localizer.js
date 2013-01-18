/**
 * @fileOverview Localizing function
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/sprintf",
    "i18n!nls/locale"
], function(vsprintf, Locale) {
    var _;

    /**
     * Localizing function; take an identifying key and return the most
     * specific localization possible for it.  May return undefined if no
     * match can be found.
     * @see http://purl.eligrey.com/l10n.js
     * @requires sprintf.js
     * @param {String} s The key of the localized string to use.
     * @param [arguments] Any number of optional arguments that may be
     *     used in displaying the message, like numbers for count-
     *     dependent messages.
     * @returns Usually returns a string but may return arrays, booleans,
     *     etc. depending on what was localized.  Ideally this would not
     *     return a data structure.
     */
    _ = function() {
        var key, s, args;
        args = [].slice.apply(arguments);
        if (args.length > 0) {
            key = args.shift();
            // @@@ minor sea change - locales are masked by a bundle; looking
            //     through all bundles is now necessary, unless $.extend will
            //     still work?
            s = Locale[key];
            if (typeof s !== "undefined" && typeof s !== "object") {
                return vsprintf(s, args);
            } else {
                return s;
            }
        }
    };
    
    // end define
    return _;
});
