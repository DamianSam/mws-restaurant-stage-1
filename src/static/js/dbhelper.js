/* eslint-disable */

/**
 * Common database helper functions.
 */

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get REVIEWS_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  static createDb() {
    return idb.open('mws-restaurant-db', 3, upgradeDB => {
      switch (upgradeDB.oldVersion) {
        case 0:
          upgradeDB.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        case 1:
          const reviewsStore = upgradeDB.createObjectStore('reviews', {
            keyPath: 'id'
          });
          reviewsStore.createIndex('restaurant', 'restaurant_id');
      }
    });
  }

  static dbPromise() {
    return DBHelper.createDb();
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL).then(response => response.json()).then(data => {
      DBHelper.updateIDB(data);
      return callback(null, data);
    }).catch(error => {
      DBHelper.createDb().then(db => {
        let tx = db.transaction('restaurants', 'readwrite');
        let dbStore = tx.objectStore('restaurants');
        return dbStore.getAll();
      })
      .then(data => {
        if (data.length) {
          callback(null, data);
        } else {
          callback(error, null);
        }
      })
    })
  }

  /**
   * Update indexDB
   */
  static updateIDB(data) {
    DBHelper.createDb().then(db => {
      let tx = db.transaction('restaurants', 'readwrite');
      let dbStore = tx.objectStore('restaurants');
      data.forEach(restaurant => {
        dbStore.put(restaurant);
      });
      tx.complete.catch(() => console.log('Error'))
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (!restaurant.photograph) {
      return (`/img/1`);
    } else {
      return (`/img/${restaurant.photograph}`);
    }
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }

  /**
   * Favorite button.
   */
  static favUpdate(restaurant) {
   const url = `${DBHelper.DATABASE_URL}/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`;
   return fetch(url, {
       method: 'PUT'
     })
     .then(() => {
       DBHelper.dbPromise().then(idb => {
         const tx = idb.transaction('restaurants', 'readwrite');
         const dbStore = tx.objectStore('restaurants');
         dbStore.get(restaurant.id).then(restaurantFav => {
           restaurantFav.is_favorite = restaurant.is_favorite;
           dbStore.put(restaurantFav);
         });
       });
     });
  }

  /****
  ** REVIEWS
  **/

  /**
  * Store reviews.
  */
  static storeReviews(reviews) {
    return DBHelper.dbPromise().then(idb => {
      const tx = idb.transaction('reviews', 'readwrite');
      const revStore = tx.objectStore('reviews');
      return Promise.all(reviews.map(review => revStore.put(review)))
        .catch(() => {tx.abort(); });
    });
  }

  /**
  * Store review when form is submitted.
  */
  static storeReviewWhenForm(review) {
    return DBHelper.dbPromise().then(idb => {
      const tx = idb.transaction('reviews', 'readwrite');
      const revStore = tx.objectStore('reviews');
      revStore.put(review);
      return tx.complete.catch(() => console.log('Error'));
    });
  }

  /**
  * Fetch reviews.
  */
  static fetchReviews() {
    return DBHelper.dbPromise().then(idb => {
      const tx = idb.transaction('reviews', 'readonly');
      const revStore = tx.objectStore('reviews');
      return revStore.getAll();
    });
  }

  /**
  * Fetch reviews by id.
  */
  static fetchReviewsById(id, callback) {
    const url = `${DBHelper.REVIEWS_URL}/?restaurant_id=${id}`;

    fetch(url).then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        } else {
          throw new TypeError('Error: no json.');
        }
      }).then(json => {
        const reviews = json;
        DBHelper.storeReviews(reviews);
        callback(null, reviews);
      }).catch(error => {
        this.fetchReviews().then(data => {
          const revID = [];
          const reviews = data;
          reviews.forEach(rev => {
            if (rev.restaurant_id === id) {
              revID.push(rev);
            }
          });
          if (revID.length > 0) {
            callback(null, revID);
          } else {
            callback('No Reviews', null);
          }
        });
        console.log('Something went wrong: ' + error);
      });
  }

  /**
  * Reviews form submission.
  */
  static reviewFormSubmit(review, callback) {
    const url = `${DBHelper.REVIEWS_URL}`;
    fetch(url, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(review)
    }).then(revSub => revSub.json()).then(revSub => {
      callback(null, revSub);
    });
  }
}
