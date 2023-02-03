let searchedLocation, searchedLat, searchedLng;

let timeTableHtml = "";
let timeBlockClass = "";
let isCurrentHour = "";

let weatherNowHtml = "";
let weatherForcastHtml = "";


let currentHour = dayjs().hour();


let currentDayhtml = dayjs().format('dddd[, ]MMMM D');


let searchHistoryDataRaw = [];
var searchHistoryData = [];

let searchedLocationData = {};


let googlePhotoDisplayLimit = 6; //control how many google image display in the page
let googlePhotoFound = 0;

let input, options, autocomplete;
let map, marker, infoWindow, userLocation;

//reset local storage for testing
//localStorage.removeItem ("search-history");




//click logo to go back
const popularCity = document.getElementById("popular-city")
const logo = document.getElementById("logo-div")
logo.addEventListener("click", function(event) {
  window.location.reload();
})


//initializing google place api
function initGoogleAutocomplete() {

  //set default coordinate for Toronto
  userLocation = {
    lat: 43.6532,
    lng: 79.3832
  };


  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: userLocation.lat, lng: userLocation.lng },
    zoom: 7,
  });


  infowindow = new google.maps.InfoWindow({
    content: "",
    ariaLabel: "",
  });

  marker = new google.maps.Marker({
    position: new google.maps.LatLng(userLocation.lat, userLocation.lng),
    map: map,
  });  


  //set map to user location if available
  // Try HTML5 geolocation.
  /*
  if (navigator.geolocation) 
  {
    navigator.geolocation.getCurrentPosition((position) => {
        
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setCenter(userLocation);
      marker.setPosition(userLocation);
    },
    () => {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }*/





  //option for search cities in United States and Canada must include the following option
  //componentRestrictions: {country: ["us", "ca"]}

  //'amusement_park', 'tourist_attraction', 'aquarium', 'museum'
  //options = {
  //  types: ['(cities)']
   // 
  // };

  
  options = {
  };

  input = document.getElementById('search-input');

  autocomplete = new google.maps.places.Autocomplete(input, options);
    google.maps.event.addListener(autocomplete, 'place_changed', function () {
      
      let place = autocomplete.getPlace();
      //console.log (place)


      // If the place has a geometry, then present it on a map.
      
 
      if (place.geometry)
      {
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17);
        }
      }
      else
        return;

      marker.setVisible(false);
      
      marker.setPosition(place.geometry.location);
      marker.setVisible(true);

      infowindow.open(map, marker);


      if (place.geometry)
      {

        searchedLocation = place.name;
        searchedLat = place.geometry.location.lat();
        searchedLng = place.geometry.location.lng();

        //console.log (place);

        let adrAddress = place.adr_address; 
        
        searchedLocationData.location = searchedLocation;
        searchedLocationData.region = strExtract (adrAddress, "class=\"region\">", "</span>");
        searchedLocationData.countryName = strExtract (adrAddress, "class=\"country-name\">", "</span>");
        searchedLocationData.lat = searchedLat;
        searchedLocationData.lng = searchedLng;
        searchedLocationData.placeId = place.place_id;

        googlePhotoApi (place, googlePhotoDisplayLimit, "#place-photo");
        popularCity.classList.add("none")



        //console.log ("searchedLocationData", searchedLocationData);

        //save search history
        saveSearch (searchedLocationData);

        //execute weather api using "open weather"
        vacationCheckInfo (searchedLocationData);
      }
  });
}



function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}


function googlePhotoApi (place, imageLimit, elementID) {


  googlePhotoFound = 0;


  if (place)
  {
  
    if (!place.photos) {
      $("#place-photo").hide ();
      return;
    }

    let photos = place.photos;
    let photoUrl = "";
    let placePhotoHtml = "";

    if (photos.length < imageLimit)
      imageLimit = photos.length;


      
    if (imageLimit > 0)
    {
      for (let i = 0; i < imageLimit; i++)
      {
        photoUrl = photos[i].getUrl({maxWidth: 240, maxHeight: 240});
        placePhotoHtml += "<div class='place-photo-div'><img src='" + photoUrl + "'></div>";
      }

      googlePhotoFound = imageLimit;
      
    }
    else
    {
      $("#place-photo").hide ();
    }
    
    $(elementID).html (placePhotoHtml);
  }
  else
  {
    $("#place-photo").hide ();
  }
}


