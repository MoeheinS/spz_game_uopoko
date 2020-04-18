console.log('%cUo Poko game','color:#ff0000;font-family:Comic Sans MS;');

/*  Table of Contents
*   Constants and settings
*   Actual physics objects
*   Functions
*   Lifecycle events
*   Rendering
*/

/*
*   Constants and settings
*/
let hiscore_global = 0;
if( window.localStorage.getItem('uopokoScore') ){
  hiscore_global = window.localStorage.getItem('uopokoScore');
}
let score_global = 0;
let gamestate = 'running';
let game_debug = true;

const BASE_SCORE = 1000; //for popping orbs
const GRAVITY = 2;

//const COLOR_STACKED = '#795548';
const COLOR_SHIFT = [
  '#7f7f7f',//grey
  '#ff0000',//red
  '#00ff00',//green
  '#ffff00',//yellow
  '#0000ff',//blue
  '#ff00ff',//fuchsia
  '#00ffff',//aqua
  '#ffffff'//white
];

// create engine
var engine = Engine.create(),
    world = engine.world;

// create renderer
var reWi = pcWidth();
var reHi = pcHeight();
console.warn(reWi, reHi);

const ORB_SIZE = reHi/14;

var render = Render.create({
    element: document.querySelector('.container__Matter'),
    engine: engine,
    options: {
        width: reWi,
        height: reHi,
        wireframes: false,
        showAngleIndicator: true,
        showCollisions: true,
        showVelocity: true,
        hasBounds: true
    }
});
Render.run(render);

// create runner
var runner = Runner.create();
Runner.run(runner, engine);

// add mouse control
// TODO add collision filtering for the invisible pushers?
var mouse = Mouse.create(render.canvas),
mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.6,
        render: {
            visible: true
        }
    }
});
World.add(world, mouseConstraint);
// keep the mouse in sync with rendering
render.mouse = mouse;

// fit the render viewport to the scene
Render.lookAt(render, {
    min: { x: 0, y: 0 },
    max: { x: reWi, y: reHi }
});

world.gravity.y = GRAVITY;
engine.enableSleeping = true;

/*
*   Actual physics objects
*/
/*
Uo Poko's original screen layout is 6.5 orbs wide, and about 15 orbs high
So let's see what 100vh x 50vh gives us
Maybe start passing width as a custom parameter, because I can't just call it without having to calc bounds
*/
var w_bot = buildRect(reWi*0.5, reHi, reWi, ORB_SIZE, { 
  label: 'floor',
  isStatic: true,
  render: {
    //fillStyle: 'transparent'
  }
});
var w_top = buildRect(reWi*0.5, 0, reWi, ORB_SIZE, { 
  label: 'ceiling',
  isStatic: true,
  render: {
    //fillStyle: 'transparent'
  }
});
var w_right_2 = buildRect(reWi, reHi*0.5, ORB_SIZE, reHi, {
  label: "wall",
  isStatic: true,
  render: {
    //fillStyle: 'transparent'
  }
});
var w_right = buildRect(w_right_2.bounds.min.x-(1.5*ORB_SIZE), (reHi*0.5)+(ORB_SIZE*1.5), ORB_SIZE, reHi, {
  label: "wall",
  isStatic: true,
  chamfer: {
    radius: 20
  },
  render: {
    //fillStyle: 'transparent'
  }
});
var w_left = buildRect(w_right.bounds.min.x-(7*ORB_SIZE), reHi*0.5, ORB_SIZE, reHi, {
  label: "wall",
  isStatic: true,
  render: {
    //fillStyle: 'transparent'
  }
});


World.add(world, [
  w_bot,
  w_top,
  w_left,
  w_right,
  w_right_2
]);

// orbs
var orb_types = [
  ['#7f7f7f','grey'],
  ['#ff0000','red'],
  ['#00ff00','green'],
  ['#ffff00','yellow'],
  ['#0000ff','blue'],
  ['#ff00ff','fuchsia'],
  ['#00ffff','aqua'],
  ['#ffffff','white']
];
var debug_rows = 6;
for (let debug_rows = 0; debug_rows < 5; debug_rows++) {
  for (let debug_orbs = 0; debug_orbs < 6; debug_orbs++) {
    World.add(world, makeOrb(
      w_right.bounds.min.x-(debug_orbs*ORB_SIZE)-(Math.floor((debug_rows%2)*0.5*ORB_SIZE))-0.5*ORB_SIZE, 
      w_bot.bounds.min.y-(0.5*ORB_SIZE)-(0.85*ORB_SIZE*debug_rows),
      'worldOrb'
    ));
  }
}
  
// invisible pusher(s)
// my inital plan was to have the hori pusher have variable force
// but now i realize i should have a vert down-pusher that moves left/right & resets
// mouse-drag anywhere on the right lane to move the down-pusher. Render draw a guide line

