var servurl = "https://services.within30.com/";     //"https://services.schejule.com:9095/"
var sockurl = "https://socket.within30.com/";       //"https://socket.schejule.com:9090/"
var w30Credentials = "win-HQGQ:zxosxtR76Z80";
var serviceId = "";
var serviceName = "";
var urlLink = ".within30.com/";
var localImagePath = "./assets/img/";
var milesValue = 60;
var minutesValue = 60;
var markers = [];
var customers = [];
var map = null;
var userMarker = null;
var latitude = 0, longitude = 0;
var circle = null;
var mapProp = null;
var bookedSlotAt = [];
var bookedSlotDate = [];
var bookedSlotSubdomain = [];
var subDomains = [];
var services = [];
var sliderTime = null;
var currentMarker = -1;
var oldMarker = -1;
var bookedBusiness = null;
var locationRedirect = false;
var socketio = io.connect(sockurl);
var calling = "false";
var website = "false";
var websiteDomain = "";
var directionIndex = -1;
var directionService = new google.maps.DirectionsService();
var directionsDisplay = new google.maps.DirectionsRenderer();
directionsDisplay.setOptions( { suppressMarkers: true, preserveViewport: true } );
var directionStop = 1;
var websiteBackButton = false;
var reload = false;
var country = "";

$(".serviceSection").swipe( {
                           swipeUp:function(event, direction, distance, duration) {
                           $('.directionArrowTop').hide();
                           $('.directionArrowBottom').show();
                           $('.serviceSection').animate({
                                                        height:'330px'
                                                        },200);
                           },
                           swipeDown:function(event, direction, distance, duration) {
                           $('.directionArrowBottom').hide();
                           $('.directionArrowTop').show();
                           $('.serviceSection').animate({
                                                        height:'115px'
                                                        },200);
                           },
                           click:function(event, target) {
                           },
                           threshold:100,
                           allowPageScroll:"vertical"
                           });

var abbrs = {
    EST : 'America/New_York',
    EDT : 'America/New_York',
    CST : 'America/Chicago',
    CDT : 'America/Chicago',
    MST : 'America/Denver',
    MDT : 'America/Denver',
    PST : 'America/Los_Angeles',
    PDT : 'America/Los_Angeles',
    IST : "Asia/Kolkata"
};
var email, mobilenumber, userid, firstname;
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
                     
                     var matchFound = -1;
                     services[0].forEach(function(item, index){
                                         if(item._id == serviceId){
                                         matchFound = index;
                                         serviceName = item.name;
                                         }
                                         });
                     if(matchFound != -1){
                     $("#catagorySelect").text('');
                     $("#catagorySelect").text(services[0][matchFound].name);
                     $("."+services[0][matchFound].name.toLowerCase().replace(" ", "")).addClass("active");
                     }else{
                     alert("No Category found.");
                     }
                     });
    request1.fail(function(jqXHR, textStatus) {
                  console.log(textStatus);
                  });
}

function getCustomerAPICall(lat, lng, miles, min){
    miles = Number(miles);
    min = Number(min);
    $('body').addClass('bodyload');
    var request1 = $.ajax({
                          url: servurl + "endpoint/api/getmycustomers",
                          type: "POST",
                          beforeSend: function (xhr) {
                          xhr.setRequestHeader ("Authorization", "Basic " + btoa(w30Credentials));
                          },
                          data: JSON.stringify({"serviceId":serviceId,"latitude":lat, "longitude":lng,"miles": miles,"minutes":min, "userId":userid}),
                          contentType: "application/json; charset=UTF-8"
                          });
    
    request1.success(function(result) {
                     if(result.Status == "Ok"){
                     milesValue = 30;
                     if(country == "India")
                        milesValue = 18.6;
                     minutesValue = 30;
                     loadMap(result.Data);
                     }else if(result.Message == "No customers available"){
                     /*$(".popContent h2").text("Get Customers Response");
                      $(".popContent strong").text("No Customers in your Range. Redirecting to nearest location.");
                      $(".pop_up").show();
                      if(!locationRedirect){
                      latitude = Number(result.latitude);
                      longitude = Number(result.longitude);
                      errorFunction(null);
                      locationRedirect = true;
                      }else{
                      $(".popContent h2").text("Get Customers Response");
                      $(".popContent strong").text("There seem to be no businesses in this category currently.");
                      $(".pop_up").show();
                      loadMap([]);
                      }*/
                     $(".popContent h2").text("Retrieving Businesses");
                     $(".popContent strong").text("There seem to be no businesses in your range currently");
                     $(".popContent span").text("");
                     $(".pop_up").show();
                     loadMap([]);
                     }else if(result.Message == "NoAccess"){
                     $(".popContent h2").text("Retrieving Businesses");
                     $(".popContent strong").text("There seem to be no access to this service");
                     $(".popContent span").text("");
                     $(".pop_up").show();
                     loadMap([]);
                     }else if(result.Message == "Distance matrix error"){
                     $(".popContent h2").text("Retrieving Businesses");
                     $(".popContent strong").text("There seem to be some problem. Please try again");
                     $(".popContent span").text("");
                     $(".pop_up").show();
                     loadMap([]);
                     }
                     $('body').removeClass('bodyload');
                     });
    request1.fail(function(jqXHR, textStatus) {
                  $('body').removeClass('bodyload');
                  $(".popContent h2").text("Retrieving Businesses");
                  $(".popContent strong").text("Your request didn't go through. Please try again");
                  $(".popContent span").text("");
                  $(".pop_up").show();
                  });
}
var successFunction = function(){
    milesValue = 60;
    minutesValue = 60;
    getServices();
    getCustomerAPICall(latitude, longitude, milesValue, minutesValue);
}
var errorFunction = function(){
    $(".popContent h2").text("Status");
    $(".popContent strong").text("Not able to retrieve your location. Please check your location settings.");
    $(".popContent span").text("");
    $(".pop_up").show();
}
var getRealDistance = function(custLat, custLong, index){
	    var data = {
	        latitude: latitude,
	        longitude: longitude,
	        custLat: custLat,
	        custLong: custLong
	    };
	    var request1 = $.ajax({
	 		url: servurl + "endpoint/getRoadDistance",
			type: "POST",
			
            beforeSend: function (xhr) {
            	xhr.setRequestHeader ("Authorization", "Basic " + btoa(w30Credentials));
            },
            data: JSON.stringify(data),
            contentType: "application/json; charset=UTF-8"
        });

        request1.success(function(result) {
        	if(result.Status == "Success"){
        	    $(".milesVal").text((country == "India" ? ((result.Data*1.60934).toFixed(2)+' KMs') : result.Data.toFixed(2)+' Miles'));
	     	    customers[index].destinationDistance = result.Data;
        	    customers[index].roadDistance = true;
        	}
        });
        request1.fail(function(jqXHR, textStatus) {
        	console.log(jqXHR);
        });
	}