//add key listener for ENTER key
$("#search-input").on("keyup", function(e) {
  if(e.keyCode == 13) { //press enter
    geocodeSearch("first-suggestion", "");
  }
});



//google geocode search
//user hit ENTER key to search
function geocodeSearch(placeName, placeAddress) {
  
  if (placeName == "first-suggestion")
  {
    let $firstResult = $('.pac-item:first').children();
    
    if ($firstResult)
    {
      placeName = $firstResult[1].textContent;
      placeAddress = $firstResult[2].textContent;
    }
    else
      return;
  }


  let searchTerm = placeName + " " + placeAddress;


  $("#search-input").val(searchTerm);
  popularCity.classList.add("none")

  let geocoder = new google.maps.Geocoder();
  geocoder.geocode({"address":searchTerm}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) 
      {
        //console.log ("Geocoder", results);
        
        place = results[0];
          
        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
          map.setZoom(10);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17);
        }


        marker.setVisible(false);
        
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        infowindow.open(map, marker);
        
        searchedLocation = placeName;
        searchedLat = place.geometry.location.lat();
        searchedLng = place.geometry.location.lng();
  

        //console.log (placeAddress)
        searchedLocationData.location = searchedLocation;
        searchedLocationData.region = placeAddress.substring (0, placeAddress.indexOf (",")).trim();
        searchedLocationData.countryName = placeAddress.substring (placeAddress.indexOf (",") + 1).trim();
        searchedLocationData.lat = searchedLat;
        searchedLocationData.lng = searchedLng;
        searchedLocationData.placeId = results[0].place_id;


 
        placesService = new google.maps.places.PlacesService(map);
     
        placesService.getDetails(
        {
          placeId: place.place_id,
          fields: ['name', 'photos']
        },
        (placeDetail) => {
          //console.log (place);
          googlePhotoApi (placeDetail, googlePhotoDisplayLimit, "#place-photo");

        });



        //remove focus on search input
        input.blur();

        saveSearch (searchedLocationData);

        
        vacationCheckInfo (searchedLocationData);
      }
  });
}




//contruct search history buttons
function renderSearchedLocation () {
  
  if (searchHistoryData)
  {
    let weatherSearchHistoryHtml = "";


    //console.log ("searchHistoryDataRaw", searchHistoryData.length)

    let sdataId = 0;

    
    searchHistoryData.forEach (function (thisWeatherData) {

      let sdata = thisWeatherData.location + " " + thisWeatherData.region + ", " +  thisWeatherData.countryName;

      weatherSearchHistoryHtml += "<div class='history-tab' sdata-id='" + sdataId + "' location='" + thisWeatherData.location + "' region='" + thisWeatherData.region + "' countryName='" + thisWeatherData.countryName + "' lat='" + thisWeatherData.lat + "' lng='" + thisWeatherData.lng + "' sdata='" + sdata + "'><b>" + thisWeatherData.location + "</b> " + thisWeatherData.region + ", " +  thisWeatherData.countryName + " </div>";
    
      sdataId++;
    });
    

    $('#search-history').html ("Search History:<br><br>" + weatherSearchHistoryHtml + "<div id='clear-history-div'><div onclick='clearHistory()'>Clear History</div></div>");


    $( ".history-tab" ).on("click", function() {
      
      //set search bar text
      document.getElementById('search-input').value = $(this).attr ("sdata");
    
 
      thisSdataId = $(this).attr ("sdata-id");
      searchedLocationData = searchHistoryData[thisSdataId];
      
      searchedLocation = searchedLocationData.location;
      


      placesService = new google.maps.places.PlacesService(map);
     

      placesService.getDetails
      (
        {
          placeId: searchedLocationData.placeId,
          fields: ['name', 'photos', 'geometry']
        },
        (place) => {
          //console.log (place);

          // If the place has a geometry, then present it on a map.
          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
            map.setZoom(10);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
          }


          marker.setVisible(false);
          
          marker.setPosition(place.geometry.location);
          marker.setVisible(true);

          infowindow.open(map, marker);

          googlePhotoApi (place, googlePhotoDisplayLimit, "#place-photo");
        }
      );


      //console.log (searchedLocationData)


      //check info, to do, and weather
      vacationCheckInfo (searchedLocationData);

    });
  }
}


