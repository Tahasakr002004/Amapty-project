'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
/****************************232(Geolocation API Navigation)*************************************** */
class Workout {
  date = new Date();
  id = +(Date.now() + '').slice(-10);
  click = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat , lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  _clicks() {
    this.click++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  //1
  calcPace() {
    this.pace = +this.duration / +this.cadence;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  //1
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////////////////////////////////////////////
class App {
  #map;
  _eventPos;
  #workouts = [];
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    // changing and toggle
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    //movetopopup
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    ///getdata from localstorage
    this._getLocalStorage();
  }
  //////1-
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }
  /////2
  _loadMap(myPosition) {
    console.log('this is my position: ', myPosition);
    const { latitude } = myPosition.coords;
    const { longitude } = myPosition.coords;
    console.log(latitude, longitude);
    const coords = [latitude, longitude];
    ///third party library leaflet for maps
    this.#map = L.map('map').setView(coords, 13); // 13 refers to how close

    // console.log(map);
    // tilelayer for theme and appearance of tile of map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // leaflet event handler to display marker
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(el => this._renderWorkoutMarker(el));
  }
  //////3
  _showForm(ePos) {
    console.log(ePos);
    this._eventPos = ePos;
    // Render workout form
    form.classList.remove('hidden');
    inputDistance.focus(); // whenever we click on map, it will focus on first time on inputdistace}
  }
  //////4
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  ///5
  // Rendering the marker
  _newWorkout(event) {
    event.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this._eventPos.latlng;
    let workout;
    //////

    //Check if data is valid function
    const validInputs = (...inputs) => inputs.every(el => Number.isFinite(el));
    const allPositive = (...inputs) => inputs.every(el => el > 0);
    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Your Input is invalid, sorry');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Your Input is invalid, sorry');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Add new object to workout array
    this.#workouts.push(workout);
    console.log(this.#workouts);
    //Render workout on list
    console.log(workout);
    this._renderWorkout(workout);
    ///
    // Render workout on map as marker
    this._renderWorkoutMarker(workout);
    this._hideForm();
  }
  ///6
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
          content: `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
            workout.description
          }`,
        })
      )
      .openPopup();
  }
  ///7
  _renderWorkout(workout) {
    let html = ` <li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;
    if (workout.type === 'running') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
          </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
     </div>
     <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
     </div>
    </li>`;
    }
    form.insertAdjacentHTML('afterend', html);

    this._setLocalStorage();
  }
  ///8
  _hideForm() {
    // Hide form + clear input fields
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  ///10 set localstorage
  ///8
  _moveToPopup(event) {
    const workoutEl = event.target.closest('.workout');
    console.log(workoutEl);
    ///
    if (!workoutEl) return;
    let workout = this.#workouts.find(function (work) {
      // console.log(workoutEl.dataset.id);
      // console.log(work.id);
      return work.id === +workoutEl.dataset.id;
    });
    // console.log(workout);
    // console.log(this.#workouts);

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
    //using the public interface
    // workout._clicks();
  }
  ////11
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  ////get data
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);
    if (!data) return;
    this.#workouts = data;
    ///
    this.#workouts.forEach(el => this._renderWorkout(el));
  }
  /// this functionality to reset the localstorage
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
//////////////////////////////////////////////////////////////////////////////////////
// const running1 = new Running([40, -12], 5.5, 24, 100);
// const cycling1 = new Cycling([40, -12], 5.5, 24, 100);
// console.log(running1, cycling1);
////////////////////////////////////////////////////////
const myApp = new App();
