$(function() {
	/*
	 * Initialisation de la Map
	 */

	$.fn.googleMap = function(params) {
		params = $.extend( {
			zoom: 10,
			coords: [48.895651, 2.290569],
			type: "ROADMAP"
		}, params);
		
		// Vérification du type de la carte
		switch(params.type) {
			case 'ROADMAP':
			case 'SATELLITE':
			case 'HYBRID':
			case 'TERRAIN':
				params.type = google.maps.MapTypeId[params.type];
				break;
			default:
				params.type = google.maps.MapTypeId.ROADMAP;
				break;
		}
		
		// Vérification des coordonnées du centre de la carte

		this.each(function() {
						
			var map = new google.maps.Map(this, {
				zoom: params.zoom,
		        center: new google.maps.LatLng(params.coords[0], params.coords[1]),
		        mapTypeId: params.type
			});
			
			$(this).data('googleMap',    map);
			$(this).data('googleMarker', new Array());
			$(this).data('googleBound',  new google.maps.LatLngBounds());
		});
        
        return this;
    }
    
    /*
     * Ajouter un point
     */
    $.fn.addMarker = function(params) {
		params = $.extend( {
			coords  : false,
			adress  : false,
			url     : false,
			id      : false,
			title   : "",
			text    : ""
		}, params);
		
		this.each(function() {
        	if(!$(this).data('googleMap')) {
	        	console.log("jQuery googleMap : Unable to add a marker where there is no map !");
	        	return false;
        	}
        	
        	if(!params.coords && !params.adress) {
	        	console.log("jQuery googleMap : Unable to add a marker if you don't tell us where !");
	        	return false;
        	}
        	
        	if(params.adress && typeof params.adress == "string") {
	        	geocoder = new google.maps.Geocoder();
	        	
			    geocoder.geocode({
			    	address  : params.adress,
			    	bounds   : $(this).data('googleBound'),
			    	language : 'french'
			    }, function(results, status) {
			        if (status == google.maps.GeocoderStatus.OK) {
			        
			        	$(this).data('googleBound').extend(results[0].geometry.location);
			
			            var marker = new google.maps.Marker({
			                map: $(this).data('googleMap'),
			                position: results[0].geometry.location
			            });
			            
			            if(params.title != "" && params.text != "" && !params.url) {
				            var infowindow = new google.maps.InfoWindow({
					            content: "<h1>"+params.title+"</h1>"+params.text
					        });
					        
					        var map = $(this).data('googleMap');
					        google.maps.event.addListener(marker, 'click', function() {
						        infowindow.open(map, marker);
					        });
			            } else if(params.url) {
				            google.maps.event.addListener(marker, 'click', function() {
				                document.location = params.url;
				            });
			            }
			            
			            if(!params.id) {
			           		$(this).data('googleMarker').push(marker);
			            } else {
				            $(this).data('googleMarker')[params.id] = marker;
			            }
			            
			            $(this).data('googleMap').fitBounds($(this).data('googleBound'));
			
			        } else {
			            console.log("jQuery googleMap : Unable to find the place asked for the marker ("+status+")");
			        }
			    });
        	} else {
        	
        		$(this).data('googleBound').extend(new google.maps.LatLng(params.coords[0], params.coords[1]));
        		
	        	var marker = new google.maps.Marker({
	                map: $(this).data('googleMap'),
	                position: new google.maps.LatLng(params.coords[0], params.coords[1]),
	                title: params.title
	            });
	            
	            if(params.title != "" && params.text != "" && !params.url) {
		            var infowindow = new google.maps.InfoWindow({
			            content: "<h1>"+params.title+"</h1>"+params.text
			        });
			        
			        var map = $(this).data('googleMap');
			        google.maps.event.addListener(marker, 'click', function() {
				        infowindow.open(map, marker);
			        });
	            } else if(params.url) {
		            google.maps.event.addListener(marker, 'click', function() {
		                document.location = params.url;
		            });
	            }
	            
	            if(!params.id) {
	           		$(this).data('googleMarker').push(marker);
	            } else {
		            $(this).data('googleMarker')[params.id] = marker;
	            }

	            if($(this).data('googleMarker').length == 1) {
		            $(this).data('googleMap').setCenter(new google.maps.LatLng(params.coords[0], params.coords[1]));
		            $(this).data('googleMap').setZoom(9);
	            } else {
		        	$(this).data('googleMap').fitBounds($(this).data('googleBound'));
	            }
        	}
        });
        
        return this;
	}
	
	/*
	 * Générer un itinéraire
	 */
	$.fn.addWay = function(params) {
		params = $.extend( {
			start   : false,
			end     : false,
			route   : false,
			langage : 'french'
		}, params);
		
		var direction = new google.maps.DirectionsService({
            region: "fr"
        });
        
        var way       = new google.maps.DirectionsRenderer({
            draggable: true,
            map:       $(this).data('googleMap'),
            panel:     document.getElementById(params.route),
            provideTripAlternatives: true
        });
		
		if(typeof params.end != "object") {
			geocoder = new google.maps.Geocoder();
		    geocoder.geocode({
		    	address  : params.end,
		    	bounds   : $(this).data('googleBound'),
		    	language : params.langage
		    }, function(results, status) {
		        if (status == google.maps.GeocoderStatus.OK) {
		        
		        	var request = {
			            origin: params.start,
			            destination: results[0].geometry.location,
			            travelMode: google.maps.DirectionsTravelMode.DRIVING,
			            region: "fr"
			        };
			
			        direction.route(request, function(response, status) {
			            if (status == google.maps.DirectionsStatus.OK) {
			                way.setDirections(response);
			            } else {
			                alert("Aucune adresse ou itinéraire n'a été trouvé.");
			            }
			        });
		
		        } else {
		            console.log("jQuery googleMap : Unable to find the place asked for the route ("+status+")");
		        }
		    });
		} else {
			var request = {
	            origin: params.start,
	            destination: new google.maps.LatLng(params.end[0], params.end[1]),
	            travelMode: google.maps.DirectionsTravelMode.DRIVING,
	            region: "fr"
	        };
	
	        direction.route(request, function(response, status) {
	            if (status == google.maps.DirectionsStatus.OK) {
	                way.setDirections(response);
	            } else {
	                alert("Aucune adresse ou itinéraire n'a été trouvé.");
	            }
	        });
		}
		
		return this;
	}
});