var loadMap = function(docs){
    subDomains = [];
    customers = docs;
    mapProp = {
    center:new google.maps.LatLng(latitude,longitude),
    zoom:12,
    mapTypeId:google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true
    };
    map = new google.maps.Map(document.getElementById("map"), mapProp);
    directionsDisplay.setMap(map);
    userMarker = new SlidingMarker({
                                   position: {lat: latitude, lng: longitude},
                                   map: map,
                                   title: "Your Location",
                                   icon: localImagePath+"userLocationMarker.png",
                                   duration: 2000
                                   });
    /*userMarker = new google.maps.Marker({
     position: {lat: latitude, lng: longitude},
     map: map,
     title: "Your Location",
     icon: localImagePath+"userLocationMarker.png"
     });*/
    for(var i = 0; i < docs.length; i++){
        var myLatLng = {lat: docs[i].geo.coordinates[1], lng: docs[i].geo.coordinates[0]}
        var icon;
        sliderTime = moment().tz(abbrs[docs[i].timeZone]).add(minutesValue, "minutes").format("HH:mm");
        itemFound = jQuery.inArray( docs[i].subdomain, bookedSlotSubdomain );
        if(docs[i].subdomain == ""){
		icon = "newRegMarker2";
	}else if(docs[i].slotBookedAt && docs[i].slotBookedAt.length){
            if(docs[i].premium)
                icon = "premiumCheckedInMarker2";
            else
                icon = "checkedInMarker2";
        }else if(itemFound != -1){
            if(docs[i].premium)
                icon = "premiumCheckedInMarker2";
            else
                icon = "checkedInMarker2";
        }else if(docs[i].nextSlotDate == "" || docs[i].nextSlotAt == "No Slots" || moment().tz(abbrs[docs[i].timeZone]).format("YYYY-MM-DD") != docs[i].nextSlotDate || docs[i].nextSlotAt > sliderTime){
            if(docs[i].premium)
                icon = "premiumRedMarker2";
            else
                icon = "redMarker2";
        }else {
            if(docs[i].premium)
                icon = "premiumGreenMarker2";
            else
                icon = "greenMarker2";
        }
        if(icon.length == 0)
                icon = "redMarker2";
        var marker = new google.maps.Marker({
                                            position: myLatLng,
                                            map: map,
                                            title: docs[i].fullName,
                                            icon: localImagePath+""+icon+".png"
                                            });
        var itemFound = jQuery.inArray( docs[i].subdomain, bookedSlotSubdomain );
        if(docs[i].destinationDistance > milesValue){
            if(docs[i].slotBookedAt && docs[i].slotBookedAt.length || itemFound != -1)
                marker.setVisible(true);
            else
                marker.setVisible(false);
        }
        var subdomain = docs[i].subdomain;
        markers.push(marker);
        subDomains.push(subdomain);
        google.maps.event.addListener(marker, 'click', (function(marker, subdomain, i) {
          return function() {
            calling = "false";
            website = "false";
            websiteDomain = "";
            if($(".menu").hasClass("fa-times")){
              $(".menu").removeClass('fa-times');
              $(".menu").addClass('fa-bars');
              $('.mynav').fadeOut();
            }
            currentMarker = i;
            if(oldMarker >= 0){
              var markerIcon = markers[oldMarker].icon;
              markers[oldMarker].setIcon(markerIcon.substring(0, markerIcon.length-5)+"2.png");
            }
            oldMarker = i;
            var markerIcon = marker.icon;
            marker.setIcon(markerIcon.substring(0, markerIcon.length-5)+"1.png");
            var companyAddr = "";
            if(customers[i].geo.address){
              if(customers[i].geo.address.premise){
                companyAddr += customers[i].geo.address.premise+", ";
              }
              if(customers[i].geo.address.sublocality){
                companyAddr += customers[i].geo.address.sublocality+", ";
              }
              if(customers[i].geo.address.city){
                companyAddr += customers[i].geo.address.city+", ";
              }
            }
          
            var rating = 0, ratingCount = 0;
            if(customers[i].rating)
              rating = customers[i].rating.toFixed(2);
          
            if(customers[i].ratingCount)
              ratingCount = customers[i].ratingCount;
          
            if(companyAddr){
              companyAddr = companyAddr.substring(0, companyAddr.length-2);
            }else{
              companyAddr = "Sorry Address Not Provided."
            }
            var itemFound = jQuery.inArray( customers[i].subdomain, bookedSlotSubdomain );
            $(".serviceHead h2").text(customers[i].fullName);
            $("#rateYo").rateYo({
                rating: rating,
                starWidth: "10px"
            });
            $(".rating span").text("("+ratingCount+")");
            if(country == "India")
                $(".milesVal").text((customers[i].destinationDistance*1.60934).toFixed(2)+" KMs");
            else
                $(".milesVal").text(customers[i].destinationDistance.toFixed(2)+" Miles");
            $(".companyAddr").text(companyAddr);
            //$(".website").attr("href","https://"+docs[i].subdomain+urlLink);
            if(customers[i].mobile){
                if($(".phoneCall").hasClass("disable"))
                    $(".phoneCall").removeClass("disable");
                                                        
                $(".phoneCall").on("click", function(){
                    if(!$(".phoneCall").hasClass("disable")){
                        calling = "true";
                        websiteBackButton = true;
                        w30mob.callNativeApp("calling", JSON.stringify({"phoneNumber":docs[i].mobile}), function(data){
                        });
                    }
                });
            }else{
                $(".phoneCall").addClass("disable");
            }
            if(customers[i].startHour && customers[i].endHour)
              $(".businessHours").text("Business Hours: "+customers[i].startHour+" - "+customers[i].endHour);
            else
              $(".businessHours").text("Business Hours: Not Working");
            $(".directionArrowBottom").hide();
            $(".directionArrowTop").show();
            $(".serviceSection").animate({
                  height:'115px'
            },500);
            if(customers[i].slotBookedAt){
              if(moment().tz(abbrs[customers[i].timeZone]).format("YYYY-MM-DD") != customers[i].slotBookedDate)
                $(".slotTime").text("Slot Booked For: "+moment(customers[i].slotBookedDate).format("MM/DD")+" "+customers[i].slotBookedAt);
              else
                $(".slotTime").text("Slot Booked For: "+customers[i].slotBookedAt);
              $(".btn_sch").hide();
              $(".btn_dir").hide();
              $(".btn_dirStp").hide();
              if(directionIndex == i){
                $(".btn_dirStp").show();
              }else
                $(".btn_dir").show();
              $(".btn_dir").off().on("click", function(){
                                 directionIndex = i;
                                w30mob.callNativeApp("updatelocationfetchvalue", JSON.stringify({"newValue":"false"}), function(data){
                                                          //alert(data);
                                });
                                 /*window.andapp.updateTimeInterval("1");*/
                                 //oldDirectionIndex = 0;
                                 $(".shadow").click();
                                 startDirection();
              });
            }else if(itemFound >= 0){
              if(moment().tz(abbrs[customers[i].timeZone]).format("YYYY-MM-DD") != bookedSlotDate[itemFound])
                $(".slotTime").text("Slot Booked For: "+moment(bookedSlotDate[itemFound]).format("MM/DD")+" "+bookedSlotAt[itemFound]);
              else
                $(".slotTime").text("Slot Booked For: "+bookedSlotAt[itemFound]);
              $(".btn_sch").hide();
              $(".btn_dir").hide();
              $(".btn_dirStp").hide();
              if(directionIndex == i){
                $(".btn_dirStp").show();
              }else
                $(".btn_dir").show();
                $(".btn_dir").off().on("click", function(){
                                 directionIndex = i;
                                       w30mob.callNativeApp("updatelocationfetchvalue", JSON.stringify({"newValue":"false"}), function(data){
                                                            //alert(data);
                                                            });
                                 /*window.andapp.updateTimeInterval("1");*/
                                 //oldDirectionIndex = 0;
                                 $(".shadow").click();
                                 startDirection();
                });
              }else{
                if(moment().tz(abbrs[customers[i].timeZone]).format("YYYY-MM-DD") != customers[i].nextSlotDate)
                  $(".slotTime").text("Next Slot At: "+((customers[i].nextSlotDate && customers[i].nextSlotDate.length != 0) ? moment(customers[i].nextSlotDate).format("MM/DD") : '')+" "+customers[i].nextSlotAt);
                else
                  $(".slotTime").text("Next Slot At: "+customers[i].nextSlotAt);
                if(customers[i].nextSlotDate != "" && customers[i].nextSlotAt != "No Slots")
                    $(".btn_sch").show();
                else
                    $(".btn_sch").hide();
                $(".btn_dir").hide();
                $(".btn_dirStp").hide();
                $(".btn_sch").off().on("click", function(){
                                       $("body").addClass("bodyload");
                                 bookSlot(subdomain, i, customers[i].nextSlotAt, customers[i].timeZone, customers[i].nextSlotDate);
                });
                $(".btn_dir").off().on("click", function(){
                                 directionIndex = i;
                                       w30mob.callNativeApp("updatelocationfetchvalue", JSON.stringify({"newValue":"false"}), function(data){
                                                            //alert(data);
                                                            });
                                 /*window.andapp.updateTimeInterval("1");*/
                                 oldDirectionIndex = 0;
                                 $(".shadow").click();
                                 startDirection();
                });
          }
          if(customers[i].slotBookedAt && !customers[i].slotBookedAt.length && moment().tz(abbrs[customers[i].timeZone]).format("YYYY-MM-DD HH:mm") > (customers[i].nextSlotDate+" "+customers[i].nextSlotAt)){
          getCustomerInfo(latitude, longitude, 60, 60, i, 0);
          }
          $('.shadow').show();
          if(customers[i].subdomain.length == 0){
                $(".btn_sch").hide();
                $(".btn_dir").hide();
                $(".btn_dirStp").hide();
                $(".btn_cnt").show();
                $(".slotTime").text("Next Slot At: Cannot Disclose.");
                $(".phoneCall").addClass("disable");
                $(".cntcLi").hide();
                $(".website").addClass("disable");
                $(".businessHours").text("Business Hours: Cannot Disclose.");
                $(".btn_cnt").on("click", function(){
                    notifyUser(customers[i].landing._uniqueid, customers[i].mobile, customers[i].companyEmail);
                    $(".popContent h2").text("Contact Status");
                    $(".popContent span").text("sent an email to admin user.");
                    $(".pop_up").show();
                });
            }else{
                $(".btn_cnt").hide();
                $(".website").removeClass("disable");
                $(".website").on("click", function(){
                    //$('body').addClass('bodyload');
                    w30mob.callNativeApp("saveadminstate", JSON.stringify({"adminstate":"false"}), function(data){
                         
                    });
                    w30mob.callNativeApp("saveendusersubdomain", JSON.stringify({"endusersubdomain":customers[i].subdomain}), function(data){
                    });
                                 
                    //website = "true";
                    //websiteDomain = customers[i].subdomain;
                    //websiteBackButton = true;
                    //window.andapp.savewebsiteState(website);
                    /*window.andapp.openLink("https://"+customers[i].subdomain+urlLink+"?source=AndroidSchedulePage&firstname="+firstname+"&email="+email+"&mobile="+mobilenumber+"&userid="+userid);*/
                    window.location.href = "schedulePage.html";
                });
            }
            if(customers[i].roadDistance){
		    $(".milesVal").text((country == "India" ? ((customers[i].destinationDistance*1.60934).toFixed(2)+' KMs') : customers[i].destinationDistance.toFixed(2)+' Miles'));
	     }else{
		    getRealDistance(customers[i].geo.coordinates[1], customers[i].geo.coordinates[0], i);
	      }
          }
          })(marker, subdomain, i));
    }
    
    map.addListener('click', function() {
                    $(".serviceSection").animate({height:'0'},500);
                    $('.shadow').hide();
                    if(oldMarker >= 0){
                    var markerIcon = markers[oldMarker].icon;
                    markers[oldMarker].setIcon(markerIcon.substring(0, markerIcon.length-5)+"2.png");
                    }
                    if(currentMarker >= 0){
                    var markerIcon = markers[currentMarker].icon;
                    markers[currentMarker].setIcon(markerIcon.substring(0, markerIcon.length-5)+"2.png");
                    }
                    });
    
    $(".btn_dirStp").on('click', function(){
                        directionIndex = -1;
                        w30mob.callNativeApp("updatelocationfetchvalue", JSON.stringify({"newValue":"true"}), function(data){
                                             //alert(data);
                                             });
                        /*window.andapp.updateTimeInterval("30");*/
                        directionsDisplay.setMap(null);
                        directionStop = 0;
                        $(".shadow").click();
                        });
    
    $(".shadow").on('click', function() {
                    calling = "false";
                    website = "false";
                    websiteDomain = "";
                    $(".serviceSection").animate({height:'0'},500);
                    $('.shadow').hide();
                    if(oldMarker >= 0){
                    var markerIcon = markers[oldMarker].icon;
                    markers[oldMarker].setIcon(markerIcon.substring(0, markerIcon.length-5)+"2.png");
                    }
                    if(currentMarker >= 0){
                    var markerIcon = markers[currentMarker].icon;
                    markers[currentMarker].setIcon(markerIcon.substring(0, markerIcon.length-5)+"2.png");
                    }
                    });
    changeCircle();
    
    milesValue = 30;
    if(country == "India"){
        milesValue = 18.6;
        $('.range-slider.slideMil').foundation('slider', 'set_value', (milesValue*1.60934).toFixed(0));
    }else{
        $('.range-slider.slideMil').foundation('slider', 'set_value', milesValue);
    }
    minutesValue = 30;
    $('.range-slider.slideMin').foundation('slider', 'set_value', minutesValue);
    $("body").on('DOMSubtreeModified', "span#sliderOutput2", function () {
                 if($(this).text().length != 0){
                 if($(this).text().length > 0 && !isNaN($(this).text())){
                 if($(this).text().length > 2 && $(this).text().length % 2 == 0 && minutesValue < 10){
                 minutesValue = parseInt($(this).text().substring($(this).text().length - 1 , $(this).text().length));
                 }else if($(this).text().length > 2 && $(this).text().length % 2 == 0 && minutesValue >= 10){
                 minutesValue = parseInt($(this).text().substring($(this).text().length - 2 , $(this).text().length));
                 }else if($(this).text().length > 2 && $(this).text().length % 2 == 1 && minutesValue < 10){
                 minutesValue = parseInt($(this).text().substring($(this).text().length - 2 , $(this).text().length));
                 }else if($(this).text().length > 2 && $(this).text().length % 2 == 1 && minutesValue >= 10){
                 minutesValue = parseInt($(this).text().substring($(this).text().length - 1 , $(this).text().length));
                 }else if($(this).text().length == 2 && parseInt($(this).text()) > 60){
                 minutesValue = parseInt($(this).text().substring($(this).text().length - 1 , $(this).text().length));
                 }else{
                 minutesValue = parseInt($(this).text());
                 }
                 
                 minutesSlide(minutesValue);
                 }
                 }
                 if($(this).text() == "NaN")
                 $(this).text(minutesValue);
                 });
    $("body").on('DOMSubtreeModified', "span#sliderOutput3", function () {
                 if($(this).text().length != 0){
                 if($(this).text().length > 0 && !isNaN($(this).text())){
                 if($(this).text().length > 2 && $(this).text().length % 2 == 0 && milesValue < 10){
                 milesValue = parseInt($(this).text().substring($(this).text().length - 1 , $(this).text().length));
                 }else if($(this).text().length > 2 && $(this).text().length % 2 == 0 && milesValue >= 10){
                 milesValue = parseInt($(this).text().substring($(this).text().length - 2 , $(this).text().length));
                 }else if($(this).text().length > 2 && $(this).text().length % 2 == 1 && milesValue < 10){
                 milesValue = parseInt($(this).text().substring($(this).text().length - 2 , $(this).text().length));
                 }else if($(this).text().length > 2 && $(this).text().length % 2 == 1 && milesValue >= 10){
                 milesValue = parseInt($(this).text().substring($(this).text().length - 1 , $(this).text().length));
                 }else if($(this).text().length == 2 && parseInt($(this).text()) > 60){
                 milesValue = parseInt($(this).text().substring($(this).text().length - 1 , $(this).text().length));
                 }else{
                 milesValue = parseInt($(this).text());
                 }
                 if(country == "India")
                    milesValue = (milesValue*0.621371).toFixed(0);
                 milesSlide(milesValue);
                 }
                 }
                 if($(this).text() == "NaN"){
                    if(country == "India")
                        $(this).text((milesValue*1.60934).toFixed(0));
                    else
                        $(this).text(milesValue);
                 }
                 });
    $('.gm-style-iw').parent('div').css('z-index','99999');
    if((minutesValue-4) > (milesValue*1.60934)) {
        $('.slideMin').addClass('myactive');
        $('.slideMil').removeClass('myactive');
    }else if((minutesValue-4) < (milesValue*1.60934)) {
        $('.slideMin').removeClass('myactive');
        $('.slideMil').addClass('myactive');
    }
}

