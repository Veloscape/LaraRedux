var index = 0;
var activeMarkerId = 0;
var formEntity;
var dragIndex = -1;

var mactive = {
    url: '/img/markers/marker-measle.png',
    size: new google.maps.Size(28, 53),
    origin: new google.maps.Point(0,0),
    anchor: new google.maps.Point(14,47)
};

var mpip = {
    url: '/img/markers/measle.png',
    size: new google.maps.Size(12,12),
    origin: new google.maps.Point(0,0),
    anchor: new google.maps.Point(6,6)
};

function mapClick(location) {
    /** hide search tab if open **/
    if ($(".side-search").css("display") != "none") {
        dismissSearchPane();
    }
    inactivateOldMarker();      /** set old marker (if any) icon to measle **/
    activeMarkerId = index;     /** set activeMarkerId to new index **/
    
    addFormData(formEntity, location);        /** add form entity for new marker **/
    this.addMarker(location);       /** add new marker to map at location **/
    this.modifyAddress(location.lat() + ", " + location.lng());     /** assign placeholder address **/

    /* if path is empty then remove info page */
    var path = poly.getPath();
    if (path.getLength() == 0) {
        $(".body-container").removeClass("info");
        $(".side-info").fadeOut();
    }
    path.push(location);
    
    index++;        /** lastly update index for new entries **/
}


function addMarker(location) {
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        draggable: true,
        markerId: index,
        icon: mactive 
    });
    
    nodes.push(marker);         /** add new marker to list of markers for ref **/

    google.maps.event.addListener(marker, 'click', function(event) {
        setActiveMarker(this.markerId);
        changeFormFocus(this.markerId);
    });
    google.maps.event.addListener(marker, 'dragstart', function(event) {
        setActiveMarker(this.markerId);
        dragIndex = getMarkerIndex(this.markerId);
    });
    google.maps.event.addListener(marker, 'drag', function(event) {
        poly.getPath().setAt(dragIndex, event.latLng);
    });
    google.maps.event.addListener(marker, 'dragend', function(event) {
        poly.getPath().setAt(dragIndex, event.latLng);
        changeMarkerGeo(this.markerId, event.latLng);
        dragIndex = -1;
    });

}

function getMarkerIndex(id) {
    for (i = 0; i < nodes.length; i++) {
        if(nodes[i].markerId == id) {
            return i;
        }
    }
    return i;
}

function deleteNode(id) {
    var i;
    for (i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.markerId == id) {
            node.setMap(null);                  /** remove marker from map **/
            nodes.splice(i,1);                  /** remove marker from array **/
            $("#"+node.markerId).remove();      /** delete form entity **/
            poly.getPath().removeAt(i);
            return;
        }
    }
    
}

/** returns 0 if no next node found, returns 1 if successful **/
function nextNode() {
    var id = activeMarkerId;
    var node;
    for (i = 0; i < nodes.length;) {
        node = nodes[i];
        i++;
        if (node.markerId == id && i != nodes.length) {
            node = nodes[i];
            setActiveMarker(node.markerId);
            break;
        }
    }
    changeFormFocus(node.markerId);
    panMap(node.position);
    if (id == node.markerId) {
        return 0;
    }
    else return 1;
}

/** return 0 if no prev, return 1 if prev was found **/
function prevNode() {
    var id = activeMarkerId;
    var prev = nodes[0];
    for (i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.markerId == id) {
            break;
        }
        prev = nodes[i];
    }
    setActiveMarker(prev.markerId);
    changeFormFocus(prev.markerId);
    panMap(prev.position);
    if (prev.markerId == id) {
        return 0;
    }
    else return 1;
}

function inactivateOldMarker() {
    var oldMarker = getMarker(activeMarkerId);
    if (oldMarker != null) {
        oldMarker.setIcon(mpip);
    }
}

function setActiveMarker(id) {
    inactivateOldMarker();
    var newMarker = getMarker(id);
    newMarker.setIcon(mactive);
    activeMarkerId = id;
}

function getMarker(id) {
    for (i = 0; i < nodes.length; i++) {
        if (nodes[i].markerId == id) {
            return nodes[i];
        }
    }
    return null;
}

function search(place) {
    var location;
    if (place.geometry != null) {
        location = place.geometry.location;
        /** this code will add a marker at location of search address**/
        mapClick(location);
        
        /** this moves the map to the searched locaton **/
        panMap(location);
    }
    else {
        searchAddress(place.name);
    }
}

