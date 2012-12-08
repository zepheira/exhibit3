/**
 * @fileOverview Load locales, any dynamic post-script loading activities.
 */

define(
    ["lib/jquery",
     "exhibit",
     "registry",
     "ui/ui",
     "util/debug",
     "util/bookmark",
     "util/history"],
    function($, Exhibit) {
        Exhibit.initializeEvents = function() {
$(document).ready(function() {
    var delays, localeLoaded;
    // Without threading, this shouldn't introduce a race condition,
    // but it is definitely a problem if concurrency comes into play.
    // Maybe refactoring so everything uses the delay queue under the hood
    // would make more sense.
    delays = [];
    localeLoaded = false;

    $(document).bind("delayCreation.exhibit", function(evt, delayID) {
        delays.push(delayID);
    });

    $(document).bind("delayFinished.exhibit", function(evt, delayID) {
        var idx = delays.indexOf(delayID);
        if (idx >= 0) {
            delays.splice(idx, 1);
            if (delays.length === 0 && localeLoaded) {
                delays = null;
                $(document).trigger("scriptsLoaded.exhibit");
            }
        }
    });
    
    $(document).bind("localeSet.exhibit", function(evt, localeURLs) {
        // @@@ should switch to requirejs localization
        requirejs(localeURLs, function() {
            $(document).trigger("loadExtensions.exhibit");
        });
    });

    $(document).bind("error.exhibit", function(evt, e, msg) {
        Exhibit.UI.hideBusyIndicator();
        Exhibit.Debug.exception(e, msg);
        alert(msg);
    });

    $(document).one("localeLoaded.exhibit", function(evt) {
        localeLoaded = true;
        if (delays.length === 0) {
            $(document).trigger("scriptsLoaded.exhibit");
        }
    });

    $(document).one("scriptsLoaded.exhibit", function(evt) {
        $(document).trigger("registerStaticComponents.exhibit", Exhibit.staticRegistry);
        $(document).trigger("staticComponentsRegistered.exhibit");
    });

    if (Exhibit.params.autoCreate) {
        $(document).one("staticComponentsRegistered.exhibit", function(evt) {
            Exhibit.autoCreate();
        });
    }

    $(document).one("exhibitConfigured.exhibit", function(evt, ex) {
        Exhibit.Bookmark.init();
        Exhibit.History.init(ex, Exhibit.params.persist);
    });

    // Signal recording
    $(document).one("loadExtensions.exhibit", function(evt) {
        Exhibit.signals["loadExtensions.exhibit"] = true;
    });

    $(document).one("exhibitConfigured.exhibit", function(evt) {
        Exhibit.signals["exhibitConfigured.exhibit"] = true;
    });

    Exhibit.checkBackwardsCompatibility();
    Exhibit.staticRegistry = new Exhibit.Registry(true);

    $("link[rel='exhibit-extension']").each(function(idx, el) {
        // Exhibit.includeJavascriptFile(null, $(el).attr("href"), false);
    });
});
};

    // end define
    return Exhibit;
});
