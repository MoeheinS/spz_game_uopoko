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
    //world.gravity.y = 0;

// create renderer
var reWi = pcWidth();
var reHi = pcHeight();
console.warn(reWi, reHi);

const ORB_SIZE = reHi*0.5/7/2;

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

/*
*   Actual physics objects
*/
/*
Uo Poko's original screen layout is 6.5 orbs wide, and about 15 orbs high
So let's see what 100vh x 50vh gives us
*/
var w_bot = buildRect(reWi*0.5, reHi, reWi, 2*ORB_SIZE, { 
  label: 'floor',
  isStatic: true,
  render: {
    //fillStyle: 'transparent'
  }
});
var w_top = buildRect(reWi*0.5, 0, reWi, 2*ORB_SIZE, { 
  label: 'ceiling',
  isStatic: true,
  render: {
    //fillStyle: 'transparent'
  }
});
var w_left = buildRect(reWi*0.25, reHi*0.5, 2*ORB_SIZE, reHi, {
  label: "wall",
  isStatic: true,
  render: {
    //fillStyle: 'transparent'
  }
});
var w_right_x = (reWi*0.25)+(6.5*2*ORB_SIZE)+(2*ORB_SIZE); //hold 6.5 orbs, and offset for half of both walls' width
var w_right = buildRect(w_right_x, (reHi*0.5)+(ORB_SIZE*3), 2*ORB_SIZE, reHi, {
  label: "wall",
  isStatic: true,
  chamfer: {
    radius: 20
  },
  render: {
    //fillStyle: 'transparent'
  }
});
var w_right_2 = buildRect(w_right_x+(4*ORB_SIZE), reHi*0.5, 2*ORB_SIZE, reHi, {
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
for (let debug_rows = 0; debug_rows < 6; debug_rows++) {
  for (let debug_orbs = 0; debug_orbs < 7; debug_orbs++) {
    World.add(world, buildCircle((reWi*0.5), (reHi-ORB_SIZE)-(ORB_SIZE*debug_rows*2), ORB_SIZE, {
      label: "ball"
    }));
  }
}
  
// invisible pusher(s)
var launcher_spot = w_right.position.x+ORB_SIZE+ORB_SIZE;
var launcher_hori = buildRect(launcher_spot, w_top.bounds.max.y+ORB_SIZE, 2*ORB_SIZE, 2*ORB_SIZE, {
  label: "pusher_left",
  isSensor: true,
  isStatic: true,
  render: {
    fillStyle: '#ff00ff33'
  }
});
var launcher_vert = buildRect(launcher_spot, w_bot.bounds.min.y-ORB_SIZE, 2*ORB_SIZE, 2*ORB_SIZE, {
  label: "pusher_up",
  isSensor: true,
  isStatic: true,
  render: {
    fillStyle: '#ff00ff33'
  }
});
World.add(world, [
  launcher_hori,
  launcher_vert
]);

// TODO recalc coords; base it off the rightmostwall?
// Things also get silly when widescreen, so the major calc-unit should be height-based

/*
*   Functions
*/
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
      break;
    default:
      console.log(e.key);
      break;
  }
});

/*
*   Lifecycle events
*/
Events.on(engine, 'beforeUpdate', function(event) {});

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