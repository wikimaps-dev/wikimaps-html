// Leaflet integration for Map Warper (Wikimaps)


var W_LEAFLET = {
    map_div:		'map',
    base_url:		'http://warper.wmflabs.org',
    layers: 		{},
    geo_search: 	true,
    clustering: 	false,
    bounds: 		false,
    bounds_opacity: 0.5,
    bounds_color: 	'blue',
    bounds_weight: 	2,
    markers: 		[],
	init: function () {
		
		// set up the map
		map = new L.Map(this.map_div);
		this.map = map;

		// create the base map layer 
		var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
		var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
		var osm = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 20, attribution: osmAttrib});	
		this.osm_layer = osm;	

		// initial view
		this.map.setView(new L.LatLng(60.1619343018,24.9516973282),12); // Helsinki
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
			W_LEAFLET.map.removeLayer(W_LEAFLET.boundsMarker);
		});		
	},

	setView: function (lat, lon, zoom) {
		this.map.setView(new L.LatLng(lat,lon),zoom);
	},
	
   	showMap: function (map_id, data) {
		var bbox = data.items.bbox.split(',');
		var bounds = new L.LatLngBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
		this.map.fitBounds(bounds);
		
		this.map_id = map_id;
        
		// create the tile layer 
		var url= W_LEAFLET.base_url+'/maps/tile/'+this.map_id+'/{z}/{x}/{y}.png';
		var attr='<a href="http://commons.wikimedia.org">Wikimedia Commons</a> contributors';
		var old_map = new L.TileLayer(url, {
			minZoom: 8, 
			maxZoom: 20, 
			attribution: attr
		});
		this.layers['m'+map_id] = {
			'map_id':map_id, 
			'layer':old_map,
			'url':url, 
			'bounds':bounds };
		
		this.map.addLayer(old_map)
		this.updateZIndexes();
    },
    	
    getCurrentMap: function () {
		return this.map_id;
		
	},
	
	toggleClustering: function() {
		console.log(W_LEAFLET.clustering);
		W_LEAFLET.clustering = !W_LEAFLET.clustering;
		console.log(W_LEAFLET.clustering);
		if (W_LEAFLET.clustering) {
			W_LEAFLET.map.removeLayer(W_LEAFLET.featureLayer);
			W_LEAFLET.map.addLayer(W_LEAFLET.clusterLayer);
		} else {
			W_LEAFLET.map.removeLayer(W_LEAFLET.clusterLayer);
			W_LEAFLET.map.addLayer(W_LEAFLET.featureLayer);
		}
	},

	toggleBounds: function() {
		W_LEAFLET.bounds = !W_LEAFLET.bounds;
		if (W_LEAFLET.bounds) {
			W_LEAFLET.map.addLayer(W_LEAFLET.boundsLayer);
		} else {
			W_LEAFLET.map.removeLayer(W_LEAFLET.boundsLayer);
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
			console.log(layer.options.map_id)
			mapList.push(parseInt(layer.options.map_id));
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
			map_id:data.id,
			title: title, 
			desc:description, 
			points:points 
		});
		marker.on('click', W_LEAFLET.markerClick);
		marker.bindPopup('<div data-map_id="'+data.id
			+'" ><img class="mapimg" src="'+W_LEAFLET.base_url+'/maps/thumb/'
			+data.id+'" /><div>' + title + '</div><p>'
			+description+'</p>');
		return marker;
	
	},

	// create map bounds from json returned by warper
	createMapBounds: function (data) {

		var currentLayer = this.boundsLayer;
		
		var mapList = [];
		currentLayer.eachLayer(function (layer) {
			mapList.push(parseInt(layer.options.map_id));
		});	
		
		// we want to keep existing bounds and just add new ones when necessary
		for (var i = 0; i < data.items.length; i++) {
			if($.inArray(parseInt(data.items[i].id), mapList) == -1) {
				console.log('map ' +data.items[i].id + ' not found, creating bounds');
				currentLayer.addLayer(this.createBound(data.items[i]));
			}
			
		}
	},

	createBound: function (data) {

		var bbox = data.bbox.split(',');
		var points = this.getBoundsPoints(bbox);
		return L.polyline(points, {
			map_id:data.id, 
			color: this.bounds_color, 
			weight:this.bounds_weight, 
			opacity:this.bounds_opacity});
	
	},
	
	markerClick: function (e) {
		
		if(W_LEAFLET.boundsMarker)
			W_LEAFLET.map.removeLayer(W_LEAFLET.boundsMarker);
			
		W_LEAFLET.boundsMarker = L.polyline(this.options.points, { });
		W_LEAFLET.map.addLayer(W_LEAFLET.boundsMarker);
		
		// if clustering is NOT enabled, then zoom to map bounds
		if(!W_LEAFLET.clustering) {
			W_LEAFLET.map.fitBounds(W_LEAFLET.boundsMarker.getBounds(),{'paddingTopLeft':[150,350]});
			
		}
	},

	// set z-indexes of maps based on sortable layers div
	updateZIndexes: function() {
		var layer_order = $("#layer_list" ).sortable('toArray').reverse();
		for (i=0; i < layer_order.length; i++) {
			var layer = W_LEAFLET.layers['m'+layer_order[i]];
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


