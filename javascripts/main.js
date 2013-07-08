(function($) {
  'use strict';

  var $window = $(window);

  $.fn.appearingMenu = function() {
    var targetElement = $('header');
    var menuElement = $(this);

    menuElement.hide();
    menuElement.css({
      'position': 'fixed',
      'top': '0px',
    })

    $window.on('scroll.appearingMenu resize.appearingMenu', function() {
      if($window.scrollTop() >= targetElement.height() && menuElement.is(':hidden')) {
        menuElement.slideDown({duration: 200});
      } else if($window.scrollTop() < targetElement.height() && menuElement.is(':visible')) {
        menuElement.slideUp({duration: 200});
      }
    });
  }
})(jQuery);

$(function() {
  $('nav').appearingMenu();
});