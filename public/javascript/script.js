$(".custom-file-input").on("change",function(){
    let fileName = $(this).val().replace(/C:\\fakepath\\/i, '')
    $(this).next(".custom-file-label").html(fileName);
});