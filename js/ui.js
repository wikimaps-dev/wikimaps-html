$(document).ready(function() {
  $('#tabs').tabs({'active':1});
  $('#tabs' ).tabs('disable', 0 );
  $('#tabs' ).tabs('disable', 3 );
  $('.alert-container').hide();

  // currently we use proxy because of cross domain restrictions
  W_API.api_url = 'http://wikihacks.opendimension.org/wmaps_html/proxy.php?query=warper&url=';

  // init leaflet
  W_LEAFLET.base_url = 'http://warper.wmflabs.org';
  W_LEAFLET.init();
  W_LEAFLET.setView(60.1619343018, 24.9516973282, 12);


  // make a geosearch every time when map stops moving
  W_LEAFLET.map.on('moveend', function() {
    if (W_LEAFLET.geo_search == 1) {
      W_API.geoSearch(map.getBounds(), showSearch);
    }
  });

  // map title search binding
  $('#map_search').keypress(function(e){
    // if enter key pressed
    if(e.which == 13) {
      W_API.textSearch(this.value, showSearch);
    }
  });

  // clicking a map thumbnail in marker popup opens the map
  $('#search-result-container').on('click', 'img', function(event) {
    showMapFromList($(this).parent().data('map_id'));
    event.preventDefault();
  });

  // clicking a map thumbnail in marker popup opens the map
  $(document).on('click', '.mapimg', function() {
    W_LEAFLET.map.closePopup();
    showMap($(this).parent().data('map_id'));
  });

  // clicking a map thumbnail in layers section zooms to map
  $('#layer_list').on('click', 'img', function() {
    var map_id = $(this).parent().data('map_id');
    W_LEAFLET.map.fitBounds(W_LEAFLET.layers['m' + map_id].bounds);
  });

  $('#layer_list').on('click', '.delete', function() {
    var map_id = $(this).parent().data('map_id');
    $(this).parent().remove();
    W_LEAFLET.map.removeLayer(W_LEAFLET.layers['m' + map_id].layer);
  });

  //// make layer list sortable 
  $('#layer_list').sortable({
    handle: '.handle',
    update:function(event, ui) {
      W_LEAFLET.updateZIndexes();
    }
  });

// *************** SOME TEST CONTROLS ****************************

  var clustering = L.control({position: 'topleft'});
  clustering.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'clustering');
    div.innerHTML = '<form><input id="clustering" ' + 'type="checkbox"/>clustering</form>'; 
    return div;
  };

  clustering.addTo(W_LEAFLET.map);
  document.getElementById('clustering').addEventListener('click', W_LEAFLET.toggleClustering, false);

  var bounds = L.control({
    position: 'topleft'
  });

  bounds.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'show map coverage');
    div.innerHTML = '<form><input id="bounds" ' + 'type="checkbox"/>bounds</form>'; 
    return div;
  };

  bounds.addTo(W_LEAFLET.map);
  document.getElementById('bounds').addEventListener ('click', W_LEAFLET.toggleBounds, false);

// *************** SOME TEST CONTROLS ENDS ***********************

  $('#user-menu-trigger').on('click', function() {
    if ($('.dropdown').is(':visible')) {
      $('.dropdown').slideUp();
    } else {
      $('.dropdown').slideDown();
      $('#first-dropdown-link').focus();
    }
  });

  $('.dropdown').focusout(function() {
    $('.dropdown').slideUp();
  });
});

// show individual map
function showMap(map_id) {
  // fit bounds first
  W_LEAFLET.map.fitBounds(W_LEAFLET.boundsMarker.getBounds());
  // then show the map
  W_API.getMapInfo(map_id, createLayerDiv)
}

// show individual map
function showMapFromList(map_id) {
  // fit bounds first
  W_LEAFLET.openMarker(map_id);
  // then show the map
  //W_API.getMapInfo(map_id, createLayerDiv)
}


// show the result of search as markers and list
function showSearch(data) {
  W_LEAFLET.createMapMarkers(data);
  W_LEAFLET.createMapBounds(data);
  createMapList(data, '.search-result-container');
}

// create list of maps from json returned by warper
function createMapList (data, target) {
  var items = [];
  $.each(data.items, function(key, val) {
    var html = '<div class="map-box" data-map_id="' + val.id + '">' + '<img aria-hidden="true" src="' + W_LEAFLET.base_url + '/maps/thumb/' + val.id + '" />' + '     <div>' + '        <h4>' + decodeURIComponent(val.title.replace(/_/g, ' ')) + '</h4>' + '         <p>' + decodeURIComponent(val.description) + '</p>'+ '     </div>' + '</div>';
    items.push( html );
  });

  $(target ).empty();
  $(target).append(items.join(''));
}

// create item in layers section
function createLayerDiv(data) {
  // create
  $("#layer_list" ).prepend( '<div class="img_list_div" id="' + data.items.id + '" data-map_id="' + data.items.id + '"><img src="' + W_LEAFLET.base_url + '/maps/thumb/' + data.items.id + '" /><span class="handle"></span><div class="delete">X</div><div class="mapinfo">' + decodeURIComponent(data.items.title.replace(/_/g,' ')) + '</div><div class="slider"></div></div>' );

  // set transparency slider
    $( "#layer_list .slider:first" ).slider({
      min:0,
      max:100,
      value:100,
      slide: function(event, ui) {
        map_id = $(event.target).parent().attr('id');
        W_LEAFLET.layers['m' + map_id].layer.setOpacity(sliderToOpacity(ui.value))
      }
  });

  // show map
  W_LEAFLET.showMap(data.items.id, data);
}

// mapping function
function sliderToOpacity (value) {
  var in_min = 0;
  var in_max = 100;
  var out_min = 0;
  var out_max = 1;
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
