// Placeholder configuration for Exhibit RequireJS development
requirejs.config({
    "baseUrl": "http://localhost/~ryanlee/dev/src/scripts",
    "paths": {
        "lib": "../lib",
        "locales": "../locales"
    },
    "shim": {
        "lib/jquery": {
            "exports": "jQuery"
        },
        "lib/json2": {
            "exports": "JSON"
        },
        "lib/sprintf": {
            "exports": "vsprintf"
        },
        "lib/jquery.history": {
            "deps": ["lib/jquery"],
            "exports": "History"
        },
        "lib/jquery.history.shim": {
            "deps": ["lib/jquery.history"]
        }
    }
});

// include lib/json2 if JSON is not defined
requirejs(
    ["lib/jquery", "exhibit", "util/debug", "util/date-time", "util/set", "util/views", "util/units", "util/settings", "util/persistence", "util/html", "util/facets", "util/coders", "util/bookmark", "util/history", "util/localization", "registry", "bc/attributes", "bc/bc", "data/collection", "data/database", "data/database/local", "data/database/type", "data/database/property", "data/database/range-index", "data/importer", "data/importers/jsonp", "data/importers/google-spreadsheet", "data/importers/json", "data/importers/babel-based", "data/exporter", "data/exporters/tsv", "data/exporters/semantic-wikitext", "data/exporters/rdf-xml", "data/exporters/bibtex", "data/exporters/json", "data/expression-parser", "data/expression", "data/expression/collection", "data/expression/path", "data/expression/operator", "data/expression/functions", "data/expression/function-call", "data/expression/controls", "data/expression/control-call", "data/expression/constant", "ui/ui", "ui/ui-context", "ui/lens", "ui/lens-registry", "ui/formatter", "ui/format-parser", "ui/coordinator", "ui/control-panel", "ui/coders/coder", "ui/coders/color-coder", "ui/coders/size-coder", "ui/coders/size-gradient-coder", "ui/coders/ordered-color-coder", "ui/coders/icon-coder", "ui/coders/default-color-coder", "ui/coders/color-gradient-coder", "ui/facets/facet", "ui/facets/text-search-facet", "ui/facets/numeric-range-facet", "ui/facets/list-facet", "ui/facets/hierarchical-facet", "ui/facets/cloud-facet", "ui/facets/alpha-range-facet", "ui/views/view", "ui/views/view-panel", "ui/views/tile-view", "ui/views/thumbnail-view", "ui/views/tabular-view", "ui/views/ordered-view-frame", "ui/widgets/toolbox-widget", "ui/widgets/resizable-div-widget", "ui/widgets/reset-history-widget", "ui/widgets/option-widget", "ui/widgets/logo", "ui/widgets/legend-widget", "ui/widgets/legend-gradient-widget", "ui/widgets/bookmark-widget", "locales/manifest", "final"],
    function($, Exhibit) {
        Exhibit.initializeEvents();
        $(document).trigger("registerLocalization.exhibit", Exhibit.staticRegistry);
        window.Exhibit = Exhibit;
    }
);
