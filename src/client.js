import io from 'socket.io-client';
import * as d3 from 'd3';
const predictContainer = document.getElementById('predictContainer');
const userPredictContainer = document.getElementById('userPredictContainer');
const predictButton = document.getElementById('predict-button');
const userPredictBttn = document.getElementById('user-predict-button');

// i guess this is where the magic happens by just including the file
const d3Stuff = require('./d3_stuff.js');

const d3Container = d3.select('#d3_flower_stuff');

const socket =
    io('http://localhost:8001',
       {reconnectionDelay: 300, reconnectionDelayMax: 300});

const testSample = [4.3,3.0,1.1,0.1]; // setosa
const userFlowerStuff = [1.0, 1.0, 1.0, 1.0];

predictButton.onclick = () => {
  predictButton.disabled = true;
  socket.emit('predictSample', testSample);
};

userPredictBttn.onclick = () => {
  userPredictBttn.disabled = true;
  socket.emit('userPredictSample', userFlowerStuff);
};

// functions to handle socket events
socket.on('connect', () => {
    document.getElementById('waiting-msg').style.display = 'none';
    document.getElementById('trainingStatus').innerHTML = 'Training in Progress';
    d3Stuff.makeFlower();
    //console.log('d3 thing: ', d3Stuff);
    socket.emit('clientRequestFlower');
});

// only enable button that allows user to submit training request for a given flower's values
// after server completes training models (emitting a trainingComplete event). When models are
// trained, server can evaluate given user query and return a predicted result 
socket.on('trainingComplete', () => {
  document.getElementById('trainingStatus').innerHTML = 'Training Complete';
  document.getElementById('predictSample').innerHTML = '[' + testSample.join(', ') + ']';
  //document.getElementById('userPredictSample').innerHTML = '[' + userFlowerStuff.join(', ') + ']';
  // predict part of webpage display none (is hidden) by default
  predictContainer.style.display = 'block';
  userPredictContainer.style.display = 'block'
});

socket.on('got_flower_stuff', function(flowerStuff) {
  console.log('got_flower_stuff: ', flowerStuff);
  //makeInputSliders(flowerStuff);
})

socket.on('min_max_stuff', (stuff) => {makeInputSliders(stuff)})

socket.on('predictResult', (result) => {
  plotPredictResult(result);
});

socket.on('userPredictResult', (result) => {
  plotUserResult(result);
});

socket.on('disconnect', () => {
  document.getElementById('trainingStatus').innerHTML = '';
  predictContainer.style.display = 'none';
  document.getElementById('waiting-msg').style.display = 'block';
});

function plotPredictResult(result) {
  predictButton.disabled = false;
  document.getElementById('predictResult').innerHTML = result;
  console.log(result);
}

function plotUserResult(result) {
  userPredictBttn.disabled = false;
  document.getElementById('userPredictResult').innerHTML = result;
  console.log(result);
}

let sliderInputHandler = (e) => {
  console.log(e.target.value);
}

let updateUserFlower = () => {

  let tempPL = document.getElementById('PETAL_LENGTH_Input').innerText;
  tempPL = parseFloat(tempPL);
  tempPL = isNaN(tempPL) ? 1.0 : tempPL;

  let tempPW = document.getElementById('PETAL_WIDTH_Input').innerText;
  tempPW = parseFloat(tempPW);
  tempPW = isNaN(tempPW) ? 1.0 : tempPW;

  let tempSL = document.getElementById('SEPAL_LENGTH_Input').innerText;
  tempSL = parseFloat(tempSL);
  tempSL = isNaN(tempSL) ? 1.0 : tempSL;

  let tempSW = document.getElementById('SEPAL_WIDTH_Input').innerText;
  tempSW = parseFloat(tempSW);
  tempSW = isNaN(tempSW) ? 1.0 : tempSW;
  
  userFlowerStuff[0] = tempSL;
  userFlowerStuff[1] = tempSW;
  userFlowerStuff[2] = tempPL;
  userFlowerStuff[3] = tempPW;

  document.getElementById('userPredictSample').innerHTML = '[' + userFlowerStuff.join(', ') + ']';

  console.log('updating user flower: ', userFlowerStuff);
}

let PETAL_WIDTH_Handler = (e) => {
  console.log('PETAL_WIDTH_Handler value: ', e.target.value);
  document.getElementById('PETAL_WIDTH_Input').innerHTML = e.target.value;
  d3Stuff.makeFlower();
  updateUserFlower();
}

