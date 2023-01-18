'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Parent Class
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); // giving unique id's

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
}


// Child Class
class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadance) {
    super(coords, distance, duration);
    this.cadance = cadance;

    this.calcPace();
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
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
};

const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Cycling([39, -12], 27, 95, 523);

console.log(run1, cycling1);



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
  #workouts = [];

  constructor() {
    // this will be executed b'cause it's inside of the constructor method
    // Load page
    this._getPosition();


    //Display the marker
    // Submitting the form
    form.addEventListener('submit', this._newWorkout.bind(this));

    // toggling the type input field and change it input if it is Running or Cycling selected
    inputType.addEventListener('change', this._toggleElevationField);
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
    this.#map = L.map('map').setView(coords, 13); // 13 is how close the zoom is, the higher the value the closer it gets

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);


    // Event listener
    // take coordinates whenever & wherever the user click on the map
    // handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden'); // to show the input fields after the user click on the map
    inputDistance.focus(); // focus on the input Distance input field
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
    this.renderWorkoutMarker(workout);

    //================================================================================  
    //======================> Render workout on list
    //================================================================================  


    //================================================================================  
    //======================> Hide the form + clear input fields
    //================================================================================  
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,  //prevent from closing everytime user click on the map
        closeOnClick: false, //prevent from closing everytime user click on the map
        className: `${workout.type}-popup` // giving css style on the pop up box
      }))
      .setPopupContent(`${workout.distance}`)
      .openPopup();
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