// !! label them all as pusher, set angles on them, and apply velocity in the angle direction??
var launcher_spot = w_right.position.x+ORB_SIZE;
var pusher_left = buildRect(launcher_spot, w_top.position.y+ORB_SIZE, ORB_SIZE, ORB_SIZE, {
  label: "pusher_left",
  isSensor: true,
  isStatic: true,
  render: {
    fillStyle: '#ff00ff33'
  }
});
var pusher_up = buildRect(launcher_spot, w_bot.position.y-ORB_SIZE, ORB_SIZE, ORB_SIZE, {
  label: "pusher_up",
  isSensor: true,
  isStatic: true,
  render: {
    fillStyle: '#ff00ff33'
  }
});
var pusher_down_initial_x = launcher_spot-2*ORB_SIZE;
var pusher_down = buildRect(pusher_down_initial_x, w_top.position.y+ORB_SIZE, ORB_SIZE, ORB_SIZE, {
  label: "pusher_down",
  isSensor: true,
  isStatic: true,
  render: {
    fillStyle: '#ff00ff33'
  },
  activated: false, //determines movement
  activatable: true
});
World.add(world, [
  pusher_left,
  pusher_up,
  pusher_down
]);

var stopper = buildRect(launcher_spot, w_bot.position.y-(2*ORB_SIZE), ORB_SIZE, ORB_SIZE, {
  label: "stopper",
  isStatic: true,
  render: {
    fillStyle: '#ff0000'
  }
});
World.add(world, [stopper]);

// TODO recalc coords; base it off the rightmostwall?
// Things also get silly when widescreen, so the major calc-unit should be height-based

/*
*   Functions
*/
// go to sleep
window.setTimeout(function(){
  //petrify('worldOrb', null, true);
}, 500);

function sleepRay(){
  var bods = Composite.allBodies(world);
  for( bod of bods ){
    if(bod.label == 'worldOrb'){
      Sleeping.set(bod, true);
    }
  }
}

//label, target, boolean
function petrify(label, t, boo){
  if(label){
    var bods = Composite.allBodies(world);
    for( bod of bods ){
      if(bod.label == label){
        Body.setStatic(bod, boo);
        if(!boo){
          Sleeping.set(bod, true);
        }
      }
    }
  }else if(t){
    Body.setStatic(t, boo);
    if(!boo){
      Sleeping.set(t, true);
    }
  }
}

function resetLauncher(){
  Body.setPosition(pusher_down, { y: pusher_down.position.y, x: pusher_down_initial_x });
  Body.setVelocity(pusher_down, { y: 0, x: 0 });
  pusher_down.activatable = true;
  Body.setPosition(stopper, { y: pusher_up.position.y-ORB_SIZE, x: pusher_up.position.x });
}

function makeOrb(px, py, label){
  var rolledOrbType = Math.floor(Math.random()*orb_types.length);
  return buildCircle(px, py, 0.5*ORB_SIZE, {
    label: label,
    custom: {
      type: orb_types[rolledOrbType][0]
    },
    render: {
      fillStyle: orb_types[rolledOrbType][1]
    }
  });
}

function launchOrb(){
  // spring tension builds as the launcher button is held
  // basically the curver brick moves away until it can't no more
  // then catapult the orb
  // STUB
  Body.setPosition(stopper, { y: pusher_up.position.y-ORB_SIZE, x: pusher_up.position.x });
  launchedOrb = makeOrb(launcher_spot, w_bot.position.y-(3*ORB_SIZE), 'launchedOrb');
  World.add(world, launchedOrb);
}
launchOrb();

function collisionHandler(bodyA, bodyB){
  switch (bodyB.label) {
    //case 'worldOrb':
      // STUB
      //break;
    case 'pusher_up':
      Body.setVelocity(bodyA, { y: -ORB_SIZE, x: 0 });
      break;
    case 'pusher_down':
      console.warn('%cdown','color:#ff0000;font-family:Comic Sans MS;');
      break;
    case 'pusher_left':
      Body.setPosition(bodyA, bodyB.position);
      Body.setVelocity(bodyA, { y: 0, x: -ORB_SIZE });
      break;
    default:
      break;
  }
}

function dropHandler(bodyA, bodyB){
  switch (bodyB.label) {
    case 'worldOrb':
      console.warn(bodyA.custom.type, bodyB.custom.type);
      bodyA.label = 'worldOrb';
      // iterate over the collision pairs in the world, 
      // get the ID of bodyA, and see if it's in a chain of 3+ same-colored
      // if so, pop-em
      break;
    default:
      break;
  }
}

