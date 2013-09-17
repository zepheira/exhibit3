require(["../api/configs/dev-config.js"], function() {
    requirejs.config({
        "paths": {
            "ext/openlayers/openlayers-extension": "extensions/openlayers/openlayers-extension"
        }
    });
    require(["lib/jquery", "exhibit", "ext/openlayers/openlayers-extension", "ext/time/time-extension"], function($, Exhibit, MapExtension, TimeExtension) {
        window.Exhibit = Exhibit;
        MapExtension.register(Exhibit);
        TimeExtension.register(Exhibit);
        $(document).trigger("scriptsLoaded.exhibit");
    });
});
