var warper = {
  init: function() {
    var endpoint = 'warper api endpoint';

    var request = $.ajax({
      url: endpoint,
      method: 'GET'
    });

    request.done(function() {
      // init
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
};