//load search location data
function loadSearchedLocationData () {

  searchHistoryDataRaw = localStorage.getItem("search-history");
  
  
  if (searchHistoryDataRaw)
  {
    searchHistoryData = JSON.parse(searchHistoryDataRaw);

    renderSearchedLocation ();
  }
}



//string extract function
function strExtract (str, beginningStr, EndingStr) {

  let extractedStr = "";


  if (str.indexOf (beginningStr) !== -1)
  {
    extractedStr = str.substring(str.indexOf (beginningStr) + beginningStr.length);

    extractedStr = extractedStr.substring(0, extractedStr.indexOf (EndingStr));
  }
  
  return extractedStr;
}

let chatId = 0;

// travel assistant portion
function questionfunction(){
 
  let questionInput = $("#search-question").val();

  //console.log (questionInput);

  if (!questionInput)
  {
    if (questionInput.trim () == "")
      return;
  }

  if (questionInput)
  {
    //console.log ('"' + questionInput.trim () + '"')
    
    if (questionInput.trim () == "")
      return;

  }




  let chatIdText = "c" + chatId;
  let chatIdQuestion = "q" + chatId;

  $("#chatbox").append("<div id ='" + chatIdQuestion + "' class = 'ai-question'>"
   + "<span id = 'chatboxID' >" + questionInput + "</span>" + "</div>");

  //append new div, add id chatHistory, 

  $("#chatbox").append("<div class = 'ai-answer' ><span id ='" + chatIdText + "'></span></div>");


  chatGptApi(questionInput ,  "#" + chatIdText);

  $("#chatbox").show();

 

  chatId++;

}
 


//when user press enter, function above 
$("#search-question").on("keyup", function(e) {
  if(e.keyCode == 13) { //press enter
    questionfunction();
    
  
    // clear input search value after enter key
    $('#search-question').val('');


  }

});

//weather api function
function vacationCheckInfo (thisSearchedLocationData) {


  //ChatGPT Api
  let askLocation = thisSearchedLocationData.location + " " +  thisSearchedLocationData.region + ", " + thisSearchedLocationData.countryName;
  
  chatGptApi ("describe a vacation to \"" + askLocation + "\"", "#place-info");

  
  chatGptApi ("things to do in \"" + askLocation + "\"", "#place-todo");
  


  //open weather api 
  let openWeatherApiUrl = "https://api.openweathermap.org/data/2.5/forecast?lat=" + thisSearchedLocationData.lat + "&lon=" + thisSearchedLocationData.lng + "&appid=55c6ad05fb90696b0befe8a67cb935d7";

  //show loading icon
  $("#loading").show ();

  if (thisSearchedLocationData.lat != undefined && thisSearchedLocationData.lng != undefined)
  {
    fetch(openWeatherApiUrl)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      //console.log('Fetch Response \n-------------');
      //console.log(data);
      
      weatherShow (data);
  
    });

  }
}  



