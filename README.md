# iris-basic
 iris data viewer based on tensorflow js baseball tutorial 
 
 link can be found here - https://codelabs.developers.google.com/codelabs/tensorflowjs-nodejs-codelab/ 

Main features 
- abstract flower rendered with d3.js on client web page generated from source data
- user input area with sliders bound by min/max values for each data field
- crude machine learning model (note: incorrectly trained/configured at this point)

- after server completes training ML model, emits event that allows client/user to submit query to run through ML model serverside
- after user input processed on server, prediction result are sent to be displayed on client 