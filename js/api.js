var W_API = {
  api_url: 	'http://warper.wmflabs.org',

  getMapInfo: function (map_id, callback ) {
    var query_url = W_API.api_url + "/maps/"+map_id+".json";
    W_API.getJSON (query_url, callback);
  },

  geoSearch: function (bounds, callback ) {
    var bbox = bounds.getWest()+','+bounds.getSouth()+','+bounds.getEast()+','+bounds.getNorth();
    var query_url = W_API.api_url + '/maps/geosearch?bbox='+bbox+'&format=json&page=1&operation=intersect'
    W_API.getJSON (query_url, callback);
  },

    textSearch: function (bounds, callback ) {
      alert('Text search not implemented yet!');
    },

  getJSON: function(url, callback) {
    var request = $.ajax({
      url: url,
      method: 'GET',
      dataType: "json"
    });

    request.done(function(data) {
      callback(data);
    });

    request.fail(function() {
      W_API.alert('negative', 'The Warper seams to be offline.');
    });
  },

  alert: function(type, message) {
    var validAlertTypes = ['progressive', 'negative', 'default'];
    console.log(validAlertTypes.type);

    if ($.inArray(validAlertTypes, type)) {
      $('.alert-container').append('<div class="alert ' + type +'">' + message + '</div>');
      setTimeout(function() {
        $('.alert-container .alert').first().remove();
      }, 6000);
    } else {
      console.log('invalid alert type');
    }
  }
}
