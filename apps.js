//http://api.indeed.com/ads/apisearch?
// Google API Key: AIzaSyDwrMAUq00y5-e7XSYl51CjQadoGn9REF0

// do more than one ajax call using as our q: developer, programmer, engineer, coder etc. to take into account the different titles for different countries

// after receiving the results use .concat to join array
// use _.uniq which will omit duplicate resuls within the array

var remote = {};

var googleAPIKey = 'AIzaSyDwrMAUq00y5-e7XSYl51CjQadoGn9REF0';

//Pagination for results
remote.renderPagination = function(data, resetPagination) {
  var totalResults = data.totalResults;
  var resultsPerPage = 10;
  if ($('.pagination').hasClass('simple-pagination')) {
    $('.pagination').pagination('updateItems', data.totalResults);
    if (resetPagination) {
      $('.pagination').pagination('selectPage', 1);
    }
  } else {
    $('.pagination').pagination({
      items: totalResults,
      itemsOnPage: resultsPerPage,
      cssStyle: 'light-theme',
      onPageClick: function(pageNumber, event) {
        if (event) {
          event.preventDefault();
        }
        var startAt = (pageNumber - 1) * resultsPerPage;
        remote.getData(startAt);
      }
    });
  }
};

// GET DATA //FIRST AJAX CALL
remote.getData = function(startAt, resetPagination) {
  $.ajax({
    url: 'http://api.indeed.com/ads/apisearch',
    method: 'GET',
    dataType: 'jsonp',
    data: {
      publisher: '8031956003452346',
      v: '2',
      format: 'json',
      q: remote.query + " remote developer -'no remote' -'not remote' -'not a remote' -'no opportunities for remote'",
      latlong: '1',
      sort: remote.sort,
      co: remote.country,
      start: startAt,
      limit: '10'
    },
    error: function( data ) {
        $('.results').append("<div class='ad-blocker-results'><p>Please consider temporarily disabling your ad-blocker while you use this app.</p></div>") 
      }
  }).then(function(data) {
    //console.log("total results " + data.totalResults);
    if (data.totalResults === 0) {
      $('.results').append('<h3>Sorry, there are no results for your query.</br> Try searching again using different terms.</h3>')
    } else {
      remote.renderPagination(data, resetPagination);
      $('.results').html('');
      remote.googleData(data.results);
    };
  });
};




//Need to write a forEach to iterate through the array of jobs and pull out certain properties for us to display onto the page 
// Some properties to be stored for

// DISPLAY: jobtitle, company, formattedLocation, snippet, url, formattedRelativeTime

// TO STORE: latitude, longtitude, for Google Maps API for time zones
// .start for

// GET data from Google Maps API
// make a multiple ajax call to Google Maps using .when because we will be passing an array 
// What will be returned is an array-like object in which we will use .map to iterate through this array and do stuff

remote.googleData = function(data) {
  var latlongArray = [];

  data.map(function(jobs) {
    if (jobs.latitude === undefined) {
      jobs.latitude = 0;
    }

    if (jobs.longitude === undefined) {
      jobs.longitude = 0;
    }

    var latlong = jobs.latitude + ',' + jobs.longitude;
    latlongArray.push(latlong);
  });

  var googleMapsAPI = latlongArray.map(function(latlong) {
    return $.ajax({
      url: 'https://maps.googleapis.com/maps/api/timezone/json',
      method: 'GET',
      dataType: 'json',
      data: {
        location: latlong,
        timestamp: 1331161200,
        key: googleAPIKey
      }
    });
  });

  $.when.apply(null, googleMapsAPI)
    .then(function() {
      var timeZoneArray = Array.prototype.slice.call(arguments);
      //console.log(timeZoneArray);
      getTimeZone(timeZoneArray);
    });

  // take timezone data thats being pushed to the page
  // for the timezone data that appears (0,0), we need to change that data to say ("NA") via "if" statements

  function getTimeZone(timeZoneArray) {
    remote.timeZone = timeZoneArray.map(function(time) {
        if (time[0].status === 'ZERO_RESULTS') {
          time[0].timeZoneName = 'NA';
        }
        return time[0].timeZoneName;
      })
      // console.log(remote.timeZone);
    remote.finalResults(data);
  };
};

// append timezone data onto the page according to the appropriate job posting

remote.finalResults = function(data) {
  data.forEach(function(jobs, i) {
    jobs.snippet = jobs.snippet.replace(/(<([^>]+)>)/ig, '');

    var jobTitle = $('<h2>').text(jobs.jobtitle);
    var company = $('<h3>').text(jobs.company);
    var location = $('<h3>').text(jobs.formattedLocation);
    var jobDescription = $('<p>').text(jobs.snippet);
    var indeedUrl = $('<p class="get-more-btn">').html('<a href = "' + jobs.url + '" target= "_blank"><button>Get More</button></a>');
    var postingTime = $('<h3>').text(jobs.formattedRelativeTime);
    var zone = $('<h3 class="timezone">').text(remote.timeZone[i]);

    // take these variables that we've defined and display it on our html
    $('.results').append(jobTitle, company, location, jobDescription, indeedUrl, postingTime, zone);
    //};
  });
};

remote.clearInputs = function() {
  remote.query = $('#second-submit').val('');
  remote.country = $('#second-search-country').val('');
}

// INIT FUNCTION
remote.init = function() {
  //detect ad-blocker
  if (window.canRunAds === undefined) {
    $('.ad-blocker').append("<p><span class='alert'>* * </span>It appears you are using an ad-blocker. That's cool; we use one too. However, this may negatively impact the performance and content of this web application. Please consider temporarily disabling your ad-blocker while you use this app.</p>")
  }
    $('#first-search').on('submit', function(e) {
      e.preventDefault();
      $('.results').empty();
      $('header').slideUp();
      $('main').show();
      $('footer').show();
      remote.query = $('input[type=text]').val();
      remote.country = $('select').val();
      remote.getData(0, true);
      remote.secondSearch();
    });

  $('.relevance').on('click', function(e) {
    e.preventDefault();
    $(e.currentTarget).addClass('clicked');
    $('.date').removeClass('clicked');
    remote.sort = "relevance";
    remote.getData(0, true);
  });
  $('.date').on('click', function(e) {
    e.preventDefault();
    $(e.currentTarget).addClass('clicked');
    $('.relevance').removeClass('clicked');
    remote.sort = "date";
    remote.getData(0, true);

  });


  $('.second-nav').on('click', function(e) {
    e.preventDefault();
    $(e.currentTarget).addClass('transformed');
    $(e.currentTarget).removeClass('.second-nav');
  });
  $('.transformed').on('click', function(e) {
    e.preventDefault();
    $(e.currentTarget).addClass('.second-nav');
    $(e.currentTarget).removeClass('transformed');
  })
};

//SECOND SEARCH
remote.secondSearch = function() {
  $('#second-search').on('submit', function(e) {
    e.preventDefault();
    $('.results').empty();
    remote.query = $('#second-search-query').val();
    remote.country = $('#second-search-country').val();
    remote.getData(0, true);
  });
};

// DOCUMENT READY
$(function() {
  remote.init();
  $('main').hide();
  $('footer').hide();
});