function weatherShow (weatherDataRaw) {

  //scroll to weather now div
  $("html, body").animate({ scrollTop: $("#place-info").offset().top - 100}, 500);

  $("#loading").hide ();
  
  $("#weather-now-sec").show ();
  $("#weather-forcast-sec").css ("display", "flex");

  $("#map").show ();
  $("#place-info").show ();
  $("#place-todo").show ();

  if (googlePhotoFound > 0)
    $("#place-photo").css ("display", "flex");

  closeNav ();


  weatherNowHtml = "";
  weatherForcastHtml = "";

  let listCount = 0;
  let dateDiffBegin = null;

  //console.log (weatherDataRaw);
  //console.log (weatherDataRaw.list.length)





  weatherDataRaw.list.forEach (function (thisWeather) {

    let todayDate = dayjs ();
    let weatherDate = dayjs(thisWeather.dt * 1000);

    let weatherDateHour = weatherDate.format ("hA");

    let dateDiff = weatherDate.diff(todayDate, "d")


  
    if (dateDiffBegin === null)
      dateDiffBegin = dateDiff;


    //console.log ("dateDiff:" + dateDiff, weatherDate.format ("M/DD/YYYY"));
    //filter the day that I want
    
    
    

    listCount++;

    
    //console.log ("test: " + dateDiff + "==" +  dateDiffBegin);
    if (dateDiff == dateDiffBegin) //today
    {
      if (listCount > 1)
        return;
    }
    else if (dateDiff <= 3 + dateDiffBegin)
    {
      if (weatherDateHour != "10AM")
        return;

    }
    else //fifth date
    {
      //console.log ("listCount:" + weatherDataRaw.list.length + " != " +listCount)
      if (weatherDataRaw.list.length != listCount)
      {
        if (weatherDateHour != "10AM" && weatherDateHour != "10PM" )
          return;
      }
      else
        return;
    }
    
    
    let today = dayjs ().format ("MMM DD YYYY");
    
    //let dateHtml = weatherDate.format ("YYYY-MM-DD hA");
    //console.log(weatherDate.format ("YYYY-MM-DD hA"));
    
    let tempF = Math.round (1.8 * (thisWeather.main.temp - 273) + 32, 2);  
    let windMph = Math.round (thisWeather.wind.speed * 2.2369, 2);
    let humidity = thisWeather.main.humidity;

    let weatherIcon = "<img class='weather-icon' src='http://openweathermap.org/img/wn/" + thisWeather.weather[0].icon + "@2x.png'> ";

    let weatherIconLg = "<img class='weather-icon-lg' src='http://openweathermap.org/img/wn/" + thisWeather.weather[0].icon + "@4x.png'> ";
    
    
    if (listCount == 1) //always use the first weather data from the array as the weatherNowHtml
    {
          
      weatherNowHtml = "<div id='weather-now-div'>\
        <div class='location-div'><b>" + searchedLocation + "</b> (" + today + ")</div>\
        <div class='icon-div'>" + weatherIconLg + "<br>" + thisWeather.weather[0].description + "</div>\
        <div class='info-div'>\
          <div class='temp-div'>" + tempF + "&#176;F</div>\
          <div class='wind-div'>Wind " + windMph + " MPH</div>\
          <div class='humidity-div'>Humidity " + humidity + "%</div>\
        </div>\
      </div>";


    }
    else if (dateDiff <= 3 + dateDiffBegin)
    {
      
      let forcastDate = weatherDate.format ("MMM DD");


      let weatherForcastDiv = "<div id='weather-forcast-div' class='col-4 p-1'>\
        <div class='date-div'>" + forcastDate + "</div>\
        <div class='icon-div'>" + weatherIcon + thisWeather.weather[0].description + "</div>\
        <div class='info-div'>\
          <div class='temp-div'>" + tempF + "&#176;F</div>\
          <div class='wind-div'>Wind " + windMph + " MPH</div>\
          <div class='humidity-div'>Humidity " + humidity + "%</div>\
        </div>\
      </div>";

      weatherForcastHtml += weatherForcastDiv;   

    }
    else //fifth date
    {
      if (weatherDateHour == "10AM")
      {
        var forcastDate = weatherDate.format ("MMM DD");
      }
      else
      {
        //since open weather only has 5 day of forcast, thus need to make up an extra day
        var forcastDate = dayjs((thisWeather.dt + 86400) * 1000).format ("MMM DD");
      }

      let weatherForcastDiv = "<div id='weather-forcast-div' class='col-4 p-1'>\
        <div class='date-div'>" + forcastDate + "</div>\
        <div class='icon-div'>" + weatherIcon + thisWeather.weather[0].description + "</div>\
        <div class='info-div'>\
          <div class='temp-div'>" + tempF + "&#176;F</div>\
          <div class='wind-div'>Wind " + windMph + " MPH</div>\
          <div class='humidity-div'>Humidity " + humidity + "%</div>\
        </div>\
      </div>";
  
      weatherForcastHtml += weatherForcastDiv;   

    }

  });



  $("#weather-now-sec").html (weatherNowHtml);

  $("#weather-forcast-sec").html ("<div class='title-div'>5-Day Forcast</div>" + weatherForcastHtml);
}