let PETAL_LENGTH_Handler = (e) => {
  console.log('PETAL_LENGTH_Handler value: ', e.target.value);
  document.getElementById('PETAL_LENGTH_Input').innerHTML = e.target.value;
  d3Stuff.makeFlower();
  updateUserFlower();
}

let SEPAL_WIDTH_Handler = (e) => {
  console.log('SEPAL_WIDTH_Handler value: ', e.target.value);
  document.getElementById('SEPAL_WIDTH_Input').innerHTML = e.target.value;
  d3Stuff.makeFlower();
}

let SEPAL_LENGTH_Handler = (e) => {
  console.log('SEPAL_LENGTH_Handler value: ', e.target.value);
  document.getElementById('SEPAL_LENGTH_Input').innerHTML = e.target.value;
  d3Stuff.makeFlower();
}

const handlerArray = [ 
  SEPAL_LENGTH_Handler,
  SEPAL_WIDTH_Handler,
  PETAL_LENGTH_Handler,
  PETAL_WIDTH_Handler
];

let makeInputSliders = (flowerStuff) => {
  // let inputDivThing = document.createElement('div');
  // inputDivThing.setAttribute('id', 'inputDivThing_0');

  // a predefined div in index.html
  let sliderThing = document.getElementById('sliderInputStuff');

  // -- making a slider input by hand --
  /*
  let minBold = document.createElement('b');
  minBold.innerHTML = flowerStuff.PETAL_LENGTH_MIN;
  let maxBold = document.createElement('b');
  maxBold.innerHTML = flowerStuff.PETAL_LENGTH_MAX;
  // label for min value
  sliderThing.appendChild(minBold);
  // actual slider input
  let flowerSliderThing = document.createElement('input');
  flowerSliderThing.setAttribute('type', 'range');
  flowerSliderThing.setAttribute('id', 'petal_len_slider')
  flowerSliderThing.setAttribute('step', 0.1);
  flowerSliderThing.setAttribute('min', flowerStuff.PETAL_LENGTH_MIN);
  flowerSliderThing.setAttribute('max', flowerStuff.PETAL_LENGTH_MAX);
  flowerSliderThing.addEventListener('change', sliderInputHandler);
  // add slider input
  sliderThing.appendChild(flowerSliderThing);
  // label for max value
  sliderThing.appendChild(maxBold);

  let labelThing = document.createElement('label');
  labelThing.innerHTML = ' -- Petal_Slider_length&#40;cm&#41;';
  labelThing.setAttribute('for', 'petal_len_slider');
  sliderThing.appendChild(labelThing);
  */
  
  // -- making a slider input programmatically --
  let flower_min_max = Object.entries(flowerStuff);
  let sliderHandlerIndex = 0;
  // make a slider for each 2 pairs from flowerStuff; a min/max key value pair
  for(let fIndex = 0; fIndex < Object.keys(flowerStuff).length; fIndex += 2 ){
    let tempMin = flower_min_max[fIndex];
    let tempMax = flower_min_max[fIndex+1];
    console.log('making sliders, min: ', tempMin);
    console.log(' - max: ', tempMax);
    let minBold = document.createElement('b');
    minBold.innerHTML = tempMin[0] + ' : ' + tempMin[1];
    let maxBold = document.createElement('b');
    maxBold.innerHTML = tempMax[1] + ' : ' + tempMax[0];

    // actual slider input
    let flowerSliderThing = document.createElement('input');
    flowerSliderThing.setAttribute('type', 'range');
    flowerSliderThing.setAttribute('id', tempMax[0] + '_' + tempMin[0])
    flowerSliderThing.setAttribute('step', 0.1);
    flowerSliderThing.setAttribute('min', tempMin[1]);
    flowerSliderThing.setAttribute('max', tempMax[1]);
    //flowerSliderThing.addEventListener('change', sliderInputHandler);
    let splitFlowerField = tempMax[0].split('_');
    flowerSliderThing.addEventListener('change', handlerArray[sliderHandlerIndex]);
    sliderHandlerIndex++;
    console.log(splitFlowerField);
    let tempP = document.createElement('p');
    // label for min value
    tempP.appendChild(minBold);
    // add slider input
    tempP.appendChild(flowerSliderThing);
    // label for max value
    tempP.appendChild(maxBold);

    sliderThing.appendChild(tempP);
  }
}



