const tf = require('@tensorflow/tfjs');

// util function to normalize a value between a given range.
function normalize(value, min, max) {
  if (min === undefined || max === undefined) {
    return value;
  }
  return (value - min) / (max - min);
}

// data can be loaded from URLs or local file paths when running in Node.js. 
const TRAIN_DATA_PATH = 'file://data/iris.csv';
const TEST_DATA_PATH =  'file://data/iris.csv';

// Constants from training data
const SEPAL_LENGTH_MIN = 4.3;
const SEPAL_LENGTH_MAX = 7.9;
const SEPAL_WIDTH_MIN = 2;
const SEPAL_WIDTH_MAX = 4.2;
const PETAL_LENGTH_MIN = 1;
const PETAL_LENGTH_MAX = 6.9;
const PETAL_WIDTH_MIN = 0.1;
const PETAL_WIDTH_MAX = 2.5;

// using this to make some slider inputs for client webpage
const MIN_MAX_STUFF = {
  'SEPAL_LENGTH_MIN': SEPAL_LENGTH_MIN,
  'SEPAL_LENGTH_MAX': SEPAL_LENGTH_MAX,
  'SEPAL_WIDTH_MIN': SEPAL_WIDTH_MIN,
  'SEPAL_WIDTH_MAX': SEPAL_WIDTH_MAX,
  'PETAL_LENGTH_MIN': PETAL_LENGTH_MIN,
  'PETAL_LENGTH_MAX': PETAL_LENGTH_MAX,
  'PETAL_WIDTH_MIN': PETAL_WIDTH_MIN,
  'PETAL_WIDTH_MAX': PETAL_WIDTH_MAX,
}

const NUM_FLOWER_CLASSES = 3;
const TRAINING_DATA_LENGTH = 150;
const TEST_DATA_LENGTH = 150;

// Converts a row from the CSV into features and labels.
// Each feature field is normalized within training data constants

const csvTransform =
    ({xs, ys}) => {
      const values = [
        normalize(xs.sepal_length, SEPAL_LENGTH_MIN, SEPAL_LENGTH_MAX),
        normalize(xs.sepal_width, SEPAL_WIDTH_MIN, SEPAL_WIDTH_MAX),
        normalize(xs.petal_length, PETAL_LENGTH_MIN, PETAL_LENGTH_MAX),
        normalize(xs.petal_width, PETAL_WIDTH_MIN, PETAL_WIDTH_MAX)
      ];
      //console.log(`values : ${values}`);
      //console.log(`ys : ${ys.species}`);
      //rawData.push(values);
      return {xs: values, ys: ys.species};
    }

const rawData =
    tf.data.csv(TRAIN_DATA_PATH, {columnConfigs: {species: {isLabel: true}}});
    //tf.data.csv(TRAIN_DATA_PATH, {columnConfigs: {species: {isLabel: true}}})
      //.map(csvTransform)
      //.shuffle(TRAINING_DATA_LENGTH);
    
const trainingData =
    tf.data.csv(TRAIN_DATA_PATH, {columnConfigs: {species: {isLabel: true}}})
        .map(csvTransform)
        .shuffle(TRAINING_DATA_LENGTH)
        .batch(10);

// Load all training data in one batch to use for evaluation
const trainingValidationData =
    tf.data.csv(TRAIN_DATA_PATH, {columnConfigs: {species: {isLabel: true}}})
        .map(csvTransform)
        .batch(TRAINING_DATA_LENGTH);

// Load all test data in one batch to use for evaluation
const testValidationData =
    tf.data.csv(TEST_DATA_PATH, {columnConfigs: {species: {isLabel: true}}})
        .map(csvTransform)
        .batch(TEST_DATA_LENGTH);
		
const model = tf.sequential();
// 250 175 150
model.add(tf.layers.dense({units: 25, activation: 'relu', inputShape: [4]}));
model.add(tf.layers.dense({units: 17, activation: 'relu'}));
model.add(tf.layers.dense({units: 15, activation: 'relu'}));
model.add(tf.layers.dense({units: NUM_FLOWER_CLASSES, activation: 'softmax'}));

model.compile({
  optimizer: tf.train.adam(),
  loss: 'sparseCategoricalCrossentropy',
  metrics: ['accuracy']
});

// Returns flower class evaluation percentages for training data 
// with an option to include test data
async function evaluate(useTestData) {
  let results = {};
  await trainingValidationData.forEachAsync(flowerTypeBatch => {
    const values = model.predict(flowerTypeBatch.xs).dataSync();
    const classSize = TRAINING_DATA_LENGTH / NUM_FLOWER_CLASSES;
    for (let i = 0; i < NUM_FLOWER_CLASSES; i++) {
      results[flowerFromClassNum(i)] = {
        training: calcFlowerClassEval(i, classSize, values)
      };
    }
  });

  if (useTestData) {
    await testValidationData.forEachAsync(flowerTypeBatch => {
      const values = model.predict(flowerTypeBatch.xs).dataSync();
      const classSize = TEST_DATA_LENGTH / NUM_FLOWER_CLASSES;
      for (let i = 0; i < NUM_FLOWER_CLASSES; i++) {
        results[flowerFromClassNum(i)].validation =
            calcFlowerClassEval(i, classSize, values);
      }
    });
  }
  return results;
}

async function predictSample(sample) {
  let result = model.predict(tf.tensor(sample, [1,sample.length])).arraySync();
  var maxValue = 0;
  var predictedFlower = 3;
  for (var i = 0; i < NUM_FLOWER_CLASSES; i++) {
    if (result[0][i] > maxValue) {
      predictedFlower = i;
      maxValue = result[0][i];
    }
  }
  return flowerFromClassNum(predictedFlower);
}

// Determines accuracy evaluation for a given flower class by index
function calcFlowerClassEval(flowerIndex, classSize, values) {
  // Output has 3 different class values for each flower, offset based on
  // which flower class (ordered by i)
  let index = (flowerIndex * classSize * NUM_FLOWER_CLASSES) + flowerIndex;
  let total = 0;
  for (let i = 0; i < classSize; i++) {
    total += values[index];
    index += NUM_FLOWER_CLASSES;
  }
  return total / classSize;
}

// Returns the string value for flower species labels
function flowerFromClassNum(classNum) {
  switch (classNum) {
    case 0:
      return 'setosa';
    case 1:
      return 'versicolor';
    case 2:
      return 'virginica';
    default:
      return 'Unknown';
  }
};

module.exports = {
  evaluate,
  model,
  flowerFromClassNum,
  predictSample,
  testValidationData,
  trainingData,
  TEST_DATA_LENGTH,
  rawData,
  MIN_MAX_STUFF
}