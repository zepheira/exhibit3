require(["../api/configs/dev-config.js"], function() {
    requirejs.config({
        "paths": {
            "ext/openlayers/openlayers-extension": "extensions/openlayers/openlayers-extension"
        }
    });
    require(["lib/jquery", "exhibit", "ext/openlayers/openlayers-extension", "ext/time/time-extension"], function($, Exhibit, MapExtension, TimeExtension) {
        window.Exhibit = Exhibit;
        Exhibit.MapExtension = MapExtension;
        Exhibit.OLMapView = MapExtension.OLMapView;
        Exhibit.TimeExtension = TimeExtension;
        Exhibit.TimelineView = TimeExtension.TimelineView;
        $(document).trigger("scriptsLoaded.exhibit");
    });
});
