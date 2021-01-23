$(".verify-button").on("click", function(){
    parameters = { id: $(this).val() };
    $(this).addClass("disabled")
    $.getJSON( "/verifyPost", parameters, data =>{})
});

$(".approve-comment").on("click", function(){
    parameters = { id: $(this).val() };
    $(this).addClass("disabled");
    $.getJSON( "/verifyComment", parameters, data =>{})
});

$(".delete-comment").on("click", function(){
    parameters = { id: $(this).val() };
    $(this).addClass("disabled");
    $.getJSON( "/deleteComment", parameters, data =>{})
});

$(".flag-user").on("click", function(){
    let parameters;
    if($(this).hasClass("false")){
        parameters = { id: $(this).val(), change: true };
        $(this).toggleClass("true").toggleClass("false");
        $(this).toggleClass("btn-primary").toggleClass("btn-danger");
        $(this).html("true");
    }else{
        parameters = { id: $(this).val(), change: false };
        $(this).toggleClass("true").toggleClass("false");
        $(this).toggleClass("btn-primary").toggleClass("btn-danger");
        $(this).html("false");
    }
    $.getJSON( "/profile/flagusers", parameters, data =>{})
});