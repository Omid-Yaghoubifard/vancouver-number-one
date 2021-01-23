$(".custom-file-input").on("change", function(){
    let fileSize = document.getElementById("inputGroupFile").files[0].size,
             val = $(this).val().toLowerCase(),
           regex = new RegExp("(.*?)\.(jpeg|jpg|png|gif|gif|tif|tiff)$");
    if (fileSize > 750000 || fileSize < 200000 || (!(regex.test(val)))) {
        alert("Expected file size: 200 KB to 750 KB | Expected file formats: jpeg, jpg, png, gif, tif, tiff");
        document.getElementById("inputGroupFile").value = "";
        $(this).next(".custom-file-label").html("Upload image");
    } else{
        let fileName = $(this).val().replace(/C:\\fakepath\\/i, "").slice(0,22);
        $(this).next(".custom-file-label").html(fileName);
    }
});

$(".fade-out-items").delay(4000).fadeOut(500);

$(".like-button").on("click", function(){
    let parameters;
    let numOfLikes = parseInt($("#num-of-likes").html().replace(/[^0-9-.]/g, ""));
    if($(this).find("i").hasClass("far")){
        parameters = { id: $(this).val(), change: 1 }
        let incLikes = (numOfLikes + 1)  === 1 ? "like" : "likes"
        $("#num-of-likes").html((numOfLikes + 1).toLocaleString("en"));
        $(".like-likes").html(incLikes);
    }else{
        parameters = { id: $(this).val(), change: -1 }
        let decLikes = (numOfLikes - 1)  === 1 ? "like" : "likes"
        $("#num-of-likes").html((numOfLikes -1).toLocaleString("en"));
        $(".like-likes").html(decLikes);
    }
    $.getJSON( "/updateRating", parameters, data =>{})
    $(this).find("i").toggleClass("far").toggleClass("fas");
});

// Bloodhound with Remote + Prefetch
let wordSuggestions = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("word"),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
        url: "/title-search/%QUERY",
        wildcard: "%QUERY"
    },
});
 
// init Typeahead
$(".typingahead").typeahead(
{
    minLength: 1,
    highlight: true
},
{
    name: "words",
    source: wordSuggestions,
    display: item =>{
        return item;
    },
    limit: 10,
    templates: {
        suggestion: item =>{
            return `<div class= "suggestedItem">${item}</div>`;
        }
    }
}).on("typeahead:selected", e =>{
    e.target.form.submit();
});