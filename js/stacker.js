console.log('%cStacker game','color:#ff0000;font-family:Comic Sans MS;');

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
if( window.localStorage.getItem('stackerScore') ){
  hiscore_global = window.localStorage.getItem('stackerScore');
}
let score_global = 0;
let gamestate = 'running';
let renderStack = [];
let waterLevel = 0;

const DROPRATE = 25;
const RAISE_RATE = 10;
const BASE_SCORE = 1000;
const GRAVITY = 0.75;
const RENDER_RATE = 6; //used to determine how long the points stay on canvas

const COLOR_STACKED = '#795548';
const COLOR_GOAL = '#207828';
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

var render = Render.create({
    element: document.querySelector('.container__Matter'),
    engine: engine,
    options: {
        width: reWi,
        height: reHi,
        wireframes: false,
        //showAngleIndicator: true,
        //showCollisions: true,
        //showVelocity: true,
        hasBounds: true   
    }
});
Render.run(render);

// create runner
var runner = Runner.create();
Runner.run(runner, engine);

// fit the render viewport to the scene
Render.lookAt(render, {
    min: { x: 0, y: 0 },
    max: { x: reWi, y: reHi }
});

world.gravity.y = GRAVITY;
world.bounds.min.y = -1000;

/*
*   Actual physics objects
*/
var w_bot = buildRect(reWi*0.5, reHi, reWi, reHi/10, { 
  label: 'floor',
  isStatic: true,
  render: {
    //fillStyle: 'transparent'
  }
});
var w_left = buildRect(0, reHi*0.5, reWi/10, reHi, {
  label: "wall",
  isStatic: true,
  render: {
    fillStyle: 'transparent'
  }
});
var w_right = buildRect(reWi, reHi*0.5, reWi/10, reHi, {
  label: "wall",
  isStatic: true,
  render: {
    fillStyle: 'transparent'
  }
});
World.add(world, [
  w_bot,
  w_left,
  w_right
]);

var stackDropper = buildRect(reWi*0.5, 20, reWi*0.75, 20, {
  label: "stackDropper",
  isSensor: true,
  render: {
    fillStyle: '#c0ffc0'
  },
  canDrop: true //custom property
});
World.add(world, [stackDropper]);

var rock = Bodies.polygon(reWi*0.5, pcHeight(0.9), 7, 80, { 
  chamfer: { radius: [0, 40, 0, 0, 0, 0, 10] },
  isStatic: true,
  label: 'validGoal'
});
World.add(world, rock);
var tower = Composite.create();
Composite.add(tower, rock);
Composite.add(tower, w_bot);
World.add(world, tower);

/*
*   Functions
*/
//drop a brick
function dropItem() {
  dropperState(false);
  World.add(world, buildRect(stackDropper.position.x, 20, (stackDropper.bounds.max.x - stackDropper.bounds.min.x), 30, { label: "stackItem" }));
}

//brick dropping allowed?
function dropperState(allow) {
  stackDropper.canDrop = allow;
  if(allow){
    stackDropper.render.fillStyle = '#c0ffc0';
  }else{
    stackDropper.render.fillStyle = '#ffc0c0';
  }
}

//stackItem touches floor; game over. stackItem touches stackedItem, make it static and re-label it as stackedItem
function collisionHandler(stackItem, bodyB){
  switch (bodyB.label) {
    case 'validGoal':
      stopAndScore(stackItem, bodyB);
      break;
    case 'stackedItem':
    case 'floor':
      gameOver();
      break;
  }
}


function scoreStackItem(score, position){
  this.score = score;
  this.position = position;
  this.life = COLOR_SHIFT.length * RENDER_RATE;
}
function stopAndScore(stackItem, bodyB) {
  stackItem.render.fillStyle = COLOR_GOAL;
  stackItem.label = 'validGoal';
  Body.setStatic(stackItem, true);

  bodyB.render.fillStyle = COLOR_STACKED;
  bodyB.label = 'stackedItem';

  var dropScore = BASE_SCORE;
  var diff = 0;
  var scorePoints;
  var goalWidth = bodyB.bounds.max.x - bodyB.bounds.min.x;
  var stackWidth = stackItem.bounds.max.x - stackItem.bounds.min.x;
  if( goalWidth >= stackWidth ){
    if( stackItem.bounds.max.x >= bodyB.bounds.max.x ){//too far to the right
      diff = stackItem.bounds.max.x - bodyB.bounds.max.x;
    }else if( stackItem.bounds.min.x <= bodyB.bounds.min.x ){//too far to the left
      diff = bodyB.bounds.min.x - stackItem.bounds.min.x;
    }
    scorePoints = (1-(diff/goalWidth)) * dropScore;
  }else{
    scorePoints = dropScore;
  }
  score_global += scorePoints;
  renderStack.push( new scoreStackItem(scorePoints, stackItem.position) );
  hiScore(Math.floor(score_global));

  tower_grow(stackItem);

  var dropDistance = (1-(diff/goalWidth)) * DROPRATE;
  moveCamera(dropDistance);
  if( dropDistance > 22 ){
    waterLevel -= 25-dropDistance;
  }

  var scaling = Math.random() * (0.99 - 0.95) + 0.95;
  Body.scale(stackDropper, scaling, 1);
}

