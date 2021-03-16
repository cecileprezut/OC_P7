/**
 * This function allows you to hide a given div.
 * @param {HTML element} div expects a reference to a div DOM element
 */
function hideDiv(div) {
    div.setAttribute('style', 'display: none')
}

/**
 * This function displays the clicked restaurant panel.
 * @param {Object} restaurant expects a Restaurant object corresponding to the marker clicked.
 * @param {Object} marker expects the clicked marker object.
 */
function displayClickedRestaurantInfo(restaurant, marker) {

    const filterAndRestaurantsDiv = document.getElementById('filterAndRestaurants')
    filterAndRestaurantsDiv.setAttribute('style', 'display:none')

    retrieveStreetView(marker)

    const closeIconDiv = document.createElement('div')

    const restaurantClickedInfoDiv = document.getElementById('restaurantClickedInfo')
    const restaurantClickedDiv = document.getElementById('restaurantClicked')
    const restaurantClickedHeaderDiv = document.getElementById('restaurantClickedHeader')

    // display the clicked restaurant div
    restaurantClickedDiv.removeAttribute('style')

    const nameParagraph = document.createElement('p')
    const addressParagraph = document.createElement('p')
    const ratingParagraph = document.createElement('p')
    const commentsUl = document.createElement('ul')

    restaurantClickedInfoDiv.innerHTML = ''
    restaurantClickedHeaderDiv.innerHTML = ''
    let commentHtml = ''

    // retrieve and show the details for the restaurant matching the clicked marker
    restaurantClickedHeaderDiv.appendChild(closeIconDiv)
    closeIconDiv.innerHTML = '<i id="clickedRestaurantCloseButton" class="fas fa-window-close"></i>'

    restaurantClickedHeaderDiv.appendChild(nameParagraph)
    nameParagraph.innerHTML = restaurant.name

    restaurantClickedInfoDiv.appendChild(addressParagraph)
    addressParagraph.innerHTML = restaurant.address

    restaurantClickedInfoDiv.appendChild(ratingParagraph)

    if (restaurant.rating === 0) {
        ratingParagraph.innerHTML = 'Pas encore noté'
    } else if (restaurant.rating !== 0) {
        ratingParagraph.innerHTML = 'Note moyenne : ' + restaurant.rating + "<br/>" + "Nombre d'avis : " + restaurant.user_ratings_total
    }

    // restaurant name in the comment modal
    const restaurantDetailsModalLabelElt = document.getElementById('restaurantDetailsModalLabel')
    restaurantDetailsModalLabelElt.innerHTML = restaurant.name

    // restaurant comments in the comment modal
    const commentsDiv = document.getElementById('comments')
    commentsDiv.innerHTML = ''
    commentsDiv.appendChild(commentsUl)

    for (review of restaurant.reviews) {
        const commentLi = document.createElement('li')
        commentsUl.appendChild(commentLi)
        const commentBlockquote = document.createElement('blockquote')
        commentLi.appendChild(commentBlockquote)
        commentHtml = 'Note : ' + review.rating + '<br/>"' + review.text + '"<br />'
        commentBlockquote.innerHTML += commentHtml
    }

    const addCommentBtnDiv = document.createElement('div')
    const seeCommentBtnDiv = document.createElement('div')
    restaurantClickedInfoDiv.appendChild(addCommentBtnDiv)
    restaurantClickedInfoDiv.appendChild(seeCommentBtnDiv)

    addCommentBtnDiv.innerHTML = '<input type="button" class="button btn btn-info btn-lg" id="addCommentBtn" value="Ajouter un avis" data-toggle="modal" data-target="#commentModal">'
    seeCommentBtnDiv.innerHTML = '<input type="button" class="button btn btn-info btn-lg" id="seeCommentBtn" value="Voir les avis" data-toggle="modal" data-target="#restaurantDetailsModal">'

    // add the restaurant id as button attribute
    const addCommentBtnElt = document.getElementById('addCommentBtn')
    addCommentBtnElt.setAttribute('restaurant', restaurant.id)
    addCommentBtnElt.setAttribute('lat', restaurant.latitude)
    addCommentBtnElt.setAttribute('lng', restaurant.longitude)

    // actions when clicking the add-comment button (id: addCommentBtn)
    addCommentBtnElt.addEventListener('click', (event) => {
        event.preventDefault()
        clickedFromClickedRestaurant = true

        resetForm(addCommentForm)
    })

    // actions when clicking the close icon of the clicked restaurant panel
    const clickedRestaurantCloseBtn = document.getElementById('clickedRestaurantCloseButton')

    clickedRestaurantCloseBtn.addEventListener('click', (event) => {
        event.preventDefault()

        hideDiv(restaurantClickedDiv)

        filterAndRestaurantsDiv.removeAttribute('style')

    })

    clickedFromClickedRestaurant = false

}

/**
 * This function converts a rating number into stars.
 * @param {!number} rating expects the average rating of a restaurant.
 * @returns an output of font awesome star icons.
 */
function getStars(rating) {
    if (rating === 0) {
        return ''
    }

    // round to the nearest half
    rating = Math.round(rating * 2) / 2;
    let output = [];

    // append all the filled whole stars
    for (var i = rating; i >= 1; i--) {
        output.push(`<i class='fas fa-star'></i>`);
    }

    // if there is a half star
    if (i == .5) output.push(`<i class='fas fa-star-half-alt'></i>`);

    // add empty stars until reaching 5
    for (let i = (5 - rating); i >= 1; i--) {
        output.push(`<i class='far fa-star'></i>`);
    }

    return output.join('');

}

