
String.prototype.supplant = function (o) {
  return this.replace(/{([^{}]*)}/g, function (a, b) {
    var r = o[b];
    return typeof r === 'string' || typeof r === 'number' ? r : a;
  });
};

$(function () {
  
  // Resize UI elements to accomodate photos nicely.
  // For brevity, the p prefix denotes photo and the c prefix denotes container.
  var pSize = 77; 
  
  // Set the container width to a multiple of the photo size wider than the doc,
  // to use all available real estate
  var cWidth = Math.ceil($('body').width() / pSize) * pSize;
  $('#container').css('width', cWidth);
  
  // Set the content outer height to a multiple of the photo size, to avoid
  // awkward empty space at bottom
  var content = $('#content')
    , prevContentOuterHeight = content.outerHeight()
    , prevContentHeight = content.height()
    , newContentOuterHeight = Math.ceil(prevContentOuterHeight / pSize) * pSize
    , newContentHeight = newContentOuterHeight - (prevContentOuterHeight - prevContentHeight);
  content.css('height', newContentHeight);
  
  // Set the right hand section width to occupy the last remaining space middle space.
  var rightWidth = cWidth - content.outerWidth() - pSize * 2;
  $('#container .right').css('width', rightWidth);
  
  var showFirstPhoto = function (photo, url, caption) {
    $('#main-photo')
      .attr('href', url)
      .find('.wrapper').append(photo).end()
      .find('.caption').append(caption);
  };
  
  var populateTop = function (photos) {
    // Fill the top section with as many photos as possible, and return the remainder
    var target = $('#container .top');
    var slots = (cWidth / pSize) * 2;
    for (var i = 0; i < slots; i++) {
      target.append(photos.pop());
    }
    return photos;
  };
  
  var populateMiddle = function (photos) {
    // Fill the left and right sections with as many photos as possible, maintaining
    // order such that it appears that photos are ordered left-to-right despite being
    // in different divs.
    var left = $('#container .left')
      , right = $('#container .right')
      , content = $('#content')
      , hSlots = content.outerHeight() / pSize
      , rSlots = (cWidth - content.outerWidth() - pSize * 2) / pSize;
      
    for (var h = 0; h < hSlots; h++) {
      for (var l = 0; l < 2; l ++) {
        left.append(photos.pop());
      }
      var rFill = (h < 4 ? rSlots - 3 : rSlots);
      for (var r = 0; r < rFill; r++) {
        right.append(photos.pop());
      }
    }
    return photos;
  };
  
  var trimBottom = function () {
    // Once .bottom has been populated, reduce height by one row, for tidiness (as this
    // row is unlikely to have been filled)
    var target = $('#container .bottom')
      , oldHeight = target.height();
    target.css('height', oldHeight - pSize);
  };
    
  var imgTemplate = "<img src='http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_s.jpg' title='{title}' />";
  var largeImageTemplate = "<img src='http://farm{farm}.static.flickr.com/{server}/{id}_{secret}.jpg' title='{title}' />";
  var urlTemplate = "http://www.flickr.com/photos/30702620@N04/{id}";
  var photoTemplate = "<a href='{href}' class='photo' rel='nofollow'></a>";
  var captionTemplate = "me, {timeago} <span class='arrow'>↶</span>";
  
  $.getJSON("http://api.flickr.com/services/rest/",
      {
        method: 'flickr.photosets.getPhotos',
        api_key: '7d7dbfe46562af3c2cd3080fcedcf01c',
        photoset_id: '72157626022484506',
        format: 'json',
        nojsoncallback: 1
      },
      function (data) {
        if (data.stat === 'ok') {
          var firstPhoto = data.photoset.photo.pop()
            , firstPhotoImg = largeImageTemplate.supplant(firstPhoto)
            , firstPhotoUrl = urlTemplate.supplant(firstPhoto)
            , firstPhotoTime = firstPhoto.title.replace('My face @ ', '').replace(' at', '')
            , timeago = humaneDate(new Date(firstPhotoTime + ' PDT')).toLowerCase()
            , caption = captionTemplate.supplant({timeago: timeago});
          showFirstPhoto(firstPhotoImg, firstPhotoUrl, caption);
          
          var photos = $.map(data.photoset.photo, function (photo, i) {
            var img = $(imgTemplate.supplant(photo))
              , url = urlTemplate.supplant(photo)
              , photoAnchor = photoTemplate.supplant({'href': url});
            
            // Delay image display randomly, to increase RADness
            $(img).bind('load', function () {
              var that = $(this);
              var show = function () { that.fadeIn(); };
              setTimeout(show, Math.random() * 5000);
            });
            return $(photoAnchor).append(img);
          });
          
          photos = populateTop(photos)
          photos = populateMiddle(photos)
          
          $.each(photos.reverse(), function (i, photo) {
            $('#container .bottom').append(photo);
          });
          
          // After allowing time for the DOM to recognize the newly 
          // inserted photos in .bottom, trim it
          setTimeout(trimBottom, 100);
        }
      });
      
});

