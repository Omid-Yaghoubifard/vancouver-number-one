$(".custom-file-input").on("change",function(){
    let fileName = $(this).val().replace(/C:\\fakepath\\/i, ''). slice(0,22)
    $(this).next(".custom-file-label").html(fileName);
});

$(".fadeOutItems").delay(4000).fadeOut(500);