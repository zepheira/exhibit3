/**
 * @fileOverview An extension to Exhibit adding a view using SIMILE Timeline.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

/**
 * Be sure to define the timeline requirement in your Exhibit set up.
 * Timeline 3.0.0+ is RequireJS compatible, you can include it like:
 *
 * requirejs.config({ ...
 *   "paths": {
 *     "timeline": "http://api.simile.zepheira.comm/timeline/3.0.0/timeline-bundle",
 *     "ajax": "http://api.simile.zepheira.com/ajax/3.0.0/simile-ajax-bundle"
 *   },
 *   "config": {
 *     "timeline": {
 *       "bundle": true,
 *       "prefix" "http://api.simile.zepheira.com/timeline/3.0.0/",
 *       "ajax": "http://api.simile.zepheira.com/ajax/3.0.0/"
 *     },
 *     "time-extension": {
 *       "bundle": true,
 *       "prefix": "/path/to/time-extension"
 *     }
 *   }
 * ... });
 */

define([
    "module",
    "lib/jquery",
    "exhibit",
    "./scripts/base",
    "./scripts/timeline-view",
    "i18n!ext/time/nls/locale",
    "scripts/util/debug"
], function(module, $, Exhibit, TimeExtension, TimelineView, Locale, Debug) {
    TimeExtension.TimelineView = TimelineView;

    /**
     * @param {Exhibit} ex
     */
    TimeExtension.register = function(ex) {
        ex.TimeExtension = TimeExtension;
        ex.TimelineView = TimelineView;
    };

    TimeExtension.setup = function() {
        var url, i, conf, prefix, targets;

        $(document).trigger("loadLocale.exhibit", Locale);
        url = null;
        conf = module.config();

        if (typeof Exhibit_TimeExtension_urlPrefix === "string") {
            prefix = Exhibit_TimeExtension_urlPrefix;
        } else if (conf !== null && conf.hasOwnProperty("prefix")) {
            prefix = conf.prefix;
        } else {
            targets = ["/time-extension.js", "/time-extension-bundle.js"];
            for (i = 0; i < targets.length; i++) {
                url = Exhibit.findScript(document, targets[i]);
                if (url !== null) {
                    prefix = url.substr(0, url.indexOf(targets[i]));
                    break;
                }
            }
            if (url === null) {
                Debug.exception(new Error("Failed to derive URL prefix for SIMILE Exhibit Time Extension files"));
                return;
            }
        }
    
        if (prefix.substr(-1) !== "/") {
            prefix += "/";
        }

        TimeExtension.urlPrefix = prefix;
        if (typeof Exhibit_TimeExtension_parameters !== "undefined") {
            TimeExtension.params = Exhibit.parseURLParameters(Exhibit_TimeExtension_parameters, TimeExtension.params, TimeExtension.paramTypes);
        } else if (conf !== null) {
            TimeExtension.params = conf;
        } else if (url !== null) {
            TimeExtension.params = Exhibit.parseURLParameters(url, TimeExtension.params, TimeExtension.paramTypes);
        }
        
        if (TimeExtension.params.bundle) {
            Exhibit.includeCssFiles(document, TimeExtension.urlPrefix, TimeExtension.cssFiles);
        } else {
            Exhibit.includeCssFile(document, TimeExtension.urlPrefix + TimeExtension.bundledCssFile);
        }
    };

    $(document).ready(TimeExtension.setup);

    return TimeExtension;
});