function panMap(location) {
    var zoom = map.getZoom();
    if (zoom < 16) {
        map.setZoom(17);
    }
    map.panTo(location);
    map.panBy(240,0);

}

function searchAddress(address) {
    console.log("searchaddress: " + address);
    geocoder.geocode( {"address" : address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            /** this code will add a marker at location of search address**/
            mapClick(results[0].geometry.location);
            /** this moves the map to the searched locaton **/
            panMap(results[0].geometry.location);
        }
        else {
            console.log('Geocode was not successfull: ' + status);
        }
    });
}


function changeMarkerGeo(id, location) {
    $("#"+id).find(".lat").val(location.lat());
    $("#"+id).find(".lng").val(location.lng());
    getFormattedAddress(location);
    
}

function changeFormFocus(id) {
    $(".map-form-entity").hide();
    $("#"+id.toString()).show();
    modifyAddress($("#"+id.toString()).find(".revgeo").val());
}

function addFormData(template, location) {
    var data = template.replace(/blank/g, activeMarkerId);
    $(".form-content").prepend(data);                                        /** add form entity for new entry **/
    $("#blank").first().attr("id", activeMarkerId);                     /** assign marker id to new entity **/
    
    activateFormEvents();                                                  /** enable js-functions **/
    changeMarkerGeo(activeMarkerId, location);                          /** fill in form geo-code **/
    changeFormFocus(activeMarkerId);                                    /** hide other entities **/
}

function modifyAddress(address) {
    $(".marker-address").attr("title", address);
    $(".marker-address").text(address);
    $("#"+ this.activeMarkerId.toString()).find(".revgeo").val(address);
}

function getFormattedAddress(location) {
    var address;
    geocoder.geocode({'latLng': location}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                address = results[0].formatted_address;
            } else {
            address = 'No results found';
            } 
        } else {
            address = 'Geocoder failed due to: ' + status;
        }
        this.modifyAddress(address);
    });

}

/** form js effects **/
function activateFormEvents() {
    $(".map-form-entity").first().find(".btn-path").click(function() {
        var type = $(this).data("type");
        $(this).parent().find(".type").val(type);
        $(this).parent().find(".btn-path").removeClass("active");
        $(this).addClass("active");
    });
}

function dismissSubmitPane() {
    $(".side-confirm").fadeOut("slow");
    $(".map-overlay").fadeOut("slow");
    $(".body-container").removeClass("submit-active");
}

function dismissSearchPane() {
    $(".side-search").fadeOut("slow");
    $(".body-container").removeClass("search");
}

function resetMap() {
    $(".body-container").addClass("info");
    $(".side-info").fadeIn("fast");
    $(".form-content").empty();
    poly.getPath().clear();
    for (i = 0; i < nodes.length; i++) {
        nodes[i].setMap(null);
    }
    index = 0;
    nodes = [];
}

/* init */
$(document).ready(function() {
    $.ajax({
        url: formEntityUrl,
            success: function(data) {
                formEntity = data;
            }
    });

    $(".btn-submit").click(function() {
        $(".side-confirm").fadeIn("fast");
        $(".map-overlay").fadeIn("fast");
        $(".body-container").addClass("submit-active");
        dismissSearchPane();
    });

    /** SIDE HEADER FUNCTIONS **/
    $(".btn-delete").first().click(function() {
        if (nodes.length == 1) {
            resetMap();
        }
        else {
            var id = activeMarkerId;
            if (prevNode() == 0) {
                nextNode();
            }
            deleteNode(id);
        }
    });

    $(".btn-prev").first().click(function() {
        prevNode();
    });

    
    $(".btn-next").first().click(function() {
        nextNode();
    });
    /***/

    $(".dismiss-submit").click(function() {
        dismissSubmitPane();
    });

    $(".dismiss-search").click(function() {
        dismissSearchPane();
    });

    //FIX
    $(".btn-search").click(function() {
        $(".body-container").addClass("search");
        $(".side-search").fadeIn("fast");
        $("#pac-input").val('').select();
    });

    //FIX
    $("#search").click(function() {
        var address = $("#pac-input").val();
        searchAddress(address);
    });

    $(".btn-reset").click(function() {
        resetMap();
    });

    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });

});
