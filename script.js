'use strict';



// Parent Class
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); // giving unique id's
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // for displaying the current date
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  // counting the clicks
  click() {
    this.clicks++;
  }
}


// Child Class
class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadance) {
    super(coords, distance, duration);
    this.cadance = cadance;

    this.calcPace();
    this._setDescription();
  }


  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// Child Class
class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;

    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
};

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);

// console.log(run1, cycling1);



// ===================================================================
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];

  constructor() {
    // this will be executed b'cause it's inside of the constructor method
    // Load page
    // get user location
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();


    //Display the marker
    // Submitting the form
    form.addEventListener('submit', this._newWorkout.bind(this));

    // toggling the type input field and change it input if it is Running or Cycling selected
    inputType.addEventListener('change', this._toggleElevationField);

    // moving to the marker whatever specifically the user click on the sidebar
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));


  }

  _getPosition() {
    // Geolocation API
    if (navigator.geolocation) {

      // getting user current location
      // this._loadMap.bind(this) --> para gumana yung (this) keyword sa _loadMap() method which is yung (this.#map) & (this.#mapEvent)
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
        function () {
          alert(`Could not get your position`);
        })
    };
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    // from Leaflet.com
    // set the map where your current location is
    console.log(this)
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel); // 13 is how close the zoom is, the higher the value the closer it gets

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);


    // Event listener
    // take coordinates whenever & wherever the user click on the map
    // handling clicks on map
    this.#map.on('click', this._showForm.bind(this));


    // for displaying the data as a marker to the map from LS
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    })
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden'); // to show the input fields after the user clicks on the map
    inputDistance.focus(); // focus on the input Distance input field
  }

  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden'); // to hide the input fields after the user click on the map
    setTimeout(() => form.style.display = 'grid', 1000); //dirty trick
  }

  // Method for toggling the type input field and change it input if it is Running or Cycling selected
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) =>
      inputs.every(inp => inp > 0)

    e.preventDefault();

    //================================================================================
    //======================> Get data from the form
    //================================================================================
    const type = inputType.value;
    const distance = +inputDistance.value; // by putting (+) before inputDistance.value converts it into number
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng; // location coordinates
    let workout;


    //================================================================================
    //======================> If workout is running, create running object
    //================================================================================
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //==== Check if data is valid
      // === validate if data is a number
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)) {
        return alert('Inputs must be number!')
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }


    //================================================================================
    //======================> If workout is cycling, create cycling object
    //================================================================================ 
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //==== Check if data is valid
      // === validate if data is a number
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)) {
        return alert('Inputs must be number!')
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }


    //================================================================================ 
    //======================> Add new object to workout array
    //================================================================================ 
    this.#workouts.push(workout);
    console.log(workout);


    //================================================================================ 
    //======================> Render workout on map as marker
    //================================================================================ 
    this._renderWorkoutMarker(workout);


    //================================================================================  
    //======================> Render workout on list
    //================================================================================ 
    this._renderWorkout(workout);


    //================================================================================  
    //======================> Hide the form + clear input fields
    //================================================================================  
    this._hideForm();


    //================================================================================  
    //======================> Set local storage to all workouts
    //================================================================================
    this._setLocalStorage();
  }

  // Displaying marker on the map
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,  //prevent from closing everytime user click on the map
        closeOnClick: false, //prevent from closing everytime user click on the map
        className: `${workout.type}-popup` // giving css style on the pop up box
      }))
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`) //display description on the marker on the map
      .openPopup();
  }

  // Displaying details on sidebar
  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div >
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `

    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `
    };

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `
    };

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return; //instead of null

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    console.log(this.#workouts);

    // from leaflet
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      }
    })

    // using the public interface
    // workout.click();
  }


  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return; //if not data on local storage

    // putting the data from localStorage into the #workouts array
    this.#workouts = data;

    // for displaying the data from LS into the sideb ar
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    })
  }

  // removing data from the LS
  reset() {
    localStorage.removeItem('workouts');
    location.reload(); //reload the page
  }
}

const app = new App();


/*
!!!! IMPORTANT NOTE !!!!

When working with event handlers inside a classes
you always need to bind the (this) keyword all the time
to point its own this keyword to it's own.

in short para mapagana yung (this) keyword inside nung method

This syntax ===> .bind(this)

Example: 
  this._loadMap.bind(this)
  this._newWorkout.bind(this)

*/