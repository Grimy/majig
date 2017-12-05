
function crits(cc, cd) {
	result = Math.exp(cc * Math.log(cd));
	console.log(cc, cd, result);
}

crits(0.5, 2);
crits(0.5, 3);
crits(0.5, 4);
crits(0.5, 5);
crits(0.5, 10);
crits(0.6, 10);
crits(0.7, 10);
crits(0.8, 10);
crits(0.9, 10);
crits(0.99, 10);
crits(1, 10);
