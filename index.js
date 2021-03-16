let map
let infoWindow
let restaurants = []
let markers = []
let visibleRestaurants = []
let panorama
// filter is true to show the title of restaurant list corresponding to the filter
let filter = false
// clickedFromClickedRestaurant is true if the form was opened from clicked restaurant panel
let clickedFromClickedRestaurant = false
// clickedButtonId is the restaurant id corresponding to the button clicked in the restaurant list
let clickedButtonId = ''
let service
// loadingList is true to show the restaurant list is being loaded
let loadingList = true

/**
 * This function adds a marker to the map and pushes it to an array.
 * @param {Object} location expects an object with a lat and lng properties, both being numbers.
 * @param {URL} iconUrl expects a URL to an icon.
 * @returns the created marker
 */
function createMarker(location, iconUrl) {
    const newMarker = new google.maps.Marker({
        position: location,
        map: map,
        icon: { url: iconUrl }
    });
    return newMarker
}

/**
 * This function remove the given markers from the map.
 * @param {Array.} markers expects an array of marker-typed objects.
 */
function removeMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

/**
 * This function creates a new Restaurant object and adds it to the restaurants array given as argument.
 * @param {Array.} restaurantsArr expects an array of Restaurant objects.
 * @param {!number} newRestaurantLat expects the latitude retrieved from the click on the map.
 * @param {!number} newRestaurantLng expects the longitude retrieved from the click on the map.
 */
function addNewRestaurant(restaurantsArr, newRestaurantLat, newRestaurantLng) {
    const newRestaurantName = document.getElementById('newRestaurantName').value
    const newRestaurantAddress = document.getElementById('newRestaurantAddress').value

    // create a new Restaurant object
    const newId = Math.floor(Math.random() * 100).toString()

    const data = {
        id: newId,
        manuallyAdded: true,
        latitude: newRestaurantLat,
        longitude: newRestaurantLng,
        name: newRestaurantName,
        address: newRestaurantAddress,
        // average rating of the restaurant
        rating: 0,
        // reviews will contain objects with a rating and a comment as properties
        reviews: []
    }

    const restaurantToAdd = new Restaurant(data)

    restaurantsArr.push(restaurantToAdd);
}

/**
 * This function empties the field of the given form.
 * @param {HTML element} form expects a reference to a form DOM element. 
 */
function resetForm(form) {
    form.reset()
}

/**
 * This function filters the restaurants of a restaurants array according to the number entered in the filter form fields.
 * @param {!number} minValue expects the max rating number retrieved from the filter form.
 * @param {!number} maxValue expects the min rating number retrieved from the filter form.
 * @param {Array.} restaurants expects an array of the restaurants currently shown on the map.
 * @param {HTML element} domErrorParagraph expects a reference to the DOM element intended for the error message.
 * @returns a new array of the filtered restaurants
 */
function filterRestaurants(minValue, maxValue, restaurants, domErrorParagraph) {
    domErrorParagraph.innerHTML = ''
    if (minValue === '') {
        minValue = 1
    }
    if (maxValue === '') {
        maxValue = 5
    }
    if (minValue > maxValue) {
        domErrorParagraph.innerHTML = 'Requête invalide. La note maximale doit être supérieure à la note minimale.'
        return []
    }
    // filter the restaurants with an average rating between minNoteValue and maxNoteValue
    newArr = restaurants.filter(item => {
        return item.rating >= minValue && item.rating <= maxValue
    })

    // set filter to true to allow the display of the appropriate title in the restaurant list
    filter = true
    return newArr
}

/**
 * This function allows you to add a rating and a comment to a restaurant from the clicked restaurant panel.
 * @param {Array.} restaurants expects an array of the restaurants currently shown on the map.
 */