/**
 * This function show a loader while loading the restaurant list
 * @param {Boolean} loadingList is true if the list is being loaded. It is false when the list is loaded.
 * @param {HTML element} restaurantsListElt expects a reference to the restaurant list DOM element.
 */
function showRestaurantsListLoader(loadingList, restaurantsListElt) {
    if (loadingList) {
        const loadingContentDiv = document.createElement('div')
        restaurantsListElt.appendChild(loadingContentDiv)
        loadingContentDiv.setAttribute('class', 'loading')
        loadingContentDiv.innerHTML = 'Chargement en cours'
    } else {
        restaurantsListElt.innerHTML = ''
    }
}

/**
 * This function shows the restaurant list.
 * @param {Array.} restaurantArr expects an array of restaurants.
 * @param {HTML element} restaurantsListElt expects a reference to the restaurant list DOM element.
 * @param {HTML element} restaurantsListHeader expects a reference to the restaurant list header DOM element.
 * @param {Boolean} filter is true if the user requested a filtering action.
 */
function displayRestaurants(restaurantArr, restaurantsListElt, restaurantsListHeader, filter) {
    const divTitle = document.createElement('h2')
    restaurantsListHeader.innerHTML = ''
    restaurantsListElt.innerHTML = ''

    // loading in progress
    loadingList = true
    showRestaurantsListLoader(loadingList, restaurantsListElt)

    if (restaurantArr.length === 0) {
        // remove the loading in progress text on the restaurant list
        loadingList = false
        showRestaurantsListLoader(loadingList, restaurantsListElt)

        divTitle.innerHTML = 'Aucun résultat ne correpond à votre recherche dans la zone sélectionnée.'
        restaurantsListHeader.appendChild(divTitle)
    } else {
        // remove the loading in progress text on the restaurant list
        loadingList = false
        showRestaurantsListLoader(loadingList, restaurantsListElt)

        filter ?
            divTitle.innerHTML = 'Résultats correspondant au filtre choisi (' + restaurantArr.length + ')'
            : divTitle.innerHTML = 'Restaurants à proximité (' + restaurantArr.length + ')';
        restaurantsListHeader.appendChild(divTitle)

        const ul = document.createElement("ul")

        restaurantArr.forEach(restaurant => {
            let starDisplay = document.createElement('span')

            const li = document.createElement("li");
            li.setAttribute('class', 'card')
            restaurantsListElt.appendChild(ul)
            ul.appendChild(li)

            const restaurantNameSpan = document.createElement('span')
            restaurantNameSpan.setAttribute('class', 'card-header')
            restaurantNameSpan.innerHTML = restaurant.name
            li.appendChild(restaurantNameSpan)

            const restaurantInfoSpan = document.createElement('span')
            restaurantInfoSpan.setAttribute('class', 'card-body')

            if (!restaurant.rating) {
                restaurantInfoSpan.innerHTML = restaurant.address + "<br />" + 'Pas encore noté'
            } else {
                restaurantInfoSpan.innerHTML = restaurant.address + "<br />" + 'Note moyenne : ' + restaurant.rating + "<br/>"
            }

            // display star rating
            starDisplay.innerHTML = getStars(restaurant.rating)
            restaurantInfoSpan.appendChild(starDisplay)
            li.appendChild(restaurantInfoSpan)

            const buttonSpan = document.createElement('span')
            buttonSpan.setAttribute('class', 'card-footer text-center')
            buttonSpan.innerHTML = '<input type="button" class="button btn btn-info btn-lg btn-block" id="' + restaurant.id + '" value="Ajouter un avis" data-toggle="modal" data-target="#commentModal">'
            li.appendChild(buttonSpan)
            clickedButtonId = restaurant.id

            buttonSpan.addEventListener('click', (event) => {
                resetForm(addCommentForm)
            })

        })

        const buttonElts = document.getElementsByClassName('button')

        for (let i = 0; i < buttonElts.length; i++) {
            // actions when clicking an add-comment button
            buttonElts[i].addEventListener('click', (event) => {
                event.preventDefault()
                buttonElts[i].setAttribute('clickedfrom', 'restaurantsList')
                clickedButtonId = buttonElts[i].getAttribute('id')
            })
        }
    }
}

/**
 * This function creates and shows markers for the given restaurants.
 * @param {Array.} restaurants expects an array of restaurant objects.
 */
function buildRestaurantMarkers(restaurants) {
    markers = []

    for (restaurant of restaurants) {
        const marker = new google.maps.Marker({
            position: { lat: restaurant.latitude, lng: restaurant.longitude },
            map: map,
            icon: { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }
        })

        let restaurantInfoWindow = new google.maps.InfoWindow();
        restaurantInfoWindow.setPosition({ lat: marker.getPosition().lat(), lng: marker.getPosition().lng() });
        restaurantInfoWindow.setContent(restaurant.name);

        addMarkerListener(marker, restaurantInfoWindow, restaurant)

        markers.push(marker)
    };
}

/**
 * This function retrieves all the restaurants currently shown on the map.
 * @param {Array.} restaurantsArr expects an array of restaurant objects.
 */
function getRestaurantsOnScreen(restaurantsArr) {
    visibleRestaurants = []

    for (const marker of markers) {

        // returns a boolean: true if the marker is visible
        const markerIsVisible = map.getBounds().contains(marker.getPosition())

        if (markerIsVisible) {
            const markerPos = { lat: marker.getPosition().lat(), lng: marker.getPosition().lng() }

            for (const restaurant of restaurantsArr) {

                if (restaurant.latitude === markerPos.lat && restaurant.longitude === markerPos.lng) {
                    visibleRestaurants.push(restaurant);
                }
            };
        }
    }

}