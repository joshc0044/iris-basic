import * as d3 from 'd3';

import io from 'socket.io-client';
const socket =
    io('http://localhost:8001',
       {reconnectionDelay: 300, reconnectionDelayMax: 300});
const flower_type = require('./flower_type');
const d3UserFlowerContainer = d3.select('#d3_flower_stuff');

let lineGenerator = d3.line().curve(d3.curveCardinal);
let width = 300;
let height = 300;
//let flowerSvg = d3Container.append("svg").attr("width", width).attr("height", height);

let points = [
  [140, 100],
  [150, 270],
  [160, 300]
];

let pathData = lineGenerator(points);
let flowerIdCount = 0;
let statusDiv = document.getElementById('trainingStatus');

socket.on('got_flower_stuff', (flowerStuff) => {

	console.log('got_flower_stuff: ', flowerStuff);
/* 	// make dom elements here
	let flowerDivThing = document.createElement('div');
	flowerDivThing.setAttribute('id', 'flowerDivThing_' + flowerIdCount);
	// add stuff to main body
	document.body.appendChild(flowerDivThing);
	//statusDiv.insertAdjacentElement('beforeend', flowerDivThing);
	// make graphics here
	let flowerd3Container = d3.select('#flowerDivThing_' + flowerIdCount);
	let flowerSvg = flowerd3Container.append("svg").attr("width", width).attr("height", height);
	flowerSvg.append("path").attr('d', pathData).style("stroke", "rgb(103, 255, 0)").style("stroke-width", 2).style("fill", "darkolivegreen"); */

	flowerStuff.forEach(flower => {

		//console.log(flower);
		// make dom elements here
		let flowerDivThing = document.createElement('div');
		flowerDivThing.setAttribute('id', 'flowerDivThing_' + flowerIdCount);

		// creates a <table> element and a <tbody> element
		// https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Traversing_an_HTML_table_with_JavaScript_and_DOM_Interfaces
		let tbl = document.createElement("table");
		let tblBody = document.createElement("tbody");

		Object.entries(flower.xs).forEach((field, thing) => {
			// creates a table row
			let row = document.createElement("tr");
			// fill out fields in each row
			field.forEach(item => {
				let cell = document.createElement("td");
				let cellText = document.createTextNode(item);
				cell.appendChild(cellText);
				row.appendChild(cell);
			})
			//console.log('field: ', field);

			// add the row to the end of the table body
			tblBody.appendChild(row);
		})
		// add species to table
		let speciesRow = document.createElement("tr");

		let sCell = document.createElement("td");
		let sLabel = document.createElement("td");
		let sCellText = document.createTextNode(flower_type.flowerFromClassNum(flower.ys.species));
		let sLabelText = document.createTextNode('species');
		sCell.appendChild(sCellText);
		sLabel.appendChild(sLabelText);
		speciesRow.appendChild(sLabel);
		speciesRow.appendChild(sCell);
		tblBody.appendChild(speciesRow);
		// put the <tbody> in the <table>
		tbl.appendChild(tblBody);
		document.body.appendChild(tbl);
		// sets the border attribute of tbl to 2;
		tbl.setAttribute("border", "2");
		
		// add stuff to main body
		document.body.appendChild(flowerDivThing);
		//statusDiv.insertAdjacentElement('beforeend', flowerDivThing);
		// make graphics here
		let flowerd3Container = d3.select('#flowerDivThing_' + flowerIdCount);
		let d3Container = flowerd3Container.append("svg").attr("width", width).attr("height", height);
		flowerIdCount++;

		//stem part
		d3Container.append("path").attr('d', pathData).style("stroke", "rgb(103, 255, 0)").style("stroke-width", 2).style("fill", "darkolivegreen");

		let petalWidth = parseFloat(flower.xs.petal_width);
		//let petalWidth = parseFloat(flower.xs[3]);

		let petalLength = parseFloat(flower.xs.petal_length);
		//let petalLength = parseFloat(flower.xs[2]);

		let sepallWidth = parseFloat(flower.xs.sepal_width);
		//let sepallWidth = parseFloat(flower.xs[1]);

		let sepalLength = parseFloat(flower.xs.sepal_length);
		//let sepalLength = parseFloat(flower.xs[0]);
		
		let factorList = [petalLength, petalWidth, sepalLength, sepallWidth];
		let flowerMin = Math.min(...factorList);
		let flowerMax = Math.max(...factorList);
		let normlizedStuff = factorList.map(f => normalize(f, flowerMin, flowerMax));
		//console.log(factorList);

		let lengthFactor = 20 * normlizedStuff[0];
		//let lengthFactor = 20 * factorList[0];
		lengthFactor = lengthFactor === 0 ? 1 : lengthFactor;

		let widthFactor = 80 * normlizedStuff[1];
		//let widthFactor = 80 * factorList[1];
		widthFactor = widthFactor === 0 ? 1 : widthFactor;

		let sepalLenFactor = 20 * normlizedStuff[2];
		//let sepalLenFactor = 20 * factorList[2];
		sepalLenFactor = sepalLenFactor === 0 ? 1 : sepalLenFactor;

		let sepalWidFactor = 40 * normlizedStuff[3];
		//let sepalWidFactor = 40 * factorList[3];
		sepalWidFactor = sepalWidFactor === 0 ? 1 : sepalWidFactor;

		if(flowerMin === flowerMax) {
			lengthFactor = 10;
			widthFactor = 40;
			sepalLenFactor = 10;
			sepalWidFactor = 20;
		}
		var flowerPoints = [
			{angle: 0, r0: lengthFactor, r1: widthFactor},
			{angle: Math.PI * 0.25, r0: sepalLenFactor, r1: sepalWidFactor},
			{angle: Math.PI * 0.5, r0: lengthFactor, r1: widthFactor},
			{angle: Math.PI * 0.75, r0: sepalLenFactor, r1: sepalWidFactor},
			{angle: Math.PI, r0: lengthFactor, r1: widthFactor},
			{angle: Math.PI * 1.25, r0: sepalLenFactor, r1: sepalWidFactor},
			{angle: Math.PI * 1.5, r0: lengthFactor, r1: widthFactor},
			{angle: Math.PI * 1.75, r0: sepalLenFactor, r1: sepalWidFactor},
			{angle: Math.PI * 2, r0: lengthFactor, r1: widthFactor}
		];

		var radialAreaGenerator = d3.areaRadial()
		  .angle(function(d) {
			return d.angle;
		  })
		  .innerRadius(function(d) {
			return d.r0;
		  })
		  .outerRadius(function(d) {
			return d.r1;
		  });

		let flowerThing = radialAreaGenerator(flowerPoints);
		
		d3Container.append("g")
		.attr("transform", "translate(140, 85)")
		.append("path")
		.attr("d", flowerThing);
	})
		
});

