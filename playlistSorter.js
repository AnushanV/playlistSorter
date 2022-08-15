var allVids = []; //stores all the videos from the playlist

/* elements in allVids will have the following format:
{vid:`<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0"; allowfullscreen></iframe>`, op:"VIDEO_TITLE"}
*/

var playlistURL = "https://www.youtube.com/playlist?list=PLRe9ARNnYSY5MJIGaaL5Ka4DKkiscmXE9"; //the playlist to sort

//taken from https://bost.ocks.org/mike/shuffle/
//randomizes the elements in the array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

//Extracts the individual videos and stores them in a single array
function buildArray(result){
  
  var resultItems = result["items"]; 

  for (var i = 0; i < resultItems.length; i++){

    //Store all videos that are not deleted or unavailable into a single array
    if(resultItems[i]["snippet"]["title"] != "Deleted video" && resultItems[i]["snippet"]["title"] != "Video unavailable" ){ 
      var newVid = {};
      newVid["op"] = resultItems[i]["snippet"]["title"];
      videoID = resultItems[i]["snippet"]["resourceId"]["videoId"];
      newVid["vid"] = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoID}" frameborder="0"; allowfullscreen></iframe>`;
      newVid["url"] = `https://www.youtube.com/watch?v=${videoID}`;
      allVids.push(newVid);
    }

  }

}

//Creates the page and implements the sorting of the playlist
function buildPage(){
  shuffle(allVids); //shuffle array
  
  var key = allVids[1]; //initial key for sorting
  var prev = 0; //initial comparison
  var pos = 1; 
  var length = allVids.length;
  var sortedPos = 1; //amount sorted

  //create element to play the first video
  var op1 = document.getElementById("op1");
  var text1 = document.createElement("div");
  text1.innerHTML = allVids[0].vid;
  op1.appendChild(text1);

  //create element to play the second video
  var op2 = document.getElementById("op2");
  var text2 = document.createElement("div");
  text2.innerHTML = allVids[1].vid;
  op2.appendChild(text2);

  //get buttons
  var op1Button = document.getElementById("op1Button");
  var op2Button = document.getElementById("op2Button");

  //first button action
  op1Button.onclick = function(){
    //show results when sorting is complete
    if (sortedPos >= length-1){
      showResults(allVids.length, true);
    }
    //advance number of sorted elements
    else{
      sortedPos++;
      allVids[pos] = key;
      pos = sortedPos;
      prev = pos-1;
      key = allVids[pos];
      
      text1.innerHTML = allVids[prev].vid;
      text2.innerHTML = allVids[pos].vid;
      showResults(sortedPos, false);
    }
  }

  //second button action
  op2Button.onclick = function(){
    //show results when sorting is complete
    if (sortedPos > length-1){
      showResults(allVids.length, true);
    }
    //move right video towards sorted position
    else{
      if (prev >= 0){
        allVids[prev + 1] = allVids[prev];
        allVids[prev] = key;
        pos--;
        if(pos == 0){
          sortedPos++;
        }
        if (pos <= 0){
          pos = sortedPos;
        }
        prev = pos-1;
        key = allVids[pos];
      }
      else{
        sortedPos++;
        sortedPos++;
        pos = sortedPos;
        prev = pos-1;
        key = allVids[pos];
      }
      showResults(sortedPos, false);
    }

    text1.innerHTML = allVids[prev].vid;
    text2.innerHTML = allVids[pos].vid;
  }

  //console.log(allVids.slice(0));
  //console.log(allVids.length);

}

//show sorted results
var showResults = (sortedPos, isComplete) =>{
  
  //remove videos and buttons if sorting is complete
  if(isComplete){
    op1.remove();
    op2.remove();
    op1Button.remove();
    op2Button.remove();
  }

  //clear list
  var sortedList = document.getElementById("sortedList");
  sortedList.innerHTML = "";

  //show percentage of elements in the sorted portion of insertion sort
  var listItem = document.createElement("li");
  listItem.innerHTML = `${Math.round((sortedPos/allVids.length)*100)}% sorted`;
  sortedList.appendChild(listItem);

  //insert sorted results into a list on the webpage
  for(var i = 0; i < sortedPos; i++){
    var listItem = document.createElement("li");
    listItem.innerHTML = `<b>${i+1}.</b> <a href=${allVids[i].url} target="_blank"> ${allVids[i].op}</a>`;
    sortedList.appendChild(listItem);
  }
}

window.onload = function(){

  var submitButton = document.getElementById("submitButton");
  var playlistText = document.getElementById("playlistText");
  var errorMessage = document.getElementById("errorMessage");
  var sortSection = document.getElementById("sortSection");
  
  errorMessage.innerHTML = "";

  submitButton.onclick = function(){
    var success = false;
    playlistURL = playlistText.value;

    //https://stackoverflow.com/questions/52990581/youtube-api-with-javascript-show-all-videos-from-a-playlist - Used for info on YouTube Data v3 api 

      //gets the URL for calling the api
      function getUrl(pagetoken) {
        var pt = (typeof pagetoken === "undefined") ? "" :`&pageToken=${pagetoken}`;
        var mykey = 'AIzaSyBxVA2mRDqoSHzg0tbwURldoYRPA51tYhc';
        var playListID = playlistURL.split("?list=").pop();

        var URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playListID}&key=${mykey}${pt}`;

        return URL;
      }
      
      //Calls the api
      async function apiCall(npt) {
        await fetch(getUrl(npt))
        .then(response => response.json())
        .then(function(response) {
            if(response.error){
              console.log(response.error);
            } else {
              
              responseHandler(response);
              //extract individual videos from the playlist and add them to the array
              buildArray(response);

              //Allow user to start sorting only once all the videos are stored in the array
              if(!response.nextPageToken){  
                buildPage();
              }
              success = true;
            }
        });
      }
      
      //Calls the api again if there are multiple pages in the playlist
      function responseHandler(response){
        if(response.nextPageToken){
          apiCall(response.nextPageToken);
        }
      }

      //apiCall();

      
      let promise = new Promise((resolve, reject) => {
        setTimeout(async function(){
          await apiCall();
          if(success){
            resolve("Success");
          }
          else{
            reject("Fail");
          }
        })
      })
      

      promise.then((successMessage) => {
        console.log(successMessage);
        console.log("IN PROMISE: " + success);

        if(success){
          sortSection.style.display = "block";
          var inputSection = document.getElementById("inputSection");
          inputSection.remove();
        }
      }).catch((failMessage) =>{
        console.log(failMessage);
        errorMessage.innerHTML = "Error retrieving videos from playlist. Make sure the playlist URL is correct.";
      });
      //apiCall();

      
      

      
  }


  
};

