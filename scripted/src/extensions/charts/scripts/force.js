/**
 * @author Baiaboo
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
        "getPointLabel":  function(itemID, database, visitor) { visitor(database.getObject(itemID, "label"));},
        "getProxy":       function(itemID, database, visitor) { visitor(itemID); },
        "getColorKey":    null
    };

    this._colorKeyCache = new Object();
    this._maxColor = 0;
    
    this._onItemsChanged = function(){
        view._reconstruct(); 
    };
    
    $(uiContext.getCollection().getElement()).bind(
        "onItemsChanged.exhibit",
        view._onItemsChanged
    );
    
    this.register();
};

Exhibit.ForceDirectedView._settingSpecs = {
        "plotHeight" : {
        type : "int",
        defaultValue : 400
    },
        "plotWidth" : {
        type : "int",
        defaultValue : 600
    },
};
Exhibit.ForceDirectedView._accessorSpecs = [];

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

Exhibit.ForceDirectedView.createFromDOM = function(configElmt, containerElmt, uiContext) {
    var configuration = Exhibit.getConfigurationFromDOM(configElmt);
    var view = new Exhibit.ForceDirectedView(
        containerElmt != null ? containerElmt : configElmt, 
        Exhibit.UIContext.createFromDOM(configElmt, uiContext)
    );

    Exhibit.SettingsUtilities.createAccessorsFromDOM(configElmt, Exhibit.ForceDirectedView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettingsFromDOM(configElmt, view.getSettingSpecs(), view._settings);
    Exhibit.ForceDirectedView._configure(view, configuration);
    
    view._internalValidate();
    view._initializeUI();
    return view;
};

Exhibit.ForceDirectedView._configure = function(view, configuration) {
    Exhibit.SettingsUtilities.createAccessors(configuration, Exhibit.ForceDirectedView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettings(configuration, view.getSettingSpecs(), view._settings);
    
    var accessors = view._accessors;
};

Exhibit.ForceDirectedView.evaluateSingle = function(expression, itemID, database) {
    return expression.evaluateSingleOnItem(itemID, database).value;
}

//Note:come back to this later and remove the redundant objects
Exhibit.ForceDirectedView.prototype.dispose = function() {
    $(this.getUIContext().getCollection().getElement()).unbind(
        "onItemsChanged.exhibit",
        this._onItemsChanged
    );
    
    
    this._dom.dispose();
    this._dom = null;
    
    this._dispose();
};

Exhibit.ForceDirectedView.prototype._internalValidate = function() {
    if ("getColorKey" in this._accessors) {
        if ("colorCoder" in this._settings) {
            this._colorCoder = this.getUIContext().getMain().getComponent(this._settings.colorCoder);
        }
        
        if (this._colorCoder == null) {
            this._colorCoder = new Exhibit.DefaultColorCoder(this.getUIContext());
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

Exhibit.ForceDirectedView.prototype._reconstruct = function (){
    var database = this.getUIContext().getDatabase();
    var jitData = this.getUIContext().getCollection()._database._spo;
    
    //json is the list of data that we pass to the jit graph constructor
    var json = []
    currentSet = this.getUIContext().getCollection().getRestrictedItems();
    currentSetIds = currentSet.toArray(); // list of ids of all the elements in the current set. 
    
    currentSet.visit(function(itemID){
        //ob is the data item.
        var ob = {};
        
        //adj gives us all the adjacent edges from the database
        var adj = database.getObject(itemID, "adjacencies");
        
        //adjList is a list of adj edges
        var adjList = []
        
        //push the edges to the adjList only if the end vertex is in the currentList of selected items
        for (key in adj){
            for (i in currentSetIds){
                if (currentSetIds[i] == adj[key]){
                    adjList.push({"nodeTo" : adj[key], "nodeFrom": itemID }); 
                    break;
                }
            }
        }
        console.log(adjList);
        ob["adjacencies"]=adjList;
        ob["data"] = database.getObject(itemID, "data");
        ob["id"] = itemID;
        ob["name"] = itemID;
        json.push(ob);
    })
    
    
    
    this._dom.plotContainer.innerHTML = "";
    var container = document.createElement("div");
    container.id = "ForceDirectedContainer";
    this._dom.plotContainer.appendChild(container);
    
    this._createJitFD(container.id, json);
   
};

Exhibit.ForceDirectedView.prototype._createJitFD = function(id, json){
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
    
    
    var Log = {
      elem: false,
      write: function(text){
        if (!this.elem) 
          this.elem = document.getElementById('log');
        this.elem.innerHTML = text;
        this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
      }
    };
    
        
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
      color: '#23A4FF',
      lineWidth: 0.4
    },
    //Native canvas text styling
    Label: {
      type: labelType, //Native or HTML
      size: 10,
      style: 'bold'
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
      onClick: function(node) {
        if(!node) return;
        // Build the right column relations list.
        // This is done by traversing the clicked node connections.
        var html = "<h4>" + node.name + "</h4><b> connections:</b><ul><li>",
            list = [];
        node.eachAdjacency(function(adj){
          list.push(adj.nodeTo.name);
        });
        //append connections information
        $jit.id('inner-details').innerHTML = html + list.join("</li><li>") + "</li></ul>";
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
    onStep: function(perc){
      Log.write(perc + '% loaded...');
    },
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
};