function dropOrb(){
  var fallingOrb = makeOrb(pusher_down.position.x, pusher_down.position.y, 'fallingOrb');
  fallingOrb.custom.type = launchedOrb.custom.type;
  fallingOrb.render.fillStyle = launchedOrb.render.fillStyle;
  var rolledOrbType = Math.floor(Math.random()*orb_types.length);
  launchedOrb.custom.type = orb_types[rolledOrbType][0];
  launchedOrb.render.fillStyle = orb_types[rolledOrbType][1];
  World.add(world, fallingOrb);
  resetLauncher();
}

// keydown to move curver brick, keyup to launch orb?
document.addEventListener("keydown", function(e){
  switch (e.key) {
    case 'ArrowDown':
      if(pusher_down.activatable){
        pusher_down.activated = true;
      }
      break;
    case 's':
      sleepRay();
      break;
    case 'd':
      game_debug = !game_debug;
      break;
    case 'o':
      petrify('worldOrb', null, true);
      break;
    case 'p':
      petrify('worldOrb', null, false);
      break;
    case 'r':
      resetLauncher();
      break;
    default:
      console.log(e.key);
      break;
  }
});

document.addEventListener("keyup", function(e){
  switch (e.key) {
    case 'ArrowDown':
      pusher_down.activatable = false;
      pusher_down.activated = false;
      Body.setPosition(stopper, { y: pusher_up.position.y+ORB_SIZE, x: pusher_up.position.x });
      break;
    default:
      console.log(e.key);
      break;
  }
});

/*
*   Lifecycle events
*/
Events.on(engine, 'beforeUpdate', function(event) {
  if(pusher_down.activated){
    if( pusher_down.bounds.min.x > w_left.bounds.max.x ){
      Body.setPosition(pusher_down, { y: pusher_down.position.y, x: pusher_down.position.x-(ORB_SIZE/10) });
      Body.setVelocity(pusher_down, { y: 0, x: 0 });
    }else{
      Body.setPosition(pusher_down, { y: pusher_down.position.y, x: w_left.position.x+ORB_SIZE });
      Body.setVelocity(pusher_down, { y: 0, x: 0 });
    }
  }
});

Events.on(engine, 'collisionStart', function(event) {
  for( pair of event.pairs ){
    //console.log(pair.bodyA.label, pair.bodyB.label);
    //resetting "a" and "b"
    if( pair.bodyA.label === 'launchedOrb' ){
      collisionHandler(pair.bodyA, pair.bodyB);
    }else if( pair.bodyB.label === 'launchedOrb' ){
      collisionHandler(pair.bodyB, pair.bodyA);
    }

    if( pair.bodyA.label === 'fallingOrb' ){
      dropHandler(pair.bodyA, pair.bodyB);
    }else if( pair.bodyB.label === 'fallingOrb' ){
      dropHandler(pair.bodyB, pair.bodyA);
    }
  }
});

/*
*   Rendering
*/
var tutorial = [
  'STUB'
]

var stopCounter = 0;
Events.on(render, 'afterRender', function() {
  var ctx = render.context;

  Render.startViewTransform(render);

    ctx.font = '16px alber';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('v0.0.1', 100, 20);

    //drop guide
    ctx.fillStyle = '#ffffff11';
    ctx.fillRect(pusher_down.bounds.min.x, pusher_down.bounds.min.y, ORB_SIZE, reHi);

    //debug state rendering
    if(game_debug){
      ctx.font = '10px alber';
      ctx.fillStyle = '#000000';
      var bods = Composite.allBodies(world);
      for( bod of bods ){
        ctx.fillText(`vel:${bod.velocity.x.toFixed(2)};${bod.velocity.y.toFixed(2)}`, bod.position.x, bod.position.y-12);
        ctx.fillText(bod.label, bod.position.x, bod.position.y);
        ctx.fillText('slp:'+bod.isSleeping, bod.position.x, bod.position.y+12);
        ctx.fillText('stt:'+bod.isStatic, bod.position.x, bod.position.y+24);
      }
    }

    // alternatively launchedOrb can be a permanent, which creates a worldOrb clone when stopped
    // and then teleports back to the launcher
    if(launchedOrb){
      // SOMETHING broke the collision detection on pusher_down, hence this hack
      if(launchedOrb.position.x <= pusher_down.position.x && pusher_down.activated == false ){
        Body.setPosition(launchedOrb, {x: stopper.position.x, y: w_bot.position.y-(3*ORB_SIZE)});
        Body.setVelocity(launchedOrb, { y: 0, x: 0 });
        dropOrb();
      }
      /*
      if(launchedOrb.velocity.x <= 0.1 && launchedOrb.velocity.y <= 0.1 && launchedOrb.position.x < w_right.position.x ){
        stopCounter++;
        if(stopCounter >= 10){
          stopCounter = 0;
          //petrify(null, launchedOrb, true);
          launchedOrb.label = 'worldOrb';
        }
      }
      */
    }

  Render.endViewTransform(render);
});