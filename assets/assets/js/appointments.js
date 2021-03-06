var servurl = "https://services.within30.com/";     //"https://services.within30.com/"
var w30Credentials = "win-HQGQ:zxosxtR76Z80";
var latitude, longitude, userId, services = [];
var country = "";
var tabsCount = 0;

$('.tabModule').gbTab({
    tabUL:".tabMenu",
    tabCont:".tabContent"
})

$(".tabMenu li").on("click", function(){
    tabsCount++;
})

$(".back").on("click", function(){
    goBack();
});

var goBack = function(){
    $("body").addClass("bodyload");
    if(tabsCount == 0)
        window.history.go(-1);
    else
        window.history.go(-2);
}

var refreshOnForeground = function(){
    //location.reload();
}
var locationChange = function(){}

var submitRating = function(appointmentId, rating, subdomain){
    $("body").addClass("bodyload");
    var request1 = $.ajax({
                          url: servurl + "endpoint/api/submitrating",
                          type: "POST",
                          beforeSend: function (xhr) {
                          xhr.setRequestHeader ("Authorization", "Basic " + btoa(w30Credentials));
                          },
                          data: JSON.stringify({"appointmentId":appointmentId, "subdomain": subdomain, "rating": rating}),
                          contentType: "application/json; charset=UTF-8"
                          });
    request1.success(function(result) {
                     $("body").removeClass("bodyload");
                     if(result.Status == "Success"){
                        $(".popContent h2").text("Submit Rating");
                        $(".popContent span").text("Thanks for Rating.");
                        $(".pop_up").show();
                     }else{
                        $(".popContent h2").text("Submit Rating");
                        $(".popContent span").text("Failed to update. Try later.");
                        $(".pop_up").show();
                     }
                     });
    request1.fail(function(jqXHR, textStatus) {
                  $("body").removeClass("bodyload");
                  $(".popContent h2").text("Submit Rating");
                  //$(".popContent strong").text("Failed");
                  $(".popContent span").text("Your request didn't go through. Please try again");
                  $(".pop_up").show();
                  });
}

var getServices = function (){
    var request1 = $.ajax({
                          url: servurl + "endpoint/api/getmyservices",
                          type: "POST",
                          beforeSend: function (xhr) {
                          xhr.setRequestHeader ("Authorization", "Basic " + btoa(w30Credentials));
                          },
                          data: JSON.stringify({}),
                          contentType: "application/json; charset=UTF-8"
                          });
    
    request1.success(function(result) {
                     services.push(result.Data);
                     });
    request1.fail(function(jqXHR, textStatus) {
                  $('body').removeClass('bodyload');
                  console.log(textStatus);
                  });
}

