console.log('%cLoaded household functions','color:#ff0000;font-family:Comic Sans MS;');

function roll(die, faces, modifier){
  //TODO
  return 1;
}

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// equiv to Engine = Matter.Engine;
const { Bodies, Bounds, Body, Composite, Composites, Constraint, Engine, Events, MouseConstraint, Mouse, Render, Runner, Vector, World } = Matter;

function pcWidth(percentage){
  if(typeof(percentage) === 'number'){
    return window.innerWidth * percentage;
  }else{
    return window.innerWidth;
  }
}
function pcHeight(percentage){
  if(typeof(percentage) === 'number'){
    return window.innerHeight * percentage;
  }else{
    return window.innerHeight;
  }
}

function buildRect(x, y, width, height, options){
  return Bodies.rectangle(x, y, width, height, options);
}

function buildCircle(x, y, size, options){
  return Bodies.circle(x, y, size, options);
}

function pingBumper(bumper, color_og, color_new, reset_time) {
  //updateScore(currentScore + 10);
  bumper.render.fillStyle = color_new;
  setTimeout(function() {
    bumper.render.fillStyle = color_og;
  }, reset_time);
}

function stopBall(ball, bumper, og_bounce, og_inertia) {
  Body.setVelocity(ball, { x: 0, y: 0 });
  Body.setInertia(ball, 900000);
  bumper.restitution = 0;
  setTimeout(function() {
    bumper.restitution = og_bounce;
    Body.setInertia(ball, og_inertia);
  }, 100);
}

var staticOption = { isStatic: true };
var group = Body.nextGroup(true);

// create circles
// half-cup
//for(var i = 0; i < 45; i++) {
/*
// half-dome
for(var i = 45; i < 90; i++) {
  a = Bodies.rectangle(
    //last param controls width / height
    reWi / 2 + Math.cos(i * 4 * Math.PI / 180) * (reWi/2), 
    //half cup
    //reHi / 4 + Math.sin(i * 4 * Math.PI / 180) * (reWi/2), 
    //half dome
    reHi / 1.25 + Math.sin(i * 4 * Math.PI / 180) * (reWi/2), 
    40, 
    80, 
    {
      isStatic: true, 
      angle: Math.PI / 180 * i * 4,
      friction: 0,
      render: {
        fillStyle: "#ff0000",
        strokeStyle: "#fff",
        lineWidth: 0
      }
    }
  );
  World.add(world, a);
}
*/