function milesSlide (rad) {
    circle.setRadius(rad*1609.34);
    milesValue = rad;
    updateMilesRadius();
}

function minutesSlide (min) {
    minutesValue = min;
    updateTimeRadius(min);
}

function changeCircle(){
    circle = new google.maps.Circle({
                                    strokeColor: '#808080',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 1,
                                    fillColor: '#FFFFFF',
                                    fillOpacity: 0,
                                    map: map,
                                    center: {lat: latitude, lng: longitude},
                                    radius: 48280.3
                                    });
    circle.addListener('click', function() {
                       $(".serviceSection").animate({
                                                    height:'0'
                                                    },500);
                       $('.shadow').hide();
                       if(oldMarker >= 0){
                       var markerIcon = markers[oldMarker].icon;
                       markers[oldMarker].setIcon(markerIcon.substring(0, markerIcon.length-5)+"2.png");
                       }
                       });
    return;
    //circle.bindTo('center', markers[0], 'position');
}
function updateMilesRadius(){
    if(milesValue < 30 ){
        map.setZoom(12);
    }
    if(milesValue < 20 ){
        map.setZoom(13);
    }
    if(milesValue < 10 ){
        map.setZoom(14);
    }
    
    customers.forEach(function(item, i){
                      
                      var itemFound = jQuery.inArray( item.subdomain, bookedSlotSubdomain );
                      if( item.destinationDistance > milesValue){
                      if(item.slotBookedAt && item.slotBookedAt.length || itemFound != -1)
                      markers[i].setVisible(true);
                      else
                      markers[i].setVisible(false);
                      }else{
                      markers[i].setVisible(true);
                      }
                      });
    
    if((minutesValue-4) > (milesValue*1.60934)) {
        $('.slideMin').addClass('myactive');
        $('.slideMil').removeClass('myactive');
    }else if((minutesValue-4) < (milesValue*1.60934)) {
        $('.slideMin').removeClass('myactive');
        $('.slideMil').addClass('myactive');
    }
    return;
}

