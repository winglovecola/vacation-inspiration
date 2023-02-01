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


//reset local storage for testing
//localStorage.removeItem ("search-history");


let input, options, autocomplete;


//initializing google place api
function initGoogleAutocomplete() {


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

      if (place.geometry)
      {

        searchedLocation = place.name;
        searchedLat = place.geometry.location.lat();
        searchedLng = place.geometry.location.lng();



        let adrAddress = place.adr_address; 
        
        searchedLocationData.location = searchedLocation;
        searchedLocationData.region = strExtract (adrAddress, "class=\"region\">", "</span>");
        searchedLocationData.countryName = strExtract (adrAddress, "class=\"country-name\">", "</span>");
        searchedLocationData.lat = searchedLat;
        searchedLocationData.lng = searchedLng;



        //console.log ("searchedLocationData", searchedLocationData);

        //save search history
        saveSearch (searchedLocationData);

        //execute weather api using "open weather"
        vacationCheckInfo (searchedLocationData);
      }
  });
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
    
    placeName = $firstResult[1].textContent;
    placeAddress = $firstResult[2].textContent;
  }


  let searchTerm = placeName + " " + placeAddress;


  $("#search-input").val(searchTerm);


  let geocoder = new google.maps.Geocoder();
  geocoder.geocode({"address":searchTerm}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) 
      {
        //console.log (results[0]);
        searchedLocation = placeName;
        searchedLat = results[0].geometry.location.lat();
        searchedLng = results[0].geometry.location.lng();
  

        //console.log (placeAddress)
        searchedLocationData.location = searchedLocation;
        searchedLocationData.region = placeAddress.substring (0, placeAddress.indexOf (",")).trim();
        searchedLocationData.countryName = placeAddress.substring (placeAddress.indexOf (",") + 1).trim();
        searchedLocationData.lat = searchedLat;
        searchedLocationData.lng = searchedLng;
  

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
    searchHistoryData.forEach (function (thisWeatherData) {

      

      let sdata = thisWeatherData.location + " " + thisWeatherData.region + ", " +  thisWeatherData.countryName;

      weatherSearchHistoryHtml += "<div class='weather-history-tab' location='" + thisWeatherData.location + "' region='" + thisWeatherData.region + "' countryName='" + thisWeatherData.countryName + "' lat='" + thisWeatherData.lat + "' lng='" + thisWeatherData.lng + "' sdata='" + sdata + "'><b>" + thisWeatherData.location + "</b> " + thisWeatherData.region + ", " +  thisWeatherData.countryName + " </div>";
    });
    

    $('#weather-search-history').html ("<br><br><br><br>Search History:<br><br>" + weatherSearchHistoryHtml);


    $( ".weather-history-tab" ).on("click", function() {
      
      //set search bar text
      document.getElementById('search-input').value = $(this).attr ("sdata");
    
      searchedLocation = $(this).attr ("location");


      searchedLocationData.location = searchedLocation;
      searchedLocationData.region = $(this).attr ("region");
      searchedLocationData.countryName = $(this).attr ("countryName");
      searchedLocationData.lat = $(this).attr ("lat");
      searchedLocationData.lng = $(this).attr ("lng");

      //check weather api
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


// travel assistant portion
function questionfunction(){
 
  let questionInput = $("#search-question").val();

  console.log (questionInput);

  chatGptApi (questionInput , "#chatbox");
  
}



//when user press enter, function above 
$("#search-question").on("keyup", function(e) {
  if(e.keyCode == 13) { //press enter
    questionfunction();

  }
});

//weather api function
function vacationCheckInfo (thisSearchedLocationData) {


  //ChatGPT Api
  let askLocation = thisSearchedLocationData.location + ", " + thisSearchedLocationData.countryName;
  
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
  $("#weather-forcast-sec").show ();

  


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


      let weatherForcastDiv = "<div id='weather-forcast-div'>\
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

      let weatherForcastDiv = "<div id='weather-forcast-div'>\
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

/*
curl https://api.openai.com/v1/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
  "model": "text-davinci-003",
  "prompt": "disney world\n\nDisney World is a theme park resort complex in Lake Buena Vista, Florida, near Orlando. It is owned and operated by The Walt Disney Company through its Parks, Experiences and Products division. The resort opened on October 1, 1971, and is the most visited vacation resort in the world, with an attendance of over 66 million people in 2019. The resort is composed of four theme parks (Magic Kingdom, Epcot, Disney's Hollywood Studios, and Disney’s Animal Kingdom), two water parks (Disney's Typhoon Lagoon and Disney's Blizzard Beach), a shopping, dining, and entertainment complex (Disney Springs), 27 themed resort hotels, nine non-Disney hotels, several golf courses, a camping resort, and other entertainment venues.",
  "temperature": 0.7,
  "max_tokens": 256,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0
}'
*/

//chatGPT


function chatGptApi(search, elementID) {
 
  let chatGptApiUrl = "https://api.openai.com/v1/completions";
  let chatGptApiKey = "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";
  
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

  //loading icon
  if ($(elementID))
    $(elementID).html ('<div id="loading-div"><img id="loading-icon" src="./assets/images/loading2.gif"></div>');


  fetch(chatGptApiUrl, fetchOptions)
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
      console.log("data: ", data);

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
            
            printHtml += "<li><a href='https://www.google.com/search?q=" + encodeURIComponent(tempText) + "&tbm=isch' target='_blank'>" + tempText + "</a></li>";
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
        $(elementID).html (data.choices[0].text);
    }
  });
}


const el = document.querySelector("#header-div");

el.addEventListener("mousemove", (e) => {
  el.style.backgroundPositionX = (-e.offsetX * 0.20) + "px";
  //el.style.backgroundPositionY = -e.offsetY + "px";
});
el.addEventListener("mouseout", (e) => {
  //el.style.backgroundPositionX = "300px";
  //el.style.backgroundPositionY = "380px";
});


//chatGptApi ("describe new york, united state vacation", "#place-info");
//chatGptApi ("things to do in disney world", "#place-todo");





//load search location data
loadSearchedLocationData ();

