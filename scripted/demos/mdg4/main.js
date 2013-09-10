require(["../api/configs/dev-config.js"], function() {
    requirejs.config({
        "paths": {
            "ext/openlayers/openlayers-extension": "extensions/openlayers/openlayers-extension",
            "ext/flot/flot-extension": "extensions/flot/flot-extension"
        }
    });
    require(["lib/jquery", "exhibit", "ext/openlayers/openlayers-extension", "ext/flot/flot-extension"], function($, Exhibit, MapExtension, FlotExtension) {
        window.Exhibit = Exhibit;
        Exhibit.MapExtension = MapExtension;
        Exhibit.OLMapView = MapExtension.OLMapView;
        Exhibit.FlotExtension = FlotExtension;
        Exhibit.PieChartView = FlotExtension.PieChartView;
        Exhibit.BarChartView = FlotExtension.BarChartView;
        Exhibit.ScatterPlotView = FlotExtension.ScatterPlotView;
        $(document).trigger("scriptsLoaded.exhibit");
    });
});