function updateTimeRadius(min){
    minutesValue = min;
    
    customers.forEach(function(item, i){
                      
                      sliderTime = moment().tz(abbrs[item.timeZone]).add(minutesValue, "minutes").format("HH:mm");
                      var icon = "";
                      itemFound = jQuery.inArray( item.subdomain, bookedSlotSubdomain );
                      if(item.subdomain == ""){
			icon = "newRegMarker2";
		      }else if(item.slotBookedAt && item.slotBookedAt.length){
                      if(item.premium)
                      icon = "premiumCheckedInMarker2";
                      else
                      icon = "checkedInMarker2";
                      }else if(itemFound != -1){
                      if(item.premium)
                      icon = "premiumCheckedInMarker2";
                      else
                      icon = "checkedInMarker2";
                      }else if(item.nextSlotDate == "" || item.nextSlotAt == "No Slots" || moment().tz(abbrs[item.timeZone]).format("YYYY-MM-DD") != item.nextSlotDate || item.nextSlotAt > sliderTime){
                      if(item.premium)
                      icon = "premiumRedMarker2";
                      else
                      icon = "redMarker2";
                      }else{
                      if(item.premium)
                      icon = "premiumGreenMarker2";
                      else
                      icon = "greenMarker2";
                      }
                      if(icon.length == 0)
                        icon = "redMarker2";
                      markers[i].setIcon(localImagePath+""+icon+".png");
                      oldMarker = -1;
                      });
    
    if((minutesValue-4) > (milesValue*1.60934)) {
        $('.slideMin').addClass('myactive');
        $('.slideMil').removeClass('myactive');
    }else if((minutesValue-4) < (milesValue*1.60934)) {
        $('.slideMin').removeClass('myactive');
        $('.slideMil').addClass('myactive');
    }
    return;
}

