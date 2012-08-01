/**
 * @author Baiaboo Rai
 * @author Zhi X Huang
 * @Library in use : Javascript InfoVis Toolkit
 */

/**
 * @class
 * @constructor
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 */
Exhibit.ForceDirectedView = function(containerElmt, uiContext) {
    var view = this;
    $.extend(this, new Exhibit.View(
        "forcedirected",
        containerElmt,
        uiContext
    ));
    this.addSettingSpecs(Exhibit.ForceDirectedView._settingSpecs);
    
    this._accessors = {
        //"getPointLabel":  function(itemID, database, visitor) { visitor(database.getObject(itemID, "label"));},
        "getProxy":       function(itemID, database, visitor) { visitor(itemID); },
        "getColorKey":    null
    };
    this._colorCoder = null;
    this._shapeCoder = null;
    this._colorKeyCache = new Object();
    this._maxColor = 0;
    this._edgeExpression = null;
    
    this._onItemsChanged = function(){
        view._reconstruct(); 
    };
    
    $(uiContext.getCollection().getElement()).bind(
        "onItemsChanged.exhibit",
        view._onItemsChanged
    );
    
    this.register();
};

/**
 * @constant 
 */
Exhibit.ForceDirectedView._settingSpecs = {
    "plotHeight" : {type : "int", defaultValue : 400},
    "plotWidth" : {type : "int", defaultValue : 600},
    "color" : {type : "text"},
    "colorCoder" : {type : "text", defaultValue : null},
    "shape" : {type : "text"},
    "shapeCoder" : {type : "text", defaultValue : null},
    "edgeColor" : {type : "text", defaultValue : '#23A4FF'},
    "bubbleWidth":  { type: "int",   defaultValue: 400 },
    "bubbleHeight": { type: "int",   defaultValue: 300 }
};

/**
 * @constant 
 */
Exhibit.ForceDirectedView._accessorSpecs = [
    {   "accessorName":   "getName",
        "attributeName":  "name",
        "type":           "text"
    },
    {   "accessorName":   "getColorKey",
        "attributeName":  "colorKey",
        "type":           "text"
    },
    {   "accessorName":   "getShapeKey",
        "attributeName":  "shapeKey",
        "type":           "text"
    }
];

/**
 * @constant 
 */
Exhibit.ForceDirectedView._colors = ['#557EAA', '#83548B','#909291','#416D9C','#C74243'];

/**
 * @param {Object} configuration
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.MapView}
 */
Exhibit.ForceDirectedView.create = function(configuration, containerElmt, uiContext) {
    var view = new Exhibit.ForceDirectedView(
        containerElmt,
        Exhibit.UIContext.create(configuration, uiContext)
    );
    Exhibit.ForceDirectedView._configure(view, configuration);
    
    view._internalValidate();
    view._initializeUI();
    return view;
};

/**
 * @param {Element} configElmt
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.MapView}
 */