async function addRatingToClickedRestaurant(restaurants, restaurantsListElt, restaurantsListHeader) {
    const addCommentBtnElt = document.getElementById('addCommentBtn')
    const restaurantId = addCommentBtnElt.getAttribute('restaurant')
    const newCommentTextElt = document.getElementById('newCommentText')
    const newRatingElt = document.getElementById('newRating')

    let matchingRestaurant
    let newRatingAverage = 0

    // convert the rating returned by the HTML into an integer
    let newRatingHtml = parseFloat(newRatingElt.value)

    for (restaurant of restaurants) {
        if (restaurantId === restaurant.id) {
            const newReview = {
                rating: newRatingHtml,
                text: newCommentTextElt.value
            }
            restaurant.reviews.push(newReview)
            matchingRestaurant = restaurant
            newRatingAverage = getAverageNumber(restaurant)
            matchingRestaurant.rating = newRatingAverage

            matchingRestaurant.user_ratings_total += 1
        }
    }

    let restaurantMarker
    const buttonLat = parseFloat(addCommentBtnElt.getAttribute('lat'))
    const buttonLng = parseFloat(addCommentBtnElt.getAttribute('lng'))

    for (marker of markers) {
        if (marker.getPosition().lat() === buttonLat && marker.getPosition().lng() === buttonLng) {
            restaurantMarker = marker
        }
    }

    setRestaurantReviews(matchingRestaurant)
    displayClickedRestaurantInfo(matchingRestaurant, restaurantMarker)
    getRestaurantsOnScreen(restaurants)
    displayRestaurants(visibleRestaurants, restaurantsListElt, restaurantsListHeader, filter)
}

/**
 * This function allows you to add a rating and a comment to a restaurant from the restaurant list
 * @param {Array.} restaurants expects an array of the restaurants currently shown on the map.
 * @param {HTML element} restaurantsListElt expects a reference to the restaurant list DOM element.
 */
async function addRatingToRestaurantFromList(restaurants, restaurantsListElt) {
    const newCommentTextElt = document.getElementById('newCommentText')
    const newRatingElt = document.getElementById('newRating')
    let newRatingHtml = parseFloat(newRatingElt.value)
    let newRatingAverage = 0

    // if the form is opened from the restaurant list
    for (restaurant of restaurants) {
        // if the button id matches with a restaurant id from the array of restaurants
        if (clickedButtonId === restaurant.id) {

            await setRestaurantReviews(restaurant)

            const newReview = {
                rating: newRatingHtml,
                text: newCommentTextElt.value
            }
            restaurant.reviews.push(newReview)
            restaurant.user_ratings_total += 1

            newRatingAverage = getAverageNumber(restaurant)
            restaurant.rating = newRatingAverage

            let restaurantMarker
            for (marker of markers) {
                if (marker.getPosition().lat() === restaurant.latitude && marker.getPosition().lng() === restaurant.longitude) {
                    restaurantMarker = marker
                }
            }

            displayClickedRestaurantInfo(restaurant, restaurantMarker)
        }
    }
    getRestaurantsOnScreen(restaurants)
    displayRestaurants(visibleRestaurants, restaurantsListElt, restaurantsListHeader, filter)
}

/**
 * This function retrieves the reviews of a restaurant using Google Place Details API.
 * @param {Object} restaurant
 */
// récupérer les reviews depuis place details et les ajouter à l'objet restaurant
async function setRestaurantReviews(restaurant) {
    if (restaurant.reviews && restaurant.reviews.length) {
        return
    }

    const API_URL = 'https://maps.googleapis.com/maps/api/place/details/json?key=' + API_KEY + '&place_id=' + restaurant.id + '&fields=review,user_ratings_total'
    const response = await fetch(API_URL)

    if (response.ok) {
        const data = await response.json()

        if (data.result && data.result.reviews) {
            restaurant.reviews = data.result.reviews
            restaurant.user_ratings_total = data.result.user_ratings_total
        } else {
            restaurant.reviews = []
            restaurant.user_ratings_total = 0
        }
    } else {
        restaurant.reviews = []
        restaurant.user_ratings_total = 0
    }
};

/**
 * This function retrieves a picture of the place corresponding to the clicked marker using the Google Street View service.
 * @param {Object} marker expect the clicked marker object.
 */
function retrieveStreetView(marker) {
    panorama = new google.maps.StreetViewPanorama(
        document.getElementById("streetView"),
        {
            position: { lat: marker.getPosition().lat(), lng: marker.getPosition().lng() }
        }
    );
}

/**
 * This function sets a position and content for an infowindow and opens it.
 * @param {Object} infoWindow expects the infowindow created that needs to be customized and displayed.
 * @param {Object} location expects an object with a lat and lng properties, both being numbers.
 * @param {string} content expects whatever is to be displayed in the infowindow. 
 * @param {Object} map is the map object on which the infowindow is to be shown. 
 */
function addInfoWindow(infoWindow, location, content, map) {
    infoWindow.setPosition(location);
    infoWindow.setContent(content);
    infoWindow.open(map);
}

