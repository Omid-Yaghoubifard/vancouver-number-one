$(".custom-file-input").on("change", function(){
    let fileSize = document.getElementById("inputGroupFile").files[0].size,
             val = $(this).val().toLowerCase(),
           regex = new RegExp("(.*?)\.(jpeg|jpg|png|gif|gif|tif|tiff)$");
    if (fileSize > 750000 || fileSize < 200000 || (!(regex.test(val)))) {
        alert("Expected file size: 200 KB to 750 KB | Expected file formats: jpeg, jpg, png, gif, tif, tiff");
        document.getElementById("inputGroupFile").value = "";
        $(this).next(".custom-file-label").html("Upload image");
    } else{
        let fileName = $(this).val().replace(/C:\\fakepath\\/i, ''). slice(0,22);
        $(this).next(".custom-file-label").html(fileName);
    }
});

$(".fadeOutItems").delay(4000).fadeOut(500);