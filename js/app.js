var warperApp = {
    mapElement:     'map',
    baseUrl:        'http://warper.wmflabs.org',
    layers:         {},
    geoSearch:      true,
    clustering:     false,
    bounds:         false,
    boundsOpacity: 0.5,
    boundsColor:   'blue',
    boundsWeight:  2,
    markers:        [],


  init: function () {
    // set up the map
    map = new L.Map(this.mapElement);
    this.map = map;

    // create the base map layer 
    var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 20, attribution: osmAttrib});
    this.osmLayer = osm;

    // initial view
    this.map.setView(new L.LatLng(60.1619343018, 24.9516973282), 12); // Helsinki
    this.map.addLayer(osm);

    var clusterLayer = L.markerClusterGroup();
    var featureLayer = L.layerGroup();
    var boundsLayer = L.layerGroup();

    this.clusterLayer = clusterLayer;
    this.featureLayer = featureLayer;
    this.boundsLayer = boundsLayer;
    
    if (this.clustering) this.map.addLayer(this.clusterLayer);
    this.map.addLayer(this.featureLayer);
    if (this.bounds) this.map.addLayer(this.boundsLayer);

    this.map.on('popupclose', function() {
      warperApp.map.removeLayer(warperApp.boundsMarker);
    });
  },

  setView: function (lat, lon, zoom) {
    this.map.setView(new L.LatLng(lat,lon),zoom);
  },

  showMap: function (mapId, data) {
    var bbox = data.items.bbox.split(',');
    var bounds = new L.LatLngBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
    this.map.fitBounds(bounds);

    this.mapId = mapId;

    // create the tile layer 
    var url = warperApp.baseUrl + '/maps/tile/' + this.mapId + '/{z}/{x}/{y}.png';
    var attr = '<a href="http://commons.wikimedia.org">Wikimedia Commons</a> contributors';
    var oldMap = new L.TileLayer(url, {
      minZoom: 8, 
      maxZoom: 20, 
      attribution: attr
    });

    this.layers['m' + mapId] = {
      'mapId':mapId, 
      'layer':oldMap,
      'url':url, 
      'bounds':bounds
    };

    this.map.addLayer(oldMap)
    this.updateZIndexes();
  },

  getCurrentMap: function () {
    return this.mapId;
  },

  toggleClustering: function() {
    console.log(warperApp.clustering);
    warperApp.clustering = !warperApp.clustering;
    console.log(warperApp.clustering);
    if (warperApp.clustering) {
      warperApp.map.removeLayer(warperApp.featureLayer);
      warperApp.map.addLayer(warperApp.clusterLayer);
    } else {
      warperApp.map.removeLayer(warperApp.clusterLayer);
      warperApp.map.addLayer(warperApp.featureLayer);
    }
  },

  toggleBounds: function() {
    warperApp.bounds = !warperApp.bounds;
    if (warperApp.bounds) {
      warperApp.map.addLayer(warperApp.boundsLayer);
    } else {
      warperApp.map.removeLayer(warperApp.boundsLayer);
    }
  },

  // create markers and popups for maps from json returned by warper
  createMapMarkers: function (data) {

    if(this.clustering) {
      var currentLayer = this.clusterLayer;
    } else {
      var currentLayer = this.featureLayer;
    }

    var mapList = [];
    currentLayer.eachLayer(function (layer) {
      console.log(layer.options.mapId)
      mapList.push(parseInt(layer.options.mapId));
    });

    // we want to keep existing markers and just add new ones when necessary
    for (var i = 0; i < data.items.length; i++) {
      if($.inArray(parseInt(data.items[i].id), mapList) == -1) {
        console.log('map ' + data.items[i].id + ' not found, creating marker');
        currentLayer.addLayer(this.createMarker(data.items[i]));
      }
    }
  },

  createMarker: function (data) {
    var description = 'None';
    var title = decodeURIComponent(data.title.replace(/_/g,' '));
    if (data.description)
      description = decodeURIComponent(data.description.replace(/_/g,' '));

    var bbox = data.bbox.split(',');
    var points = this.getBoundsPoints(bbox);

    var marker = L.marker(new L.LatLng(bbox[3], bbox[0]), {
      mapId:data.id,
      title: title,
      desc:description,
      points:points
    });

    marker.on('click', warperApp.markerClick);
    marker.bindPopup('<div data-mapId="' + data.id + '" ><img class="mapimg" src="' + warperApp.baseUrl + '/maps/thumb/' + data.id +'" /><div>' + title + '</div><p>' + description+'</p>');
    return marker;
  },

  // create map bounds from json returned by warper
  createMapBounds: function (data) {

    var currentLayer = this.boundsLayer;
    var mapList = [];

    currentLayer.eachLayer(function (layer) {
      mapList.push(parseInt(layer.options.mapId));
    });

    // we want to keep existing bounds and just add new ones when necessary
    for (var i = 0; i < data.items.length; i++) {
      if($.inArray(parseInt(data.items[i].id), mapList) == -1) {
        console.log('map ' + data.items[i].id + ' not found, creating bounds');
        currentLayer.addLayer(this.createBound(data.items[i]));
      }
    }
  },

  createBound: function (data) {
    var bbox = data.bbox.split(',');
    var points = this.getBoundsPoints(bbox);

    return L.polyline(points, {
      mapId:data.id,
      color: this.boundsColor,
      weight:this.boundsWeight,
      opacity:this.boundsOpacity
    });
  },

  markerClick: function (e) {
    if(warperApp.boundsMarker) {
      warperApp.map.removeLayer(warperApp.boundsMarker);
    }

    warperApp.boundsMarker = L.polyline(this.options.points, { });
    warperApp.map.addLayer(warperApp.boundsMarker);

    // if clustering is NOT enabled, then zoom to map bounds
    if(!warperApp.clustering) {
      warperApp.map.fitBounds(warperApp.boundsMarker.getBounds(),{'paddingTopLeft':[150,350]});
    }
  },

  openMarker: function (mapId) {

    if(this.clustering) {
      var currentLayer = this.clusterLayer;
    } else {
      var currentLayer = this.featureLayer;
    }

    currentLayer.eachLayer(function (layer) {
      if (layer.options.mapId == mapId) {
        layer.openPopup();
        if(warperApp.boundsMarker) {
          warperApp.map.removeLayer(warperApp.boundsMarker);
        }

        warperApp.boundsMarker = L.polyline(layer.options.points, { });
        warperApp.map.addLayer(warperApp.boundsMarker);
        // if clustering is NOT enabled, then zoom to map bounds
        if(!warperApp.clustering) {
          warperApp.map.fitBounds(warperApp.boundsMarker.getBounds(),{'paddingTopLeft':[150,350]});
        }
      }
    });
  },

  // set z-indexes of maps based on sortable layers div
  updateZIndexes: function() {
    var layerOrder = $("#layer_list" ).sortable('toArray').reverse();
    for (i=0; i < layerOrder.length; i++) {
      var layer = warperApp.layers['m' + layerOrder[i]];
      layer.layer.setZIndex(100 + i);
    }
  },

  getBoundsPoints: function(bbox) {
    var start = new L.LatLng(bbox[1], bbox[0]);
    var middle = new L.LatLng(bbox[3], bbox[0]);
    var end = new L.LatLng(bbox[3], bbox[2]);
    var points = [start, middle, end];

    return points;
  }
}