/**
 * This function adds a listener on a given marker.
 * @param {Object} marker expect the clicked marker object.
 * @param {Object} infowindow expects the infowindow to open.
 * @param {Object} result expects an object from the API call results, corresponding to a restaurant.
 */
function addMarkerListener(marker, infowindow, result) {
    marker.addListener('click', async (e) => {
        infowindow.open(map, marker);

        await setRestaurantReviews(result)
        displayClickedRestaurantInfo(result, marker)
    });

    marker.addListener('mouseout', () => infowindow.close())
}
/**
 * This function allows you to retrieve the user's current location.
 */
function getCurrentLocation() {
    let currentLocation = null

    return new Promise((resolve) => {
        // Try HTML5 geolocation
        if (navigator.geolocation) {
            setTimeout(() => {
                resolve(null)
            }, 5000)

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    resolve(currentLocation)
                },
                () => {
                    return resolve(null)
                }
            );
        } else {
            // Browser doesn't support Geolocation
            resolve(null)
        }
    })
}

/**
 * This function allows you to create a map using the Google Maps API, and add markers on it.
 */
async function initMap() {
    const currentLocation = await getCurrentLocation()

    map = new google.maps.Map(document.getElementById("map"), {
        center: currentLocation ? currentLocation : DEFAULT_LOCATION,
        zoom: 15,
        draggableCursor: { url: "./images/pointer_plus.svg" },
        draggingCursor: { url: "./images/pointer_plus.svg" },
    })

    if (currentLocation) {
        // create a distinct marker for the current location
        createMarker(currentLocation, "http://maps.google.com/mapfiles/ms/icons/blue-dot.png")

        infoWindow = new google.maps.InfoWindow();
        addInfoWindow(infoWindow, currentLocation, "Vous êtes ici.", map)
    }

    map.addListener('idle', () => {
        // retrieve the map center coordinates
        const location = map.getCenter()

        // retrieve restaurants within a given radius using the Google Places API
        var request = {
            location: { lat: location.lat(), lng: location.lng() },
            radius: 1500,
            type: ['restaurant']
        }

        service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);

        function callback(results, status) {
            let restaurantsListElt = document.getElementById('restaurantsList')
            let restaurantsListHeader = document.getElementById('restaurantsListHeader')

            if (status == google.maps.places.PlacesServiceStatus.OK) {
                restaurants = []
                markers = []

                for (var i = 0; i < results.length; i++) {
                    const resultPos = { lat: results[i].geometry.location.lat(), lng: results[i].geometry.location.lng() }
                    const restaurantMarker = createMarker(resultPos, "http://maps.google.com/mapfiles/ms/icons/red-dot.png")
                    markers.push(restaurantMarker)

                    // create Restaurant objects and store them in the restaurants table
                    const data = {
                        id: results[i].place_id,
                        latitude: results[i].geometry.location.lat(),
                        longitude: results[i].geometry.location.lng(),
                        name: results[i].name,
                        address: results[i].vicinity,
                        // average rating of a restaurant
                        rating: results[i].rating,
                        // reviews will contain objects with a rating and a comment as properties
                        reviews: []
                    }
                    const restaurant = new Restaurant(data)
                    restaurants.push(restaurant)

                    let restaurantInfoWindow = new google.maps.InfoWindow();
                    restaurantInfoWindow.setPosition({ lat: restaurantMarker.getPosition().lat(), lng: restaurantMarker.getPosition().lng() });
                    restaurantInfoWindow.setContent(results[i].name);

                    addMarkerListener(restaurantMarker, restaurantInfoWindow, restaurant)

                }

                getRestaurantsOnScreen(restaurants)
                displayRestaurants(visibleRestaurants, restaurantsListElt, restaurantsListHeader, filter)

                // filter restaurants by rating
                filterFormSubmitBtn.addEventListener('click', (event) => {
                    event.preventDefault()

                    let filteredRestaurants = []
                    let minNoteValue = document.getElementById('minNote').value
                    let maxNoteValue = document.getElementById('maxNote').value

                    const filterErrorMessageParagraph = document.getElementById('filterErrorMessage')

                    filteredRestaurants = filterRestaurants(minNoteValue, maxNoteValue, restaurants, filterErrorMessageParagraph)

                    displayRestaurants(filteredRestaurants, restaurantsListElt, restaurantsListHeader, filter)

                    removeMarkers(markers)

                    markers = []

                    for (filteredRestaurant of filteredRestaurants) {
                        const filteredRestaurantPos = { lat: filteredRestaurant.latitude, lng: filteredRestaurant.longitude }
                        const newFilteredRestaurantMarker = createMarker(filteredRestaurantPos, "http://maps.google.com/mapfiles/ms/icons/red-dot.png")

                        markers.push(newFilteredRestaurantMarker)
                    }

                })

                // actions when clicking the button sur unfilter results
                removeFilterSubmitBtn.addEventListener('click', (event) => {
                    event.preventDefault()

                    const filterErrorMessageParagraph = document.getElementById('filterErrorMessage')
                    filterErrorMessageParagraph.innerHTML = ''

                    buildRestaurantMarkers(restaurants)
                    filterRestaurantsForm.reset()

                    // reset restaurants in the restaurant list
                    displayRestaurants(restaurants, restaurantsListElt, restaurantsListHeader, filter)
                })

            }

        }

    })

    // create the infowindow to add a restaurant when clicking the map
    let addRestaurantInfoWindow = new google.maps.InfoWindow({
        position: DEFAULT_LOCATION
    });

    let restaurantsListElt = document.getElementById('restaurantsList')

    const addRestaurantFormElt = document.getElementById('addRestaurantForm')

    let newRestaurantLatitude = 0
    let newRestaurantLongitude = 0

    // add a listener on the map to add a restaurant when clicking it
    google.maps.event.addListener(map, 'click', async (event) => {

        const newRestaurantLatParagraph = document.getElementById('newRestaurantLat')
        const newRestaurantLngParagraph = document.getElementById('newRestaurantLng')

        addRestaurantInfoWindow.close()

        const restaurantPos = { lat: event.latLng.lat(), lng: event.latLng.lng() }
        const restaurantContent = '<input type="button" id="addRestaurantButton" class="addRestaurantButton btn btn-info" onclick="showForm()" value="Ajouter un restaurant" data-toggle="modal" data-target="#restaurantModal">'

        addInfoWindow(addRestaurantInfoWindow, restaurantPos, restaurantContent, map)

        // retrieve the click coordinates
        newRestaurantLatitude = event.latLng.lat()
        newRestaurantLongitude = event.latLng.lng()

        // display the add-restaurant form when clicking the button (id: addRestaurantButton) in the infowindow
        showForm = () => {
            newRestaurantLatParagraph.innerHTML = newRestaurantLatitude
            newRestaurantLngParagraph.innerHTML = newRestaurantLongitude

            addRestaurantInfoWindow.close();

            resetForm(addRestaurantFormElt)
        }

    })

    // actions when submitting the add-restaurant form
    addRestaurantFormElt.addEventListener('submit', (event) => {
        event.preventDefault()

        addNewRestaurant(restaurants, newRestaurantLatitude, newRestaurantLongitude)

        removeMarkers(markers)

        buildRestaurantMarkers(restaurants)

        getRestaurantsOnScreen(restaurants)
        displayRestaurants(visibleRestaurants, restaurantsListElt, restaurantsListHeader, filter)

        let restaurantMarker = null
        for (marker of markers) {
            if (marker.getPosition().lat() === restaurants[restaurants.length - 1].latitude && marker.getPosition().lng() === restaurants[restaurants.length - 1].longitude) {
                restaurantMarker = marker
            }
        }

        displayClickedRestaurantInfo(restaurant, restaurantMarker)

        $('#restaurantModal').modal('hide')
    })

    const addCommentFormElt = document.getElementById('addCommentForm')

    // actions when submitting the add-comment form
    addCommentFormElt.addEventListener('submit', async (event) => {
        event.preventDefault()

        // add a rating and a comment to a restaurant according to the origin of the request (clicked restaurant panel or restaurant list)
        if (clickedFromClickedRestaurant === true) {

            await addRatingToClickedRestaurant(restaurants, restaurantsListElt, restaurantsListHeader)
        } else {
            addRatingToRestaurantFromList(restaurants, restaurantsListElt, clickedButtonId)
        }

        $('#commentModal').modal('hide')

    })

    const restaurantDetailsCloseBtnElt = document.getElementById('restaurantDetailsCloseBtn')

    // actions when clicking the button in the comment modal
    restaurantDetailsCloseBtnElt.addEventListener('click', (event) => {
        event.preventDefault()

        $('#restaurantDetailsModal').modal('hide')
    })

}