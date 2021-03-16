class Restaurant {
    constructor(data) {
        this.id = data.id;
        this.manuallyAdded = data.manuallyAdded || false;
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.name = data.name;
        this.address = data.address;
        this.rating = data.rating;
        this.reviews = data.reviews;
    }
}