var calculateDifference = function(timeZone, result){
    var start = moment.tz(abbrs[timeZone]).format("YYYY-MM-DD HH:mm").toDateString();
    var end = result.Data.selecteddate+" "+result.Data.data.endTime;
    return (new Date(end).getTime() - new Date(start).getTime());
}

function bookSlot(subdomain, i, slotAt, timeZone, slotDate){
    getAppointments(function(data){
                    var pendingSlotsCount = 0;
                    data.pendingSlots.forEach(function(item, index){
                                         if(item.subdomain == subdomain){
                                         pendingSlotsCount++;
                                         }
                                         });
                    if(pendingSlotsCount != 0){
                        $(".popContent h2").text("Appointment Status");
                        $(".popContent strong").text("");
                        $(".popContent span").text("You already have a future appointment for this business. Cant book again.");
                        $(".pop_up").show();
                        reload = true;
                    }else{
                    
                    var localTime;
                    var today  = moment.tz(abbrs[timeZone]).format("YYYY-MM-DD");
                    if(slotDate != today){
                    localTime = slotDate+" "+slotAt;
                    }else{
                    localTime  = moment.tz(abbrs[timeZone]).format("HH:mm")
                    if(slotAt < localTime)
                    localTime  = moment.tz(abbrs[timeZone]).format("YYYY-MM-DD HH:mm");
                    else{
                    localTime  = moment.tz(abbrs[timeZone]).format("YYYY-MM-DD HH:mm");
                    localTime = localTime.substring(0, localTime.length-5)+""+slotAt;
                    }
                    }
                    var request1 = $.ajax({
                                          url: servurl + "endpoint/api/bookslot",
                                          type: "POST",
                                          beforeSend: function (xhr) {
                                          xhr.setRequestHeader ("Authorization", "Basic " + btoa(w30Credentials));
                                          },
                                          data: JSON.stringify({"subDomain":subdomain,"businessType": serviceName,"date":localTime,"email":email,"mobile":mobilenumber,"minutes":"30", "userId":userid, "source": "IOSMapApp"}),
                                          contentType: "application/json; charset=UTF-8"
                                          });
                    
                    request1.success(function(result) {
                                     $("body").removeClass("bodyload");
                                     if(result.Status == "Ok"){
                                     $(".popContent h2").text("Appointment Status");
                                     $(".popContent strong").text("");
                                     if(result.Data.selecteddate == moment.tz(abbrs[timeZone]).format("YYYY-MM-DD"))
                                     $(".popContent span").text("See you At "+result.startTime);
                                     else
                                     $(".popContent span").text("See you At "+moment(result.Data.selecteddate).format("MM/DD")+" "+result.startTime);
                                     $(".pop_up").show();
                                     $(".btn_sch").hide();
                                     $(".btn_dir").show();
                                     /*$(".serviceSection").animate({height:'0'},500);
                                      $('.shadow').hide();*/
                                     bookedSlotAt.push(result.startTime);
                                     bookedSlotDate.push(result.Data.selecteddate);
                                     bookedSlotSubdomain.push(result.Data.subdomain);
                                     if(customers[i].subdomain == ""){
					icon = "newRegMarker2";
				     }else if(customers[i].premium){
                                     markers[i].setIcon(localImagePath+"premiumCheckedInMarker2.png");
                                     }else{
                                     markers[i].setIcon(localImagePath+"checkedInMarker2.png");
                                     }
                                     socketio.emit("newAppointment", result.Data);
                                     var timeout = calculateDifference(timeZone, result);
                                     var index = bookedSlotAt.length-1;
                                     bookedBusiness = index;
                                     setTimeout(function(){
                                                bookedSlotAt.splice(index, 1);
                                                bookedSlotDate.splice(index, 1);
                                                bookedSlotSubdomain.splice(index, 1);
                                                var icon = "";
                                                sliderTime = moment().tz(abbrs[customers[i].timeZone]).add(minutesValue, "minutes").format("HH:mm");
                                                if(customers[i].nextSlotDate == "" || customers[i].nextSlotAt == "No Slots" || moment().tz(abbrs[customers[i].timeZone]).format("YYYY-MM-DD") != customers[i].nextSlotDate || customers[i].nextSlotAt > sliderTime){
                                                if(customers[i].premium)
                                                icon = "premiumRedMarker2";
                                                else
                                                icon = "redMarker2";
                                                }else {
                                                if(customers[i].premium)
                                                icon = "premiumGreenMarker2";
                                                else
                                                icon = "greenMarker2";
                                                }
                                                
                                                markers[i].setIcon(localImagePath+icon+".png");
                                                
                                                }, timeout, index, i);
                                     }else{
                                     $(".popContent h2").text("Appointment Status");
                                     $(".popContent strong").text("");
                                     $(".popContent span").text(result.Message);
                                     $(".pop_up").show();
                                     }
                                     });
                    request1.fail(function(jqXHR, textStatus) {
                                  $("body").removeClass("bodyload");
                                  $(".popContent h2").text("Appointment Status");
                                  $(".popContent strong").text("");
                                  $(".popContent span").text("Your request didn't go through. Please try again");
                                  $(".pop_up").show();
                                  });
                    }
                    });
    $("body").removeClass("bodyload");
}
$(".popContent").on("click", function(e){
                    e.stopPropagation();
                    });