socket.on('get_flower_stuff', (flowerStuff) => {
	//console.log('get_flower_stuff: ', flowerStuff);
	//console.log('get_flower_stuff sepal_length: ', flowerStuff.xs.sepal_length);
});

function makeFlower() {

	console.log('hello, making flower from user input');
	d3UserFlowerContainer.select("svg").remove();
	let d3Container = d3UserFlowerContainer.append("svg").attr("width", width).attr("height", height);
	// stem
	d3Container.append("path").attr('d', pathData).style("stroke", "rgb(103, 255, 0)").style("stroke-width", 2).style("fill", "darkolivegreen");

	let tempSL = document.getElementById('SEPAL_LENGTH_Input').innerText == 'n/a' ? 1 : document.getElementById('SEPAL_LENGTH_Input').innerText;
	let tempSW = document.getElementById('SEPAL_WIDTH_Input').innerText == 'n/a' ? 1 : document.getElementById('SEPAL_WIDTH_Input').innerText;
	let tempPL = document.getElementById('PETAL_LENGTH_Input').innerText == 'n/a' ? 1 : document.getElementById('PETAL_LENGTH_Input').innerText;
	let tempPW = document.getElementById('PETAL_WIDTH_Input').innerText == 'n/a' ? 1 : document.getElementById('PETAL_WIDTH_Input').innerText;
	let petalWidth = parseFloat(tempPW);
	let petalLength = parseFloat(tempPL);
	let sepallWidth = parseFloat(tempSW);
	let sepalLength = parseFloat(tempSL);
	
	let factorList = [petalLength, petalWidth, sepalLength, sepallWidth];
	let flowerMin = Math.min(...factorList);
	let flowerMax = Math.max(...factorList);
	let normlizedStuff = factorList.map(f => normalize(f, flowerMin, flowerMax));

	let lengthFactor = 20 * normlizedStuff[0];
	lengthFactor = lengthFactor === 0 ? 1 : lengthFactor;

	let widthFactor = 80 * normlizedStuff[1];
	widthFactor = widthFactor === 0 ? 1 : widthFactor;

	let sepalLenFactor = 20 * normlizedStuff[2];
	sepalLenFactor = sepalLenFactor === 0 ? 1 : sepalLenFactor;

	let sepalWidFactor = 40 * normlizedStuff[3];
	sepalWidFactor = sepalWidFactor === 0 ? 1 : sepalWidFactor;

	if(flowerMin === flowerMax) {
		lengthFactor = 10;
		widthFactor = 40;
		sepalLenFactor = 10;
		sepalWidFactor = 20;
	}

	var flowerPoints = [
		{angle: 0, r0: lengthFactor, r1: widthFactor},
		{angle: Math.PI * 0.25, r0: sepalLenFactor, r1: sepalWidFactor},
		{angle: Math.PI * 0.5, r0: lengthFactor, r1: widthFactor},
		{angle: Math.PI * 0.75, r0: sepalLenFactor, r1: sepalWidFactor},
		{angle: Math.PI, r0: lengthFactor, r1: widthFactor},
		{angle: Math.PI * 1.25, r0: sepalLenFactor, r1: sepalWidFactor},
		{angle: Math.PI * 1.5, r0: lengthFactor, r1: widthFactor},
		{angle: Math.PI * 1.75, r0: sepalLenFactor, r1: sepalWidFactor},
		{angle: Math.PI * 2, r0: lengthFactor, r1: widthFactor}
	];

	var radialAreaGenerator = d3.areaRadial()
	  .angle(function(d) {
		return d.angle;
	  })
	  .innerRadius(function(d) {
		return d.r0;
	  })
	  .outerRadius(function(d) {
		return d.r1;
	  });

	let flowerThing = radialAreaGenerator(flowerPoints);

	d3Container.append("g")
		.attr("transform", "translate(140, 85)")
		.append("path")
		.attr("d", flowerThing);
};

// util function to normalize a value between a given range.
function normalize(value, min, max) {
	if (min === undefined || max === undefined) {
	  return value;
	}
	return (value - min) / (max - min);
  }
  
export {
    makeFlower,
    d3UserFlowerContainer
};