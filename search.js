/**
Do a simple GET request on a given transcript.
Calls write() to write received text to screen.
*/
function httpGet(theUrl) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false);
    xmlHttp.send(null);
    //console.log(xmlHttp.responseText);
   //write(xmlHttp);
    return xmlHttp.responseText;
}
function httpPost(mixToPost)
{
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "http://api.hyperaud.io/v1/fpruitt/mixes");
    xmlHttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (typeof cb !== "undefined") {
                cb(this);
            }
            else
            {
                alert('Status: ' + this.status + '\nHeaders: ' + JSON.stringify(this.getAllResponseHeaders()) + '\nBody: ' + this.responseText);
            }
        }
    };
    xmlHttp.send(mixToPost);
}
/**
Write text based on received transcript.
Uses json-sans-eval to evaluate JSON.
http://code.google.com/p/json-sans-eval/
*/
function write(xmlHttp) {
    var data = jsonParse(xmlHttp.responseText);
    //document.getElementById("id").innerHTML = "ID: <i>" + data._id + "</i>";
    //document.getElementById("desc").innerHTML = "Description: <i>" + data.desc + "</i>";
    //document.getElementById("label").innerHTML = "Label: <i>" + data.label + "</i>";
    //document.getElementById("label").innerHTML = "Label: <i>" + data.label + "</i>";
    document.getElementById("hiddenText").innerHTML = data.content;
    //console.log(data.content);
    //console.log(document.getElementById("hiddenText").innerHTML);
}

function clearText()
{
    document.getElementById("search").value = "";
}

function findString2() {
    //Grab plaintext of content to search
    var text = document.getElementById("search").value;

    if (text == null || text === "") {
        alert("You must select a transcript before searching!");
        return;
    }

    //Split search terms up, save in array
    var searchArray = text.split(" ");
    console.log(searchArray);

    //Convert array to store SearchTerms instead of just strings
    //To access search term, you will use searchArray[i].term
    //If term is matched, the transcript id and timestamp will be filled in. 
    //Otherwise, we will know term was not matched because properties timestamp and transcriptID will be null.
    for (var i = 0; i < searchArray.length; i++) {
        searchArray[i] = new FoundTerm(null, searchArray[i], null, null);
    }

    var form = document.getElementById('videoSelect');

    //Create list of transcripts that we are searching
    var transcriptsToGet = new Array();
    for (var i = 0; i < form.length; i++) {
        if (form.elements[i].type == 'checkbox') {
            if (form.elements[i].checked == true) {
                transcriptsToGet.push(form.elements[i].value);
                //console.log(form.elements[i].value);
            }
        }
    }

    console.log(transcriptsToGet);

    var hiddenText = document.getElementById('hiddenText');
    var media = null;
    for (var j = 0; j < transcriptsToGet.length; j++) {
        var currentTranscript = httpGet('http://api.hyperaud.io/v1/transcripts/' + transcriptsToGet[j]);
        //console.log(currentTranscript);
        hiddenText.innerHTML = "";
        document.getElementById("hiddenText").innerHTML = jsonParse(currentTranscript).content;
        media = jsonParse(currentTranscript).media.source.youtube.url;
        //console.log(document.getElementById("hiddenText"));
        var result = null

        //Find all possible words in this transcript.
        findWords(searchArray, transcriptsToGet[j], media, currentTranscript);
    }
    console.log(searchArray);

    //Make a transcript out of the found words
    var results = "<article>";
    var postResults = "\"\u003Carticle\u003E";
    var prevTranscript = null;
    for (var i = 0; i < searchArray.length; i++) {
        console.log("Adding " + searchArray[i].term + ' to the transcript...');
        //If this is a term we matched
        if (searchArray[i].timestamp != null)
        {
            //If this term comes from a different transcript (or is the first term), add the appropriate section class...
            if (searchArray[i].transcript._id != prevTranscript)
            {
                console.log("adding section heading...");
                //close previous section if this isn't the first term
                if (results != "")
                {
                    results = results + '</p></section>';
                    //postResults = postResults + '\u003C/p\u003E\u003C/section\u003E';
                    postResults = postResults + '</p></section>';
                }

                results = results + '<section class = "item" data-id="' + searchArray[i].transcript.media._id + '" data-yt="' + searchArray[i].transcript.media.source.youtube.url + '" data-unit="0.001"> <p>';
                postResults = postResults + '<section class = \"item" data-id=\"' + searchArray[i].transcript.media._id + '\" data-yt=\"' + searchArray[i].transcript.media.source.youtube.url + '\" data-unit=\"0.001\"> <p>';
                prevTranscript = searchArray[i].transcript;
            }
            results = results + '<a data-m ="' + searchArray[i].timestamp + '" class="transcript-grey">' + searchArray[i].term + '</a>';
            postResults = postResults + '<a data-m=\"' + searchArray[i].timestamp + '\"class=\"transcript-grey\">' + searchArray[i].term + '</a>';
        }
    }
    results = results + '</p></section></article>';
    //postResults = "\u003C/p\u003E\u003C/section\u003E\u003C/article\u003E\"";
    postResults = postResults + '</p></section></article>';
    //console.log(results);
    //console.log(postResults);

    //Testing posting results...
    var postString = "{\n    \"content\":"+postResults+",\n    \"desc\": \"Description not set\",\n    \"label\": \"CLIPCHAIN TEST\",\n    \"owner\": \"fpruitt\",\n    \"type\": \"beta\",\n    \"tags\": []\n}"
    //console.log(postString);
    //httpPost(postString);
    console.log(HA.Stage);

    var ht = {
        init: function ()
        {
            this.music = HA.Music({
                target: "#music-player"
            });
            this.projector = HA.Projector({
                target: "#target-video",
                music: this.music
            });
            this.stage = HA.Stage({
                target: "#target-stage",
                mix: {
                    content: results, // See: mix/example-mix.js
                    title: "Test Static Mix",
                    desc: "To demonstrate the use of the mix content option with the Stage.",
                    type: "html"
                },
                projector: this.projector
            });
            // this.hint();
        }
    }
    ht.init();
    document.getElementById("stage").innerHTML = results;
    //console.log(hyperaudio.Stage);
}


