/**
 * @fileOverview An extension to Exhibit adding a view using Flot charts.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "module",
    "lib/jquery",
    "exhibit",
    "./scripts/flot-base",
    "./scripts/piechart-view",
    "./scripts/barchart-view",
    "./scripts/scatterplot-view",
    "i18n!ext/flot/nls/locale",
    "scripts/util/debug",
    "./lib/jquery.flot"
], function(module, $, Exhibit, FlotExtension, PieChartView, BarChartView, ScatterPlotView, Locale, Debug) {
    /**
     * @param {Exhibit} ex
     */
    FlotExtension.register = function(ex) {
        ex.FlotExtension = FlotExtension;
        ex.PieChartView = PieChartView;
        ex.BarChartView = BarChartView;
        ex.ScatterPlotView = ScatterPlotView;
    };    

    FlotExtension.setup = function() {
        var url, i, conf, prefix, targets;

        $(document).trigger("loadLocale.exhibit", Locale);
        url = null;
        conf = module.config();

        if (conf !== null && conf.hasOwnProperty("prefix")) {
            prefix = conf.prefix;
        } else {
            targets = ["/flot-extension.js", "/flot-extension-bundle.js"];
            for (i = 0; i < targets.length; i++) {
                url = Exhibit.findScript(document, targets[i]);
                if (url !== null) {
                    prefix = url.substr(0, url.indexOf(targets[i]));
                    break;
                }
            }
            if (url === null) {
                Debug.exception(new Error("Failed to derive URL prefix for SIMILE Exhibit Flot Extension files"));
                return;
            }
        }
    
        if (prefix.substr(-1) !== "/") {
            prefix += "/";
        }

        FlotExtension.urlPrefix = prefix;
        if (conf !== null) {
            FlotExtension.params = conf;
        } else if (url !== null) {
            FlotExtension.params = Exhibit.parseURLParameters(url, FlotExtension.params, FlotExtension.paramTypes);
        }
        
        if (FlotExtension.params.bundle) {
            Exhibit.includeCssFiles(document, FlotExtension.urlPrefix, FlotExtension.cssFiles);
        } else {
            Exhibit.includeCssFile(document, FlotExtension.urlPrefix + FlotExtension.bundledCssFile);
        }
    };

    $(document).ready(FlotExtension.setup);

    return FlotExtension;
});
