var ctx2 = document.getElementById('cv');
var context2 = ctx2.getContext('2d');
context2.beginPath();
context2.arc(230, 148, 131, 0, 2 * Math.PI);
context2.rect(460, 0, -460, 345);
context2.fillStyle = "rgba(0,0,0,1.0)";
context2.fill('evenodd');
