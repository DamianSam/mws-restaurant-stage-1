/* eslint-disable */

let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiZGFtaWFuc2FtIiwiYSI6ImNqanhnd25vNDJvd3UzcG1hNTlhbWgzOXIifQ.Iio2J0nAVFktvcmqQk1Utw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  const assetsFolder = 'assets';
  const imageUrl = assetsFolder + DBHelper.imageUrlForRestaurant(restaurant);
  // const fileName = imageUrl.split('.').slice(0, -1).join('.');
  // const fileExtension = imageUrl.split('.').pop();
  const fileExtension = 'jpg';
  image.className = 'restaurant-img';
  image.alt = 'Interior of ' + restaurant.name;
  image.src = imageUrl + '-440w.' + fileExtension;
  image.width = '440';
  image.srcset = imageUrl + '-320w.' + fileExtension + ' 320w, ' + imageUrl + '-440w.' + fileExtension + ' 440w, ' + imageUrl + '.' + fileExtension + ' 800w';
  image.sizes = '(max-width: 500px) 440px, (max-width: 1024px) 600px, 100vw';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  DBHelper.fetchReviewsById(self.restaurant.id, (error, reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  });
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const reviewMeta = document.createElement('div');
  reviewMeta.className = 'review-meta';
  li.appendChild(reviewMeta);

  const name = document.createElement('h3');
  name.innerHTML = review.name;
  reviewMeta.appendChild(name);

  const date = document.createElement('p');
  const createdDate = new Date(review.createdAt);
  const createdDay = createdDate.getDate();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const createdMonth = months[createdDate.getMonth()];
  const createdYear = createdDate.getFullYear();
  date.innerHTML = `Added: ` + `${createdDay} ${createdMonth} ${createdYear}`;
  reviewMeta.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  reviewMeta.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Review form.
 */
const reviewForm = document.getElementById('review-form');
reviewForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let form = new FormData(e.target);
  let name = form.get('Name');
  let rating = form.get('Rating');
  let comments = form.get('form-review-content');
  let restaurant_id = self.restaurant.id;
  const review = {
    name,
    rating,
    comments,
    restaurant_id,
  };
  const confirm = document.createElement('p');
  confirm.innerHTML = 'Thank you!';
  reviewForm.appendChild(confirm);

  DBHelper.reviewFormSubmit(review, (error, review) => {
    const ul = document.getElementById('reviews-list');
    ul.appendChild(createReviewHTML(review));
    reviewForm.reset();
    setTimeout( () => {
      confirm.remove();
    }, 5000);
    DBHelper.storeReviewWhenForm(review);
  });

});


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const breadcrumbLink = document.createElement('a');
  const breadcrumbList = breadcrumb.getElementsByTagName('ol')[0];
  const breadcrumbItems = breadcrumbList.getElementsByTagName('li');

  breadcrumbList.appendChild(li);
  li.appendChild(breadcrumbLink);
  breadcrumbLink.innerHTML = restaurant.name;

  const lastItem = breadcrumbList.getElementsByTagName('li')[breadcrumbList.getElementsByTagName('li').length - 1];

  lastItem.children[0].href = window.location;
  lastItem.children[0].setAttribute('aria-current', 'page');
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
