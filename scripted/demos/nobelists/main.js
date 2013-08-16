require(["../api/configs/dev-config.js"], function() {
    requirejs.config({
        "paths": {
            "ext/time/time-extension": "extensions/time/time-extension-bundle"
        }
    });
    require(["lib/jquery", "exhibit", "ext/time/time-extension"], function($, Exhibit, TimeExtension) {
        window.Exhibit = Exhibit;
        Exhibit.TimeExtension = TimeExtension;
        Exhibit.TimelineView = TimeExtension.TimelineView;
        $(document).trigger("scriptsLoaded.exhibit");
    });
});
