/**
 * @fileOverview An extension to Exhibit adding a view using SIMILE Timeline.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

/**
 * This extension is subject to ugly, ugly hacks because Timeline a) relies
 * on SimileAjax, which Exhibit 3.0 no longer does, and b) Timeline's method
 * of loading (via SimileAjax) is outdated and not compatible with Exhibit.
 *
 * In order to compensate, this file uses one polling loop and a modified
 * version of the SimileAjax loader.  The polling loop waits until Timeline
 * has loaded and is defined in the window context.  The extension must take
 * advantage of Exhibit's delay mechanism so Exhibit will delay creation
 * until Timeline has finished loading.  The modified SimileAjax loader does
 * not load SimileAjax jQuery or allow SimileAjax to modify jQuery but has to
 * define some of the material in SimileAjax as a consequence.  See
 * load-simile-ajax.js.
 */

define([
    "require",
    "lib/jquery",
    "exhibit",
    "./scripts/base",
    "./scripts/timeline-view",
    "i18n!ext/time/nls/locale"
], function(require, $, Exhibit, TimeExtension, TimelineView, Locale) {
    var javascriptFiles, cssFiles, paramTypes, url, scriptURLs, cssURLs, ajaxURLs, i;
    $(document).trigger("loadLocale.exhibit", Locale);

    Exhibit.TimeExtension = TimeExtension;
    Exhibit.TimelineView = TimelineView;

    cssFiles = [
        "timeline-view.css"
    ];
    paramTypes = {
        "bundle": Boolean,
        "timelinePrefix": String,
        "timelineVersion": String
    };
        
    if (typeof Exhibit_TimeExtension_urlPrefix === "string") {
        Exhibit.TimeExtension.urlPrefix = Exhibit_TimeExtension_urlPrefix;
        if (typeof Exhibit_TimeExtension_parameters !== "undefined") {
            Exhibit.parseURLParameters(Exhibit_TimeExtension_parameters,
                                       Exhibit.TimeExtension.params,
                                       paramTypes);
        }
    } else {
        //url = Exhibit.findScript(document, "/time-extension.js");
        //if (url === null) {
        //    Exhibit.Debug.exception(new Error("Failed to derive URL prefix for SIMILE Exhibit Time Extension files"));
        //    return;
        //}
        //    Exhibit.TimeExtension.urlPrefix = url.substr(0, url.indexOf("time-extension.js"));
            
       //     Exhibit.parseURLParameters(url, Exhibit.TimeExtension.params, paramTypes);
    }
        
    cssURLs = [];
    // Exhibit.prefixURLs(cssURLs, Exhibit.TimeExtension.urlPrefix + "styles/", cssFiles);
    
    Exhibit.includeCssFiles(document, null, cssURLs);

    // end define
    return Exhibit;
});
