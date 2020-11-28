require('@tensorflow/tfjs-node');

const http = require('http');
const socketio = require('socket.io');
const flower_type = require('./flower_type');

const TIMEOUT_BETWEEN_EPOCHS_MS = 2500;
const PORT = 8001;

// util function to sleep for a given ms
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to start server, perform model training, and emit stats via the socket connection
async function run() {
  const port = process.env.PORT || PORT;
  const server = http.createServer();
  let dataKeys = Object.keys(flower_type.trainingData);
  const io = socketio(server);
  //console.log(`  > flower_type trainingData: ${flower_type.trainingData.toArray()}`);
  server.listen(port, () => {
    console.log(`  > Running socket on port: ${port}`);
	
  });

  io.on('connection', (socket) => {

    socket.on('predictSample', async (sample) => {
      io.emit('predictResult', await flower_type.predictSample(sample));
    });
    // wait for user to request training, triggering this event
    socket.on('userPredictSample', async (userSample) => {
      io.emit('userPredictResult', await flower_type.predictSample(userSample));
    });  
     
  });

  /* 
    trying to get source flower data to render on client side
     1.) client side - when client connects to server and initializes the client then emits 'clientRequestFlower' socketio event
     2.) server side - upon receiving 'clientRequestFlower' event process tensorflow data asynchorously and deliver results
                       through 'got_flower_stuff' socketio event 
  */
  io.on('connection', (socket) => {
    let flowers = [];
      socket.on('clientRequestFlower', async () => {
  
        /*await flower_type.trainingData.forEachAsync(e => {
          flowers.push(e);
          io.emit('get_flower_stuff', e);
          //console.log('collecting flower stuff: ', e);
        }).then( () => io.emit('got_flower_stuff', flowers) );*/

        // use promise to collect data and return results all at once
        await flower_type.rawData.forEachAsync(e => {
          flowers.push(e);
          io.emit('get_flower_stuff', e);
          //console.log('collecting flower stuff: ', e);
        }).then( () => io.emit('got_flower_stuff', flowers) );
        console.log('flowers len: ', flowers.length);

        io.emit('min_max_stuff', flower_type.MIN_MAX_STUFF);
      });
      
    });

  let numTrainingIterations = 3;
  for (var i = 0; i < numTrainingIterations; i++) {
    console.log(`Training iteration : ${i+1} / ${numTrainingIterations}`);
    await flower_type.model.fitDataset(flower_type.trainingData, {epochs: 1});
    console.log('accuracyPerClass', await flower_type.evaluate(true));
    await sleep(TIMEOUT_BETWEEN_EPOCHS_MS);
  }

  io.emit('trainingComplete', true);
  console.log('trainingComplete');
}

run();