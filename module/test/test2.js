var myMod = require('./../index.js');  
var p1 = {x:1, y:1};  
var p2 = {x:4, y:5};  
var dist1 = myMod.dist(p1, p2);  
console.log("Distance between: ", p1, " and ", p2, " is:", dist1);