function findWords(searchArray, transcriptID, media, transcript) {
    /*
    
        
    
    //TODO: Clean Teaxt Before searching
    
    //Trim the search terms into individual pieces.
    var searchArray = str.split(" ");
    console.log(searchArray);
    //Clear any previous search results
    document.getElementById("searchFound").innerHTML = "";
    
    */
    var timestamp;
    var timestampText;

    //We will fill this array with found terms.
    var foundTerms = new Array();
    //Search this transcript for each word
    for (var term in searchArray) {

        //sel is a pointer to a selection location on the page.
        //If we find a word, the selection pointer points to it.
        //We can then extract the parent element info (ie, the anchor tag it is surrounded by)
        //and save the time stamp.
        var sel = window.getSelection();
        //Move pointer to the 'content' section so we don't scan through unnecessary junk.
        sel.collapse(document.getElementById("hiddenText"), 0);
        console.log(sel);
        timestamp = null; timestampText = null;
        6
        console.log("Looking for " + searchArray[term].term);
        window.find(searchArray[term].term);

        //console.log(sel.anchorNode);
        timestampText = sel.anchorNode.parentElement.outerHTML;
        //Trim away the anchor tag, just get the bit that matters- the value.
        var timestamp = timestampText.split(/[""]/)[1];


        //console.log(sel);
        var foundWord = sel.focusNode.data.trim();
        console.log("Current word: " + foundWord);
        if (timestamp !== null && timestamp !== "searchFound" && timestamp !== undefined && sel.focusNode.data.trim() === searchArray[term].term) {
            //document.getElementById("searchFound").innerHTML += "<br />Foun4
            console.log("FOUND at timestamp: " + timestamp + ": " + sel.focusNode.data);
            searchArray[term].transcriptID = transcriptID;
            searchArray[term].timestamp = timestamp;
            searchArray[term].media = media;
            searchArray[term].transcript = jsonParse(transcript);
        }

        else
        {
            console.log("Term " + searchArray[term] + " not found in this transcript.");
            //return null;
        }

    }

}

function FoundTerm(transcriptID, term, timestamp, media, transcript) {
    this.transcriptID = transcriptID;
    this.term = term;
    this.timestamp = timestamp;
    this.media = media;
    this.transcript = transcript;
}