function tower_grow(stackItem) {
  Composite.add(tower, stackItem);
}
function moveCamera(dropDistance) {
  Composite.translate(tower, {x:0, y: dropDistance});
}
function doomClock() {
  if( ( Composite.bounds(tower).max.y - Composite.bounds(tower).min.y -70 -waterLevel ) < 0 ){
    gameOver();
  }
}

function gameOver() {
  World.remove(world, [stackDropper]);
  gamestate = 'over';
  hiScore(Math.floor(score_global));
}

function hiScore(currentScore) {
  if( currentScore >= hiscore_global ){
    hiscore_global = currentScore;
    if( gamestate == 'over' ){
      console.warn('new highscore');
      window.localStorage.setItem('stackerScore', currentScore);
    }
  }
}

document.addEventListener("keydown", function(e){
  switch (e.key) {
    case 'c':
      if( stackDropper.canDrop ){
        dropItem();
        if( tutorial.length ){
          tutorial.shift();
        }
      }
      break;
    case 'r':
      location.reload();
      break;
    case 'ArrowUp':
      Composite.translate(tower, {x:0, y: 100});
      break;
    case 'ArrowDown':
      Composite.translate(tower, {x:0, y: -100});
      break;
    default:
      console.log(e.key);
      break;
  }
});

/*
*   Lifecycle events
*/
var counter = 0;
var midPoint = reWi * 0.5;
Events.on(engine, 'beforeUpdate', function(event) {
  counter++;
  var px = midPoint + ( midPoint * Math.sin(engine.timing.timestamp * 0.002) * 0.9 );
  //-1 to 1; console.log(Math.sin(engine.timing.timestamp*0.002));
  Body.setPosition(stackDropper, { y: 20, x: px });

  if( counter >= RAISE_RATE ){
    counter = 0;
    waterLevel++;
    doomClock();
  }
});

Events.on(engine, 'collisionStart', function(event) {
  for( pair of event.pairs ){
    //console.log(pair.bodyA.label, pair.bodyB.label);
    //resetting "a" and "b"
    if( pair.bodyA.label === 'stackItem' ){
      collisionHandler(pair.bodyA, pair.bodyB);
    }else if( pair.bodyB.label === 'stackItem' ){
      collisionHandler(pair.bodyB, pair.bodyA);
    }
    if(( pair.bodyA.label === 'stackDropper' && pair.bodyB.label === 'wall' ) || ( pair.bodyB.label === 'stackDropper' && pair.bodyA.label === 'wall' )){
      dropperState(false);
    }
  }
});

Events.on(engine, 'collisionEnd', function(event) {
  for( pair of event.pairs ){
    //console.log(pair.bodyA.label, pair.bodyB.label);
    //resetting "a" and "b"
    if(( pair.bodyA.label === 'stackDropper' && pair.bodyB.label === 'wall' ) || ( pair.bodyB.label === 'stackDropper' && pair.bodyA.label === 'wall' )){
      dropperState(true);
    }
  }
});

/*
*   Rendering
*/
var tutorial = [
  'Press C to drop a block',
  'Press R to restart',
  'Arrow keys move the camera',
  'Accuracy scores more points',
  'Good luck...'
]

Events.on(render, 'afterRender', function() {
  var ctx = render.context;
  let towerBottom = Composite.bounds(tower).max.y - 100;

  Render.startViewTransform(render);

  if( gamestate == 'running' ){

      if( tutorial.length ){
        ctx.font = '3rem alber';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(tutorial[0], reWi*0.5, reHi*0.5);
      }
      if( renderStack.length ){
        renderScore = renderStack[0];
        if( renderScore.life ){
          ctx.font = '2rem alber';
          ctx.textAlign = 'center';
          ctx.fillStyle = COLOR_SHIFT[Math.floor(renderScore.life/RENDER_RATE)];
          ctx.fillText(Math.floor(renderScore.score), renderScore.position.x, 
            renderScore.position.y-20-((COLOR_SHIFT.length * RENDER_RATE)-renderScore.life));
          renderScore.life--
        }else{
          renderStack.pop();
        }
      }
      
      //drop guide
      ctx.fillStyle = '#ffffff11';
      ctx.fillRect(stackDropper.bounds.min.x, stackDropper.bounds.min.y, (stackDropper.bounds.max.x - stackDropper.bounds.min.x), reHi);

    }else if( gamestate == 'over' ){

      ctx.font = '3rem alber';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('GAME OVER', reWi*0.5, reHi*0.5);
      ctx.font = '2rem alber';
      ctx.fillText('Press R to play again', reWi*0.5, (reHi*0.5)+28);

    }

    ctx.font = '16px alber';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('v0.4.1', 100, 20);
    ctx.fillText('Score: '+Math.floor(score_global), reWi*0.5, 20);
    ctx.fillText('Best: '+Math.floor(hiscore_global), reWi-100, 20);

    //ocean
    ctx.strokeStyle = '#11027cde';
    ctx.fillStyle = '#11027cde';
    ctx.fillRect(0, towerBottom-waterLevel, reWi, reHi*10);

  Render.endViewTransform(render);
});