var warper = {
  apiUrl: 'http://warper.wmflabs.org',

  getMapInfo: function (mapId, callback ) {
    var queryUrl = warper.apiUrl + '/maps/' + mapId + '.json';
    warper.getJSON (queryUrl, callback);
  },

  geoSearch: function (bounds, callback ) {
    var bbox = bounds.getWest() + ',' + bounds.getSouth() + ',' + bounds.getEast() + ',' + bounds.getNorth();
    var queryUrl = Warper.apiUrl + '/maps/geosearch?bbox=' + bbox + '&format=json&page=1&operation=intersect';
    warper.getJson (queryUrl, callback);
  },

  textSearch: function (bounds, callback ) {
    alert('Text search not implemented yet!');
  },

  getJson: function(url, callback) {
    var request = $.ajax({
      url: url,
      method: 'GET',
      dataType: 'json'
    });

    request.done(function(data) {
      callback(data);
    });

    request.fail(function() {
      warper.alert('negative', 'The Warper seams to be offline.');
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
