/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["lib/jquery"], function($) {
/**
 * @namespace The base namespace for Exhibit.
 */
var Exhibit = {
    /**
     * The version number for Exhibit.
     * @constant
     */
    version: "3.0.0",

    /**
     * The XML namespace for Exhibit.
     * @constant
     */
    namespace: "http://simile.mit.edu/2006/11/exhibit#",

    /***
     * Viable user-agent reported locales.
     */
    locales: [],

    /**
     * Whether Exhibit has been loaded yet.
     */
    loaded: false,

    /**
     * Indicates for listeners whether the event they're listening
     * for has fired already or not.  Not all events are currently
     * recorded here.  This is predominantly for the benefit of
     * extensions.
     */
    signals: {
        "scriptsLoaded.exhibit": false,
        "loadExtensions.exhibit": false,
        "exhibitConfigured.exhibit": false
    },

    /**
     * Where Exhibit is served from.
     */
    urlPrefix: undefined,

    /**
     * Where to find Babel, if at all.
     */
    babelPrefix: undefined,

    /**
     * Where to submit JSON for validation.  Uses jsonlint.com by
     * default, will use Babel instead of babelPrefix is given.
     */
    validateJSON: "http://jsonlint.com/?json=",

    /**
     * Where to find out more about Exhibit.
     */
    exhibitLink: "http://www.simile-widgets.org/exhibit/",

    /**
     * Settable parameters within the query string of loading this file.
     */
    params: {
        "bundle": false,
        "autoCreate": true,
        "safe": false,
        "babel": undefined,
        "backstage": undefined,
        "locale": undefined,
        "persist": true
    },

    /**
     * The data type of each parameter
     */
    paramTypes: {
        "bundle": Boolean,
        "autoCreate": Boolean,
        "safe": Boolean,
        "babel": String,
        "backstage": String,
        "locale": String,
        "persist": Boolean        
    },
    
    /**
     * @namespace Prepare for official Exhibit extensions.
     */
    Extension: {},

    "styles": [
        "styles/main.css"
    ],

    "bundledStyle": "styles/exhibit-bundle.css",

    /**
     * @constant An Exhibit.Registry of static components.
     */
    registry: null
};

    // end define
    return Exhibit;
});