Exhibit.ForceDirectedView.createFromDOM = function(configElmt, containerElmt, uiContext) {
    var configuration = Exhibit.getConfigurationFromDOM(configElmt);
    var view = new Exhibit.ForceDirectedView(
        containerElmt != null ? containerElmt : configElmt, 
        Exhibit.UIContext.createFromDOM(configElmt, uiContext)
    );

    Exhibit.SettingsUtilities.createAccessorsFromDOM(configElmt, Exhibit.ForceDirectedView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettingsFromDOM(configElmt, view.getSettingSpecs(), view._settings);
    Exhibit.ForceDirectedView._configure(view, configuration);
         
    var edge = Exhibit.getAttribute(configElmt, "edge");
    view._edgeExpression = Exhibit.ExpressionParser.parse(edge);
    
    view._internalValidate();
    view._initializeUI();
    return view;
};

/**
 * @static
 * @param {Exhibit.MapView} view
 * @param {Object} configuration
 */
Exhibit.ForceDirectedView._configure = function(view, configuration) {
    Exhibit.SettingsUtilities.createAccessors(configuration, Exhibit.ForceDirectedView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettings(configuration, view.getSettingSpecs(), view._settings);
};

/**
 * 
 */
Exhibit.ForceDirectedView.prototype.dispose = function() {
    $(this.getUIContext().getCollection().getElement()).unbind(
        "onItemsChanged.exhibit",
        this._onItemsChanged
    );
    
    this._dom.dispose();
    this._dom = null;
    
    this._dispose();
};

/**
 * 
 */
Exhibit.ForceDirectedView.prototype._internalValidate = function() {
    if ("getColorKey" in this._accessors) {
        if ("colorCoder" in this._settings) {
            this._colorCoder = this.getUIContext().getMain().getComponent(this._settings.colorCoder);
        }
        
        if (this._colorCoder == null) {
            this._colorCoder = new Exhibit.DefaultColorCoder(this.getUIContext());
        }
    }
    
    if ("getShapeKey" in this._accessors) {
        if ("shapeCoder" in this._settings) {
            this._shapeCoder = this.getUIContext().getMain().getComponent(this._settings.shapeCoder);
        }
    }
};

Exhibit.ForceDirectedView.prototype._initializeUI = function() {
    var self = this;
    var legendWidgetSettings="_gradientPoints" in this._colorCoder ? "gradient" : {}

    this._dom = Exhibit.ViewUtilities.constructPlottingViewDom(
        this.getContainer(), 
        this.getUIContext(), 
        true, // showSummary
        {   "onResize": function() { 
                self._reconstruct();
            } 
        }, 
        legendWidgetSettings
    );
    this._dom.plotContainer.className = "exhibit-ForceDirectedView-plotContainer";
    this._dom.plotContainer.style.height = this._settings.plotHeight + "px";
    this._dom.plotContainer.style.width = this._settings.plotWidth + "px";
    self._initializeViewUI();
    this._reconstruct();
};


//Each data input item in jit needs to be in this format:
/*
 *   {
        "adjacencies": [{"nodeTo": "graphnode1","nodeFrom": "graphnode0","data": {"$color": "#557EAA"}},
                        {"nodeTo": "graphnode2","nodeFrom": "graphnode0","data": {"$color": "#557EAA"}}],
                        "data": {"$color": "#EBB056","$type": "circle","$dim": 11},
                        "id": "graphnode1",
                        "name":"Harry"
      }
      
      But our users are going to put it in this format:
      
      {   
        "label": "graphnode0"
        "name": "Harry"
      }
 */

/**
 * 
 */
Exhibit.ForceDirectedView.prototype._reconstruct = function (){
    self = this;
    var accessors = this._accessors;
    var database = this.getUIContext().getDatabase();
    var edgeToData = {};
    var edgeExpr = this._edgeExpression;
    currentSize = this.getUIContext().getCollection().countRestrictedItems();
    var colorCoder = this._colorCoder;
    var colorCodingFlags = {
        mixed : false,
        missing : false,
        others : false,
        keys : new Exhibit.Set()
    };
    var hasColorKey = (this._accessors.getColorKey != null);
    var shapeCoder = this._shapeCoder;
    console.log(shapeCoder);
    var shapeCodingFlags = {
        mixed : false,
        missing : false,
        others : false,
        keys : new Exhibit.Set()
    }
    var hasShapeKey = (this._accessors.getShapeKey != null);
    
    //json is the list of items that we pass to the jit graph constructor
    var json = []
    currentSet = this.getUIContext().getCollection().getRestrictedItems();
    currentSetIds = currentSet.toArray(); // list of ids of all the elements in the current set. 
    prepareData = function(){
        var color, shape;
        color = self._settings.color;
        shape = self._settings.shape;
        
        currentSet.visit(function(itemID){
            var colorInd = 0, colorKeys = [],jitItem = {}, edgeObj, edgeList = [], defaultColors;
            if (hasColorKey) {
                colorKeys = new Exhibit.Set();
                accessors.getColorKey(itemID, database, function(v) {
                    colorKeys.add(v);
                });
                color = colorCoder.translateSet(colorKeys, colorCodingFlags);
            }
            
            if (hasShapeKey){
                shapeKeys = new Exhibit.Set();
                accessors.getShapeKey(itemID, database, function(v) {
                    shapeKeys.add(v);
                });
                shape = shapeCoder.translateSet(shapeKeys, shapeCodingFlags);
            }
            
            defaultColors = Exhibit.ForceDirectedView._colors;         
            if (typeof color == "undefined"){
                color = defaultColors[colorInd%5];
            }
            
            if (typeof shape == "undefined"){
                shape = "triangle";
            }
                
            edgeObj = edgeExpr.evaluate(
                            { "value" : itemID }, 
                            { "value" : "item" }, 
                            "value",
                            database
                        );
            
            //edgeList is a list of adj edges for each item     
            edgeObj.values.visit(function(edge){
                for (i in currentSetIds){
                    if (currentSetIds[i] == edge){
                        edgeList.push({"nodeTo" : edge, "nodeFrom": itemID }); 
                        break;
                    }
                }
            });
            
            jitItem["adjacencies"] = edgeList;            
            jitItem["data"] = {"$color": color, "$type": shape,"$dim": 11};
            jitItem["id"] = itemID;
            accessors.getName(itemID, database, function(key){jitItem["name"] = key;});
            colorInd++;
            json.push(jitItem);        
        })   
    }
    
    createColorLegend = function() {
        var legendWidget, keys, key, color;
        
        if (hasColorKey) {
            legendWidget = self._dom.legendWidget;
            colorCoder = self._colorCoder;
            keys = colorCodingFlags.keys.toArray().sort();

            if (self._colorCoder._gradientPoints != null) {
                legendWidget.addGradient(this._colorCoder._gradientPoints);
            } else {
                for (var k = 0; k < keys.length; k++) {
                    key = keys[k];
                    color = colorCoder.translate(key);
                    legendWidget.addEntry(color, key);
                }
            }

            if (colorCodingFlags.others) {
                legendWidget.addEntry(colorCoder.getOthersColor(), colorCoder.getOthersLabel());
            }

            if (colorCodingFlags.mixed) {
                legendWidget.addEntry(colorCoder.getMixedColor(), colorCoder.getMixedLabel());
            }

            if (colorCodingFlags.missing) {
                legendWidget.addEntry(colorCoder.getMissingColor(), colorCoder.getMissingLabel());
            }
        }
    }
    
    createShapeLegend = function() {
        var legendWidget, keys, key, shape;
        
        if (hasShapeKey) {
            legendWidget = self._dom.legendWidget;
            shapeCoder = self._shapeCoder;
            keys = shapeCodingFlags.keys.toArray().sort();

            if (self._shapeCoder._gradientPoints != null) {
                legendWidget.addGradient(this._shapeCoder._gradientPoints);
            } else {
                for (var k = 0; k < keys.length; k++) {
                    key = keys[k];
                    shape = shapeCoder.translate(key);
                    legendWidget.addEntry(shape, key);
                }
            }

            if (shapeCodingFlags.others) {
                legendWidget.addEntry(shapeCoder.getOthersShape(), shapeCoder.getOthersLabel());
            }

            if (shapeCodingFlags.mixed) {
                legendWidget.addEntry(shapeCoder.getMixedShape(), shapeCoder.getMixedLabel());
            }

            if (shapeCodingFlags.missing) {
                legendWidget.addEntry(shapeCoder.getMissingShape(), shapeCoder.getMissingLabel());
            }
        }
    }
    
    if (currentSize > 0){
        prepareData();
        this._dom.plotContainer.innerHTML = "";
        var container = document.createElement("div");
        container.id = "ForceDirectedContainer";
        container.style.height = "100%";
        container.style.width = "100%";
        container.style.backgroundColor = "black";
        this._dom.plotContainer.appendChild(container);
        
        this._createJitFD(container.id, json);
        createColorLegend();
    }
       
};

/** 
 * @private
 * @param {Object} id
 * @param {Object} json
 */
Exhibit.ForceDirectedView.prototype._createJitFD = function(id, json){
    self = this;
    var labelType, useGradients, nativeTextSupport, animate;

    (function() {
      var ua = navigator.userAgent,
          iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
          typeOfCanvas = typeof HTMLCanvasElement,
          nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
          textSupport = nativeCanvasSupport 
            && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
      //I'm setting this based on the fact that ExCanvas provides text support for IE
      //and that as of today iPhone/iPad current text support is lame
      labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
      nativeTextSupport = labelType == 'Native';
      useGradients = nativeCanvasSupport;
      animate = !(iStuff || !nativeCanvasSupport);
    })();
    
    var _pos, _items, _node;    
    // init ForceDirected
    var fd = new $jit.ForceDirected({
        //id of the visualization container
    injectInto: id,
    //Enable zooming and panning
    //by scrolling and DnD
    Navigation: {
      enable: true,
      //Enable panning events only if we're dragging the empty
      //canvas (and not a node).
      panning: 'avoid nodes',
      zooming: 10 //zoom speed. higher is more sensible
    },
    // Change node and edge styles such as
    // color and width.
    // These properties are also set per node
    // with dollar prefixed data-properties in the
    // JSON structure.
    Node: {
      overridable: true
    },
    Edge: {
      overridable: true,
      color: self._settings.edgeColor,
      //color:'#C7C7C7',
      lineWidth: 0.4
    },
    //Native canvas text styling
    Label: {
      type: labelType, //Native or HTML
      size: 11,
      style: 'bold',
      color:'white'
    },
    //Add Tips
    Tips: {
      enable: true,
      onShow: function(tip, node) {
        //count connections
        var count = 0;
        node.eachAdjacency(function() { count++; });
        //display node info in tooltip
        tip.innerHTML = "<div class=\"tip-title\">" + node.name + "</div>"
          + "<div class=\"tip-text\"><b>connections:</b> " + count + "</div>";
      }
    },
    // Add node events
    Events: {
      enable: true,
      //Change cursor style when hovering a node
      onMouseEnter: function() {
        fd.canvas.getElement().style.cursor = 'move';
      },
      onMouseLeave: function() {
        fd.canvas.getElement().style.cursor = '';
      },
      //Update node positions when dragged
      onDragMove: function(node, eventInfo, e) {
          var pos = eventInfo.getPos();
          node.pos.setc(pos.x, pos.y);
          fd.plot();
      },
      //Implement the same handler for touchscreens
      onTouchMove: function(node, eventInfo, e) {
        $jit.util.event.stop(e); //stop default touchmove event
        this.onDragMove(node, eventInfo, e);
      },
      //Add also a click handler to nodes
      onClick: function(node,eventInfo, e) {
        _pos = eventInfo.getPos();
        _items = [node.id];
        _node = node;
        
      }
    },
    //Number of iterations for the FD algorithm
    iterations: 200,
    //Edge length
    levelDistance: 130,
    // Add text to the labels. This method is only triggered
    // on label creation and only for DOM labels (not native canvas ones).
    onCreateLabel: function(domElement, node){
      domElement.innerHTML = node.name;
      var style = domElement.style;
      style.fontSize = "0.8em";
      style.color = "#ddd";
    },
    // Change node styles when DOM labels are placed
    // or moved.
    onPlaceLabel: function(domElement, node){
      var style = domElement.style;
      var left = parseInt(style.left);
      var top = parseInt(style.top);
      var w = domElement.offsetWidth;
      style.left = (left - w / 2) + 'px';
      style.top = (top + 10) + 'px';
      style.display = '';
        }
      });
      // load JSON data.
      fd.loadJSON(json);
      // compute positions incrementally and animate.
      fd.computeIncremental({
        iter: 40,
        property: 'end',
    onComplete: function(){
      //Log.write('done');
      fd.animate({
        modes: ['linear'],
            transition: $jit.Trans.Elastic.easeOut,
            duration: 2500
          });
        }
      });
      // end
      
      var pop = false;
      $("body").click(function(e){
          if (!$(e.target).closest('#ForceDirectedContainer').length){
              _node = null;
          }
         if (pop){
            if (!$(e.target).closest('.simileAjax-bubble-contentContainer.simileAjax-bubble-contentContainer-pngTranslucent').length) {
                pop = false;
                $('.simileAjax-bubble-container').hide();
            };
        }
        if (!pop){
            if (_node){
                console.log("popup not present");
                pop = true;
                Exhibit.ViewUtilities.openBubbleWithCoords(e.pageX, e.pageY, _items, self.getUIContext());
            }   
        }
      });
};