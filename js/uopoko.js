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
var debug_rows = 6;
for (let debug_rows = 0; debug_rows < 9; debug_rows++) {
  for (let debug_orbs = 0; debug_orbs < 6; debug_orbs++) {
    World.add(world, 
      buildCircle(
        w_right.bounds.min.x-(debug_orbs*ORB_SIZE)-(Math.floor((debug_rows%2)*0.5*ORB_SIZE))-0.5*ORB_SIZE, 
        reHi-(ORB_SIZE)-(ORB_SIZE*debug_rows), 
        0.5*ORB_SIZE, {
          label: "ball"
          //isStatic: true
        }
      )
    );
  }
}
  
// invisible pusher(s)
// my inital plan was to have the hori pusher have variable force
// but now i realize i should have a vert down-pusher that moves left/right & resets
// mouse-drag anywhere on the right lane to move the down-pusher. Render draw a guide line
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

// TODO recalc coords; base it off the rightmostwall?
// Things also get silly when widescreen, so the major calc-unit should be height-based

/*
*   Functions
*/
// go to sleep
window.setTimeout(function(){
  sleepRay();
}, 500);
function sleepRay(){
  var bods = Composite.allBodies(world);
  for( bod of bods ){
    if(bod.label == 'ball'){
      Sleeping.set(bod, true);
    }
  }
}

function resetLauncher(){
  Body.setPosition(pusher_down, { y: pusher_down.position.y, x: pusher_down_initial_x });
  Body.setVelocity(pusher_down, { y: 0, x: 0 });
  pusher_down.activatable = true;
}

function launchOrb() {
  // spring tension builds as the launcher button is held
  // basically the curver brick moves away until it can't no more
  // then catapult the orb
  // STUB
}

function collisionHandler(stackItem, bodyB){
  switch (bodyB.label) {
    case 'worldOrb':
      // STUB
      break;
    default:
      break;
  }
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
      console.log('sproing!');
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
  }
});

/*
*   Rendering
*/
var tutorial = [
  'STUB'
]

Events.on(render, 'afterRender', function() {
  var ctx = render.context;

  Render.startViewTransform(render);

    ctx.font = '16px alber';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('v0.0.1', 100, 20);

  Render.endViewTransform(render);
});