var setView = function(data){
    var pendingSlots = data.pendingSlots.reverse();
    var finishedSlots = data.finishedSlots.reverse();
    if(pendingSlots.length == 0){
        $("#noPending").css("display", "block");
    }
    if(finishedSlots.length == 0){
        $("#noFinish").css("display", "block");
    }
    
    pendingSlots.forEach(function(item, index){
                         var temp = "";
                         if(item.destinationDistance){
                            if(country == "India")
                                temp = (item.destinationDistance*1.60934).toFixed(2)+" kms away";
                            else
                                temp = item.destinationDistance+" miles away";
                         }
                         if(!item.destinationDistance || item.destinationDistance > 55){
                         $(".pendingTab").append('<div class="appointBlock"><div class="contBlock"><div class="contBlockSec"><h3>'+item.companyName+'</h3><p>'+item.selecteddate+' <span>'+item.starttime+'</span></p></div><div class="contBlockSec"><p>'+(item.address.length > 0 ? item.address : "Address Not Provided")+'</p></div></div><div class="contBlockBottom"><span>'+temp+'</span></div></div>');
                         }else{
                            $(".pendingTab").append('<div class="appointBlock"><div class="contBlock"><div class="contBlockSec"><h3>'+item.companyName+'</h3><p>'+item.selecteddate+' <span>'+item.starttime+'</span></p></div><div class="contBlockSec"><p>'+(item.address.length > 0 ? item.address : "Address Not Provided")+'</p></div></div><div class="contBlockBottom"><span>'+temp+'</span><a class="'+item.appointmentId+' '+item.businessType+'" href="#">View on map</a></div></div>');
                         }
                         
                         $("."+item.appointmentId).on("click", function(){
                                                      var serviceName = $(this).attr("class").split(" ")[1];
                                                      var matchFound = -1;
                                                      var serviceId = "";
                                                      services[0].forEach(function(item, index){
                                                                          if(item.name.replace(" ", "").toLowerCase() == serviceName.toLowerCase()){
                                                                          matchFound = index;
                                                                          serviceId = item._id;
                                                                          }
                                                                          });
                                                      if(matchFound != -1){
                                                      w30mob.callNativeApp("saveserviceid", JSON.stringify({"serviceId":serviceId}), function(data){
                                                                           //alert(data);
                                                                           window.location.href = "servicePage.html";
                                                                           });
                                                      
                                                      }else{
                                                      alert("No Category found.");
                                                      }
                                                      })
                         });
    
    finishedSlots.forEach(function(item, index){
                          if(item.rating){
                          $(".finishTab").append('<div class="appointBlock appointFinished"><div class="contBlock"><div class="contBlockSec"><h3>'+item.companyName+'</h3><p>'+item.selecteddate+' <span>'+item.starttime+'</span></p></div><div class="contBlockSec"><p>'+item.address+'</p></div></div><div class="straRating"><strong>Thanks for Rating!</strong><div class="ratingBlock"><div class="rateAppoitnment" id="'+item.appointmentId+'"></div></div></div></div>');
                          $("#"+item.appointmentId).rateYo({
                                                           rating: item.rating,
                                                           readOnly: true,
                                                           starWidth: "10px"
                                                           });
                          }else{
                          $(".finishTab").append('<div class="appointBlock appointFinished"><div class="contBlock"><div class="contBlockSec"><h3>'+item.companyName+'</h3><p>'+item.selecteddate+' <span>'+item.starttime+'</span></p></div><div class="contBlockSec"><p>'+item.address+'</p></div></div><div class="straRating"><strong>Rate your  Experience</strong><div class="ratingSec"><div class="ratingBlock"><div class="rateAppoitnment" id="'+item.appointmentId+'"></div></div><span class="submitRating"></span></div></div></div>');
                          $("#"+item.appointmentId).rateYo({
                                                           fullStar: true,
                                                           starWidth: "16px"
                                                           });
                          
                          $("#"+item.appointmentId).on("click", function(e){
                                                       e.stopPropagation();
                                                       var $this = $(this);
                                                       var rating = Number($("#"+item.appointmentId).rateYo("option", "rating"));
                                                       if(!item.rating){
                                                       var appointmentId = $this.closest(".appointFinished").find(".rateAppoitnment").attr('id');
                                                         submitRating(appointmentId, rating, item.subdomain);
                                                        /*$("#"+item.appointmentId).closest(".appointFinished").find(".submitRating").css("display","inline-block");
                                                        $("#"+item.appointmentId).closest(".appointFinished").find(".submitRating").on("click", function(e){
                                                             var appointmentId = $this.closest(".appointFinished").find(".rateAppoitnment").attr('id');
                                                             submitRating(appointmentId, rating, item.subdomain);
                                                             $(".submitRating").hide();
                                                        });*/
                                                       }
                                                       });
                          }
                          
                          });
    $("body").removeClass("bodyload");
}

var getAppointments = function(){
    if(userId){
        var request1 = $.ajax({
                              url: servurl + "endpoint/api/getappointmentList",
                              type: "POST",
                              beforeSend: function (xhr) {
                              xhr.setRequestHeader ("Authorization", "Basic " + btoa(w30Credentials));
                              },
                              data: JSON.stringify({"userId":userId,"latitude": latitude,"longitude": longitude, "currentTime": moment().format("YYYY-MM-DD HH:mm")}),
                              contentType: "application/json; charset=UTF-8"
                              });
        request1.success(function(result) {
                         if(result.Status == "Ok"){
                         getServices();
                         setView(result);
                         }else{
                         $("body").removeClass("bodyload");
                         $(".popContent h2").text("Get Appointment Status");
                         //$(".popContent strong").text("Failed");
                         $(".popContent span").text("Something went wrong. Try again");
                         $(".pop_up").show();
                         }
                         });
        request1.fail(function(jqXHR, textStatus) {
                      $("body").removeClass("bodyload");
                      $(".popContent h2").text("Get Appointment Status");
                      //$(".popContent strong").text("Failed");
                      $(".popContent span").text("Your request didn't go through. Please try again");
                      $(".pop_up").show();
                      });
    }else{
        $("body").removeClass("bodyload");
        alert("Something went wrong. Try again");
    }
}

$("body").addClass("bodyload");
w30mob.callNativeApp("getlocationtype", null, function(type){
    if(type == "true" ){
        w30mob.callNativeApp("getlatitude", null, function(lat){
            latitude = Number(lat);
            w30mob.callNativeApp("getlongitude", null, function(lng){
                longitude = Number(lng);
                w30mob.callNativeApp("getuserid", null, function(id){
                    userId = id;
                    w30mob.callNativeApp("getcountryname", null, function(cn){
                        country = cn;
                        getAppointments();
                    });
                });
            });
        });
    }else{
        w30mob.callNativeApp("getcustomelat", null, function(lat){
            latitude = Number(lat);
            w30mob.callNativeApp("getcustomelong", null, function(lng){
                longitude = Number(lng);
                w30mob.callNativeApp("getuserid", null, function(id){
                    userId = id;
                    w30mob.callNativeApp("getcountryname", null, function(cn){
                        country = cn;
                        getAppointments();
                    });
                });
            });
        });
    }
});
