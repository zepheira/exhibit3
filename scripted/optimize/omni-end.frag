    require(["lib/jquery", "exhibit", "ext/flot/flot-extension", "ext/openlayers/openlayers-extension", "ext/time/time-extension"], function($, Exhibit, FlotExtension, OpenLayersExtension, TimeExtension) {
        window.Exhibit = Exhibit;
        FlotExtension.register(Exhibit);
        OpenLayersExtension.register(Exhibit);
        TimeExtension.register(Exhibit);
        $(document).trigger("scriptsLoaded.exhibit");
    });
}));
