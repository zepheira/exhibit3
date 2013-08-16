define('gmaps', ['async!https://maps.googleapis.com/maps/api/js?v=3&sensor=false'],
    function() {
        return window.google;
    }
);

require(["../api/configs/dev-config.js"], function() {
    requirejs.config({
        "paths": {
            "ext/map/map-extension": "extensions/map/map-extension"
        }
    });
    require(["lib/jquery", "exhibit", "ext/map/map-extension", "ext/time/time-extension"], function($, Exhibit, MapExtension, TimeExtension) {
        window.Exhibit = Exhibit;
        Exhibit.MapExtension = MapExtension;
        Exhibit.MapView = MapExtension.MapView;
        Exhibit.TimeExtension = TimeExtension;
        Exhibit.TimelineView = TimeExtension.TimelineView;
        $(document).trigger("scriptsLoaded.exhibit");
    });
});
