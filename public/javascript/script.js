$(".custom-file-input").on("change", function(){
    let fileSize = document.getElementById("inputGroupFile").files[0].size;
    if (fileSize > 600000 || fileSize < 200000) {
        alert("The image size must be over 200 KB but no more than 600 KB.");
        document.getElementById("inputGroupFile").value = "";
    } else{
        let fileName = $(this).val().replace(/C:\\fakepath\\/i, ''). slice(0,22);
        $(this).next(".custom-file-label").html(fileName);
    }
});

$(".fadeOutItems").delay(4000).fadeOut(500);