function saveSearch (thisSearchedLocationData) {

  Object.keys(searchHistoryData).forEach (function (key) {
    
    
    if (searchHistoryData[key] && searchedLocationData)
    {
      //console.log ("key", searchHistoryData[key].location + " == " + thisSearchedLocationData.location, key)

      if (searchHistoryData[key].location == thisSearchedLocationData.location)
      {     
        searchHistoryData.splice (key, 1);

        return;
      }
    }
  });


  
  
  //must make a new copy of the object in order to prevent error
  const clone = Object.assign({}, thisSearchedLocationData); //structuredClone(thisSearchedLocationData);
  
  
  //added to front of the array list
  searchHistoryData.unshift (clone);

  if (searchHistoryData.length > 10) //only limit to 15 search history to be saved
  {
    searchHistoryData.pop ();
  }

  //save to local storage
  localStorage.setItem("search-history", JSON.stringify(searchHistoryData));

  renderSearchedLocation ();
}



function clearHistory () {

  localStorage.removeItem ("search-history");
  searchHistoryData = [];
  $('#search-history').html ("");
  
}




//chatGPT
function chatGptApi(search, elementID) {
 

  let chatGptApiUrl = "https://api.openai.com/v1/completions";
  let chatGptApiKey = "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";
  //let chatGptApiKey = "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";

  
  
  let fetchData = {
    model: "text-davinci-003",
    prompt: search,
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  }
  
  let fetchOptions = {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + chatGptApiKey
    },
    body: JSON.stringify(fetchData)
  };


  let loadText = "";
  
  //loading icon
  if ($(elementID))
  {
    if (elementID == "#place-info")
      loadText = " Looking into this place for you.";
    else if (elementID == "#place-todo")
      loadText = " Finding fun things to do, please wait.";
    else
      loadText = "";
    
    $(elementID).html ('<div id="loading-div"><img id="loading-icon" src="./assets/images/loading2.gif">' + loadText + '</div>');
  }

  fetch(chatGptApiUrl, fetchOptions)
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    //console.log("data: ", data);

    //loading data into page
    if ($(elementID))
    {
      let printHtml = "";
      
      if (elementID == "#place-todo")
      {
    
        let todoRawText = data.choices[0].text;
        todoRawText = todoRawText.trim ();

        let todoArray = todoRawText.split ("\n");

        

        let tempText = "";
        Object.keys(todoArray).forEach (function (key) {
    
          if (todoArray[key])
          {
            //remove the 1. 2. 3. in the beginning of the text
            
            tempText = todoArray[key].replace(/[0-9]+\./, '');
            
            let askLocation = searchedLocationData.location + " " +  searchedLocationData.region + ", " + searchedLocationData.countryName;
            let searchQuery = askLocation + ": " + tempText;

            printHtml += "<li><a href='https://www.google.com/search?q=" + encodeURIComponent(searchQuery) + "&tbm=isch' target='_blank'>" + tempText + "</a></li>";
          }
        });


        printHtml = "<h2>To Do List:</h2><ol>" + printHtml + "</ol>";


        $(elementID).html (printHtml);
      }
      else if (elementID == "#place-info")
      {
        printHtml = "<h2>" + searchedLocation + "</h2>" + data.choices[0].text;
        $(elementID).html (printHtml);
      }
      else
      {
        //console.log (data.choices[0].text);
        textTrimed = data.choices[0].text.replace(/(?:\r\n|\r|\n)/g, '<br>');
        $(elementID).html (textTrimed);
      }
    }
  });
}

//create moving effect on the header bar
const el = document.querySelector("#header-div");

el.addEventListener("mousemove", (e) => {
  if (e.target.id != "travel-assistant")
    el.style.backgroundPositionX = (-e.offsetX * 0.20) + "px";

});

const searchBar = document.getElementById("ai-searchbar")

//load search location data
loadSearchedLocationData ();
const sidePanel = document.getElementById("ai-div")
sidePanel.classList.add("none")
searchBar.classList.add("none")

function openNav() {
  sidePanel.classList.remove("none")
  searchBar.classList.remove("none")
  document.getElementById("ai-div").style.width = "375px";
  $('#sideclick').show ();
}

/* Set the width of the sidebar to 0 (hide it) */
function closeNav() {
  sidePanel.classList.add("none")
  searchBar.classList.add("none")
  document.getElementById("ai-div").style.width = "0px";
}

const sideClick = document.getElementById("sideclick")
sideClick.addEventListener("mouseover", function(event) {
  if (document.getElementById("ai-div").style.width == "0px") {
    openNav();
  } else if (document.getElementById("ai-div").style.width == "375px") {
    closeNav();
  }})