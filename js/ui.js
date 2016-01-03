$(document).ready(function() {
  $('#tabs').tabs({'active':1});
  $('#tabs' ).tabs('disable', 0 );
  $('#tabs' ).tabs('disable', 3 );
  $('.alert-container').hide();

  // currently we use proxy because of cross domain restrictions
  warper.apiUrl = 'http://wikihacks.opendimension.org/wmaps_html/proxy.php?query=warper&url=';

  // init leaflet
  warperApp.baseUrl = 'http://warper.wmflabs.org';
  warperApp.init();
  warperApp.setView(60.1619343018, 24.9516973282, 12);


  // make a geosearch every time when map stops moving
  warperApp.map.on('moveend', function() {
    if (warperApp.geoSearch == 1) {
      warper.geoSearch(map.getBounds(), showSearch);
    }
  });

  // map title search binding
  $('#map_search').keypress(function(e){
    // if enter key pressed
    if(e.which == 13) {
      warper.textSearch(this.value, showSearch);
    }
  });

  // clicking a map thumbnail in marker popup opens the map
  $('#search-result-container').on('click', 'img', function(event) {
    showMapFromList($(this).parent().data('map_id'));
    event.preventDefault();
  });

  // clicking a map thumbnail in marker popup opens the map
  $(document).on('click', '.mapimg', function() {
    warperApp.map.closePopup();
    showMap($(this).parent().data('map_id'));
  });

  // clicking a map thumbnail in layers section zooms to map
  $('#layer_list').on('click', 'img', function() {
    var mapId = $(this).parent().data('map_id');
    warperApp.map.fitBounds(warperApp.layers['m' + mapId].bounds);
  });

  $('#layer_list').on('click', '.delete', function() {
    var mapId = $(this).parent().data('map_id');
    $(this).parent().remove();
    warperApp.map.removeLayer(warperApp.layers['m' + mapId].layer);
  });

  //// make layer list sortable 
  $('#layer_list').sortable({
    handle: '.handle',
    update:function(event, ui) {
      warperApp.updateZIndexes();
    }
  });

// *************** SOME TEST CONTROLS ****************************

  var clustering = L.control({position: 'topleft'});
  clustering.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'clustering');
    div.innerHTML = '<form><input id="clustering" ' + 'type="checkbox"/>clustering</form>'; 
    return div;
  };

  clustering.addTo(warperApp.map);
  document.getElementById('clustering').addEventListener('click', warperApp.toggleClustering, false);

  var bounds = L.control({
    position: 'topleft'
  });

  bounds.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'show map coverage');
    div.innerHTML = '<form><input id="bounds" ' + 'type="checkbox"/>bounds</form>'; 
    return div;
  };

  bounds.addTo(warperApp.map);
  document.getElementById('bounds').addEventListener ('click', warperApp.toggleBounds, false);

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
function showMap(mapId) {
  // fit bounds first
  warperApp.map.fitBounds(warperApp.boundsMarker.getBounds());
  // then show the map
  warper.getMapInfo(mapId, createLayerDiv)
}

// show individual map
function showMapFromList(mapId) {
  // fit bounds first
  warperApp.openMarker(mapId);
  // then show the map
  //warper.getMapInfo(mapId, createLayerDiv)
}


// show the result of search as markers and list
function showSearch(data) {
  warperApp.createMapMarkers(data);
  warperApp.createMapBounds(data);
  createMapList(data, '.search-result-container');
}

// create list of maps from json returned by warper
function createMapList (data, target) {
  var items = [];
  $.each(data.items, function(key, val) {
    var html = '<div class="map-box" data-map_id="' + val.id + '">' + '<img aria-hidden="true" src="' + warperApp.baseUrl + '/maps/thumb/' + val.id + '" />' + '     <div>' + '        <h4>' + decodeURIComponent(val.title.replace(/_/g, ' ')) + '</h4>' + '         <p>' + decodeURIComponent(val.description) + '</p>'+ '     </div>' + '</div>';
    items.push( html );
  });

  $(target ).empty();
  $(target).append(items.join(''));
}

// create item in layers section
function createLayerDiv(data) {
  // create
  $("#layer_list" ).prepend( '<div class="img_list_div" id="' + data.items.id + '" data-map_id="' + data.items.id + '"><img src="' + warperApp.baseUrl + '/maps/thumb/' + data.items.id + '" /><span class="handle"></span><div class="delete">X</div><div class="mapinfo">' + decodeURIComponent(data.items.title.replace(/_/g,' ')) + '</div><div class="slider"></div></div>' );

  // set transparency slider
    $( "#layer_list .slider:first" ).slider({
      min:0,
      max:100,
      value:100,
      slide: function(event, ui) {
        mapId = $(event.target).parent().attr('id');
        warperApp.layers['m' + mapId].layer.setOpacity(sliderToOpacity(ui.value))
      }
  });

  // show map
  warperApp.showMap(data.items.id, data);
}

// mapping function
function sliderToOpacity (value) {
  var inMin = 0;
  var inMax = 100;
  var outMin = 0;
  var outMax = 1;
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