$(".pop_up, .closePop").on("click", function(){
                           $(".pop_up").hide();
                           if(reload)
                            location.reload();
                           });

$(".imgContainer").on("click", function(){
                      $(".imgContainer").hide();
                      $(".container").show();
                      init();
                      });

$(".help").on("click", function(){
              $(".imgContainer").show();
              $(".container").hide();
              });

$(".viewAppointments").on("click", function(){
              window.location.href = "appointments.html";
});

$(".locateMe").on("click", function(){
                  map.setCenter({lat:latitude, lng:longitude});
                  });

$(".menuList4, .menuList2, .menuList3, .menuList5, .menuList6, .menuList7, .menuList8").on("click", function(){
                                                                               var matchFound = -1;
                                                                               var className = $(this).attr('class').split(" ")[1];
                                                                               services[0].forEach(function(item, index){
                                                                                                   if(item.name.replace(" ", "").toLowerCase() == className){
                                                                                                   matchFound = index;
                                                                                                   }
                                                                                                   });
                                                                               if(matchFound != -1){
                                                                               w30mob.callNativeApp("saveserviceid", JSON.stringify({"serviceId":services[0][matchFound]._id}), function(data){
                                                                                                    //alert(data);
                                                                                                    });
                                                                               
                                                                               location.reload();
                                                                               }else{
                                                                               alert("No Category found.");
                                                                               }
                                                                               });

function startDirection(){
    if(directionStop == 0){
        directionsDisplay.setMap(map);
        directionStop = 1;
    }
    var end = new google.maps.LatLng(customers[directionIndex].geo.coordinates[1], customers[directionIndex].geo.coordinates[0]);
    var start = new google.maps.LatLng(latitude, longitude);
    var bounds = new google.maps.LatLngBounds();
    directionService.route({
                           origin: start,
                           destination: end,
                           travelMode: google.maps.DirectionsTravelMode.DRIVING
                           }, function(result, status) {
                           if (status == google.maps.DirectionsStatus.OK) {
                           directionsDisplay.setDirections(result);
                           } else{
                           $(".popContent h2").text("Direction Services");
                           $(".popContent strong").text("There seem to be some problem with internet connection.");
                           $(".popContent span").text("");
                           $(".pop_up").show();
                           }
                           });
}

