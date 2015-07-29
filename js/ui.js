$(document).ready(function() {
  $("#tabs").tabs();
});

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