/**
 * This function calculates an average rating from an array of reviews.
 * @param {Array.} arr expects an array of reviews.
 * @returns a float number rounded to one decimal.
 */
getAverageNumber = (restaurantObject) => {
    let totalNumber = 0
    if (restaurantObject.reviews.length === 0) {
        return 0
    }

    if (!restaurantObject.user_ratings_total) {
        restaurantObject.user_ratings_total = 0
    }

    // example with an addition of a rating of 5 to a restaurant with an average rating of 3.9 and 158 rating total
    // 3.9 * 158 = 616,2
    totalNumber = restaurantObject.rating * restaurantObject.user_ratings_total
    // 616,2 + 5 (rating from the last review from reviews)
    totalNumber += restaurantObject.reviews[restaurantObject.reviews.length - 1].rating

    return parseFloat((totalNumber / (restaurantObject.user_ratings_total + 1)).toFixed(1))
}