function getCustomerInfo(lat, lng, miles, min, index, timeline, callback){
    miles = Number(miles);
    min = Number(min);
    var request1 = $.ajax({
                          url: servurl + "endpoint/api/getcustomerinfo",
                          type: "POST",
                          beforeSend: function (xhr) {
                          xhr.setRequestHeader ("Authorization", "Basic " + btoa(w30Credentials));
                          },
                          data: JSON.stringify({"serviceId":serviceId,"latitude":lat, "longitude":lng,"miles": miles,"minutes":min, "userId":userid, "subdomain":subDomains[index], "timeline": timeline}),
                          contentType: "application/json; charset=UTF-8"
                          });
    request1.success(function(result) {
                     customers[index].nextSlotDate = result.Data[0].nextSlotDate;
                     customers[index].nextSlotAt = result.Data[0].nextSlotAt;
                     if(callback){
                     callback(result);
                     }else{
                     var itemFound = jQuery.inArray( subDomains[index], bookedSlotSubdomain );
                     if(customers[index].subdomain == ""){
			icon = "newRegMarker2";
		     }else if(customers[index].slotBookedAt && customers[index].slotBookedAt.length){
                     if(customers[index].premium)
                     icon = "premiumCheckedInMarker2";
                     else
                     icon = "checkedInMarker2";
                     }else if(itemFound != -1){
                     if(customers[index].premium)
                     icon = "premiumCheckedInMarker2";
                     else
                     icon = "checkedInMarker2";
                     }else if(customers[index].nextSlotDate == "" || customers[index].nextSlotAt == "No Slots" || moment().tz(abbrs[customers[index].timeZone]).format("YYYY-MM-DD") != customers[index].nextSlotDate || customers[index].nextSlotAt > sliderTime){
                     if(customers[index].premium)
                     icon = "premiumRedMarker2";
                     else
                     icon = "redMarker2";
                     }else {
                     if(customers[index].premium)
                     icon = "premiumGreenMarker2";
                     else
                     icon = "greenMarker2";
                     }
                     
                     markers[index].setIcon(localImagePath+""+icon+".png");
                     if(oldMarker == index && $(".serviceSection").height() > 0){
                     itemFound = jQuery.inArray( subDomains[index], bookedSlotSubdomain );
                     if(itemFound < 0 && moment().tz(abbrs[customers[index].timeZone]).format("YYYY-MM-DD") != customers[index].nextSlotDate){
                     $(".slotTime").text("Next Slot At: "+((customers[index].nextSlotDate && customers[index].nextSlotDate.length != 0 ) ? moment(customers[index].nextSlotDate).format("MM/DD") : '')+" "+customers[index].nextSlotAt);
                     }else if(itemFound < 0 && customers[index].nextSlotAt){
                     $(".slotTime").text("Next Slot At: "+customers[index].nextSlotAt);
                     }
                     markers[index].setIcon(markers[index].icon.substring(0, markers[index].icon.length-5)+"1.png");
                     }
                     }
                     });
    request1.fail(function(jqXHR, textStatus) {
                  //console.log(textStatus);
                  });
}
$(document).foundation().foundation('joyride', 'start');
var getDetails = function(){
    w30mob.callNativeApp("getemail", null, function(em){
        email = em;
        w30mob.callNativeApp("getmobile", null, function(mobile){
            mobilenumber = mobile;
            w30mob.callNativeApp("getuserid", null, function(id){
                userid = id;
                w30mob.callNativeApp("getserviceid", null, function(servId){
                    serviceId = servId;
                    w30mob.callNativeApp("getfirstname", null, function(fn){
                        firstname = fn;
                        w30mob.callNativeApp("getcountryname", null, function(cn){
                            country = cn;
                            if(!latitude && !longitude){
                                errorFunction();
                            }else{
                                successFunction();
                            }
                        });
                    });
                });
            });
        });
    });
}
var init = function(){
    
    w30mob.callNativeApp("getoverlaystate", null, function(state){
        if(state == "false"){
            $(".imgContainer").show();
            $(".container").hide();
            w30mob.callNativeApp("saveoverlaystate", JSON.stringify({"overlayState":"true"}), function(data){
                //alert(data);
            });
        }else{
            w30mob.callNativeApp("getlocationtype", null, function(type){
                if(type == "true" ){
                    w30mob.callNativeApp("getlatitude", null, function(lat){
                        latitude = Number(lat);
                        w30mob.callNativeApp("getlongitude", null, function(lng){
                            longitude = Number(lng);
                            getDetails();
                        });
                    });
                    w30mob.callNativeApp("getcountryname", null, function(cn){
                        country = cn;
                        if(country == "India" || country == "India#" || country.toLowerCase().indexOf("india") > -1){
                            $("#sliderOutput3").addClass("active");
                            $(".menuList6").show();
                            $(".menuList8").hide();
                        }else {
                            $(".menuList8").show();
                            $(".menuList6").hide();
                        }
                    });
                }else{
                    w30mob.callNativeApp("getcustomelat", null, function(lat){
                        latitude = Number(lat);
                        w30mob.callNativeApp("getcustomelong", null, function(lng){
                            longitude = Number(lng);
                            getDetails();
                        });
                    });
                    w30mob.callNativeApp("getrecentlocation", null, function(data){
                            
                        if(data == "India" || data == "India#" || data.toLowerCase().indexOf("india") > -1){
                            $("#sliderOutput3").addClass("active");
                            $(".menuList6").css("display","block");
                            $(".menuList8").css("display","none");
                        }else {
                            $(".menuList8").show();
                            $(".menuList6").hide();
                        }
                    });
                }
            });
        }
    });
}
init();

var getAppointments = function(callback){
    if(userid){
        var request1 = $.ajax({
                              url: servurl + "endpoint/api/getappointmentList",
                              type: "POST",
                              beforeSend: function (xhr) {
                              xhr.setRequestHeader ("Authorization", "Basic " + btoa(w30Credentials));
                              },
                              data: JSON.stringify({"userId":userid, "latitude": latitude, "longitude": longitude, "currentTime": moment().format("YYYY-MM-DD HH:mm")}),
                              contentType: "application/json; charset=UTF-8"
                              });
        request1.success(function(result) {
                         if(result.Status == "Ok"){
                         callback(result);
                         }else{
                         $(".popContent h2").text("Get Appointment Status");
                         $(".popContent strong").text("");
                         $(".popContent span").text("Something went wrong. Try again");
                         $(".pop_up").show();
                         }
                         });
        request1.fail(function(jqXHR, textStatus) {
                      $(".popContent h2").text("Get Appointment Status");
                      $(".popContent strong").text("");
                      $(".popContent span").text("Your request didn't go through. Please try again");
                      $(".pop_up").show();
                      });
    }else{
        alert("Something went wrong. Try again");
    }
}

function goBack(){
    window.history.back();
    if(websiteBackButton)
        window.history.back();
}

