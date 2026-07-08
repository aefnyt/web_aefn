
  (function ($) {
  
  "use strict";

    // MENU
    $('.navbar-collapse a').on('click',function(){
      $(".navbar-collapse").collapse('hide');
    });
    
    // CUSTOM LINK
    $('.smoothscroll').click(function(){
      var el = $(this).attr('href');
      var elWrapped = $(el);
      var header_height = $('.navbar').height();
  
      scrollToDiv(elWrapped,header_height);
      return false;
  
      function scrollToDiv(element,navheight){
        var offset = element.offset();
        var offsetTop = offset.top;
        var totalScroll = offsetTop-navheight;
  
        $('body,html').animate({
        scrollTop: totalScroll
        }, 300);
      }
    });

    $(window).on('scroll', function(){
      function isScrollIntoView(elem, index) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();
        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(window).height()*.5;
        if(elemBottom <= docViewBottom && elemTop >= docViewTop) {
          $(elem).addClass('active');
        }
        if(!(elemBottom <= docViewBottom)) {
          $(elem).removeClass('active');
        }
        var MainTimelineContainer = $('#vertical-scrollable-timeline')[0];
        var MainTimelineContainerBottom = MainTimelineContainer.getBoundingClientRect().bottom - $(window).height()*.5;
        $(MainTimelineContainer).find('.inner').css('height',MainTimelineContainerBottom+'px');
      }
      var timeline = $('#vertical-scrollable-timeline li');
      Array.from(timeline).forEach(isScrollIntoView);
    });
  
  })(window.jQuery);

  /* Ensure hero logo sits below the navbar by setting top padding dynamically */
  (function($){
    'use strict';
    function adjustHeroLogoPadding(){
      var logoSection = $('.hero-logo-section');
      if(!logoSection.length) return;
      // keep a small fixed gap now that logo is below the carousel
      logoSection.css('padding-top', '18px');
    }
    $(document).ready(function(){
      adjustHeroLogoPadding();
      $(window).on('resize scroll', function(){ adjustHeroLogoPadding(); });
    });
    
      /* Lightbox handler */
      function initLightbox(){
          var overlay = $('#lightboxOverlay');
          var img = overlay.find('.lightbox-img');

          // Open
          $(document).on('click', '.lightbox-link', function(e){
              e.preventDefault();
              var src = $(this).data('src') || $(this).attr('href');
              if(!src) return;
              img.attr('src', src);
              overlay.addClass('active').attr('aria-hidden','false');
              // prevent body scroll
              $('body').css('overflow','hidden');
          });

          // Close handlers
          overlay.on('click', function(e){
              if(e.target === this) closeLightbox();
          });
          overlay.find('.lightbox-close').on('click', function(){ closeLightbox(); });

          $(document).on('keydown', function(e){
              if(e.key === 'Escape') closeLightbox();
          });

          function closeLightbox(){
              overlay.removeClass('active').attr('aria-hidden','true');
              img.attr('src','');
              $('body').css('overflow','');
          }
      }

      $(document).ready(function(){ initLightbox(); });

    })(window.jQuery);



    /* Open navbar dropdowns on hover for desktop */
    (function($){
      'use strict';
      function enableHoverDropdown(){
        if($(window).width() > 992){
          $('.navbar .dropdown').on('mouseenter.hoverDropdown', function(){
            $(this).addClass('show');
            $(this).find('.dropdown-menu').addClass('show');
          }).on('mouseleave.hoverDropdown', function(){
            $(this).removeClass('show');
            $(this).find('.dropdown-menu').removeClass('show');
          });
        } else {
          $('.navbar .dropdown').off('.hoverDropdown');
        }
      }
      $(document).ready(function(){ enableHoverDropdown(); $(window).on('resize', enableHoverDropdown); });
    })(window.jQuery);


