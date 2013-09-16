require(["../api/configs/dev-config.js"], function() {
    requirejs.config({
        "paths": {
            "ext/openlayers/openlayers-extension": "extensions/openlayers/openlayers-extension",
            "ext/flot/flot-extension": "extensions/flot/flot-extension"
        }
    });
    require(["lib/jquery", "exhibit", "ext/openlayers/openlayers-extension", "ext/flot/flot-extension"], function($, Exhibit, MapExtension, FlotExtension) {
        window.Exhibit = Exhibit;
        MapExtension.register(Exhibit);
        FlotExtension.register(Exhibit);
        $(document).trigger("scriptsLoaded.exhibit");
    });
});