function locationChange(newLat, newLong){
    w30mob.callNativeApp("getlocationtype", null, function(type){
        if(type == "true" ){
            if(newLat != null && newLong != null && (latitude != newLat || longitude != newLong)){
                latitude = newLat;
                longitude = newLong;
                if(userMarker){
                    setTimeout(function() {
                        var newPosition = {lat: latitude, lng: longitude}
                        userMarker.setPosition(newPosition)
                    }, 1000);
                    if(directionIndex > -1)
                        startDirection();
                }
            }
        }
    });
}

var refreshOnForeground = function(){
    $("body").removeClass("bodyload");
    if(calling == "false"){
        location.reload();
    }
}

socketio.on('connect', function () {
            socketio.emit('room', "home");
            
            socketio.on('newAppointment', function(message) {
                        var index = jQuery.inArray( message.subdomain, subDomains );
                        if( index >= 0 && customers[index].nextSlotDate == message.selecteddate){
                        getCustomerInfo(latitude, longitude, 60, 60, index, 0);
                        }
                        });
            
            socketio.on('updateAppointment', function(message) {
                        var index = jQuery.inArray( message.subdomain, subDomains );
                        if( index >= 0 ){
                        getCustomerInfo(latitude, longitude, 60, 60, index, 0);
                        }
                        });
            
            socketio.on('deleteAppointment', function(message) {
                        var index = jQuery.inArray( message.room, subDomains );
                        if( index >= 0 ){
                        getCustomerInfo(latitude, longitude, 60, 60, index, 0);
                        }
                        });
            
            });









/*jquery easing file code*/

/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 *
 * Open source under the BSD License.
 *
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
              {
              def: 'easeOutQuad',
              swing: function (x, t, b, c, d) {
              //alert(jQuery.easing.default);
              return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
              },
              easeInQuad: function (x, t, b, c, d) {
              return c*(t/=d)*t + b;
              },
              easeOutQuad: function (x, t, b, c, d) {
              return -c *(t/=d)*(t-2) + b;
              },
              easeInOutQuad: function (x, t, b, c, d) {
              if ((t/=d/2) < 1) return c/2*t*t + b;
              return -c/2 * ((--t)*(t-2) - 1) + b;
              },
              easeInCubic: function (x, t, b, c, d) {
              return c*(t/=d)*t*t + b;
              },
              easeOutCubic: function (x, t, b, c, d) {
              return c*((t=t/d-1)*t*t + 1) + b;
              },
              easeInOutCubic: function (x, t, b, c, d) {
              if ((t/=d/2) < 1) return c/2*t*t*t + b;
              return c/2*((t-=2)*t*t + 2) + b;
              },
              easeInQuart: function (x, t, b, c, d) {
              return c*(t/=d)*t*t*t + b;
              },
              easeOutQuart: function (x, t, b, c, d) {
              return -c * ((t=t/d-1)*t*t*t - 1) + b;
              },
              easeInOutQuart: function (x, t, b, c, d) {
              if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
              return -c/2 * ((t-=2)*t*t*t - 2) + b;
              },
              easeInQuint: function (x, t, b, c, d) {
              return c*(t/=d)*t*t*t*t + b;
              },
              easeOutQuint: function (x, t, b, c, d) {
              return c*((t=t/d-1)*t*t*t*t + 1) + b;
              },
              easeInOutQuint: function (x, t, b, c, d) {
              if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
              return c/2*((t-=2)*t*t*t*t + 2) + b;
              },
              easeInSine: function (x, t, b, c, d) {
              return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
              },
              easeOutSine: function (x, t, b, c, d) {
              return c * Math.sin(t/d * (Math.PI/2)) + b;
              },
              easeInOutSine: function (x, t, b, c, d) {
              return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
              },
              easeInExpo: function (x, t, b, c, d) {
              return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
              },
              easeOutExpo: function (x, t, b, c, d) {
              return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
              },
              easeInOutExpo: function (x, t, b, c, d) {
              if (t==0) return b;
              if (t==d) return b+c;
              if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
              return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
              },
              easeInCirc: function (x, t, b, c, d) {
              return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
              },
              easeOutCirc: function (x, t, b, c, d) {
              return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
              },
              easeInOutCirc: function (x, t, b, c, d) {
              if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
              return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
              },
              easeInElastic: function (x, t, b, c, d) {
              var s=1.70158;var p=0;var a=c;
              if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
              if (a < Math.abs(c)) { a=c; var s=p/4; }
              else var s = p/(2*Math.PI) * Math.asin (c/a);
              return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
              },
              easeOutElastic: function (x, t, b, c, d) {
              var s=1.70158;var p=0;var a=c;
              if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
              if (a < Math.abs(c)) { a=c; var s=p/4; }
              else var s = p/(2*Math.PI) * Math.asin (c/a);
              return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
              },
              easeInOutElastic: function (x, t, b, c, d) {
              var s=1.70158;var p=0;var a=c;
              if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
              if (a < Math.abs(c)) { a=c; var s=p/4; }
              else var s = p/(2*Math.PI) * Math.asin (c/a);
              if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
              return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
              },
              easeInBack: function (x, t, b, c, d, s) {
              if (s == undefined) s = 1.70158;
              return c*(t/=d)*t*((s+1)*t - s) + b;
              },
              easeOutBack: function (x, t, b, c, d, s) {
              if (s == undefined) s = 1.70158;
              return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
              },
              easeInOutBack: function (x, t, b, c, d, s) {
              if (s == undefined) s = 1.70158;
              if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
              return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
              },
              easeInBounce: function (x, t, b, c, d) {
              return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
              },
              easeOutBounce: function (x, t, b, c, d) {
              if ((t/=d) < (1/2.75)) {
              return c*(7.5625*t*t) + b;
              } else if (t < (2/2.75)) {
              return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
              } else if (t < (2.5/2.75)) {
              return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
              } else {
              return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
              }
              },
              easeInOutBounce: function (x, t, b, c, d) {
              if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
              return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
              }
              });

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 *
 * Open source under the BSD License.
 *
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */
