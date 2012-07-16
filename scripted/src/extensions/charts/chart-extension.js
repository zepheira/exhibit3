/*==================================================
 *  Simile Exhibit Chart Extension
 *==================================================
 */

(function() {
    var isCompiled = ("Exhibit_ChartExtension_isCompiled" in window) && 
                    window.Exhibit_ChartExtension_isCompiled;
                    
    Exhibit.ChartExtension = {
        params: {
            bundle: false
        } 
    };

    var javascriptFiles = [
        "scatter-plot-view.js",
        "bar-chart-view.js"
    ];

    
    var paramTypes = { bundle: Boolean };
    if (typeof Exhibit_ChartExtension_urlPrefix == "string") {
        Exhibit.ChartExtension.urlPrefix = Exhibit_ChartExtension_urlPrefix;
        if ("Exhibit_ChartExtension_parameters" in window) {
            Exhibit.parseURLParameters(Exhibit_ChartExtension_parameters,
                                          Exhibit.ChartExtension.params,
                                          paramTypes);
        }
    } else {
        var url = Exhibit.findScript(document, "/chart-extension.js");
        if (url == null) {
            Exhibit.Debug.exception(new Error("Failed to derive URL prefix for Simile Exhibit Chart Extension code files"));
            return;
        }
        Exhibit.ChartExtension.urlPrefix = url.substr(0, url.indexOf("chart-extension.js"));
        
        Exhibit.parseURLParameters(url, Exhibit.ChartExtension.params, paramTypes);
    }
    
    var scriptURLs = [];
    var cssURLs = [];
    
    if (Exhibit.ChartExtension.params.bundle) {
        scriptURLs.push(Exhibit.ChartExtension.urlPrefix + "chart-extension-bundle.js");
        //cssURLs.push(Exhibit.ChartExtension.urlPrefix + "chart-extension-bundle.css");
    } else {
        Exhibit.prefixURLs(scriptURLs, Exhibit.ChartExtension.urlPrefix + "scripts/", javascriptFiles);
        //Exhibit.prefixURLs(cssURLs, Exhibit.ChartExtension.urlPrefix + "styles/", cssFiles);
    }
    
    for (var i = 0; i < Exhibit.locales.length; i++) {
        scriptURLs.push(Exhibit.ChartExtension.urlPrefix + "locales/" + Exhibit.locales[i] + "/chart-locale.js");
    };
    
    if (!isCompiled) {
        Exhibit.includeJavascriptFiles(document, "", scriptURLs);
        //Exhibit.includeCssFiles(document, "", cssURLs);
    }
})();
