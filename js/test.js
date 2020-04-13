console.log('%cWelcome. Welcome to papa`s house','color:#ff0000;font-family:Comic Sans MS;');

/*
  // if body is static, manually update velocity for friction to work
  var px = midPoint + ( midPoint * Math.sin(engine.timing.timestamp * 0.002) * 0.9 );
  //-1 to 1; console.log(Math.sin(engine.timing.timestamp*0.002));
  //Body.setVelocity(stackDropper, { y: 0, x: px - stackDropper.position.x });
  Body.setPosition(stackDropper, { y: 20, x: px });
*/
stackItem.friction = 1;
  stackItem.frictionAir = 0.5;

/*
*   Rendering
*/
Events.on(render, 'afterRender', function() {
  var context = render.context;

  Render.startViewTransform(render);

  context.beginPath();
  context.moveTo(0, reHi*0.3);
  context.lineTo(reWi, reHi*0.3);

  context.moveTo(0, reHi*0.6);
  context.lineTo(reWi, reHi*0.6);

  context.moveTo(0, reHi-40);
  context.lineTo(reWi, reHi-40);

  context.moveTo(stackDropper.position.x, stackDropper.position.y);
  context.lineTo(stackDropper.position.x, reHi);
  context.strokeStyle = '#555';
  context.lineWidth = 0.5;
  context.stroke();

  context.fillStyle = 'rgba(255,165,0,0.7)';
  context.fill();

  Render.endViewTransform(render);
  //render ocean at Composite.bounds(tower).max.y ?
});

// create walls and add them to the world
var w_bot_l = buildRect(0, reHi, reWi*0.75, reHi/10, staticOption);
var w_bot_r = buildRect(reWi, reHi, reWi*0.75, reHi/10, staticOption);
var w_top = buildRect(reWi*0.5, 0, reWi, reHi/10, staticOption);
var w_left = buildRect(0, reHi*0.5, reWi/10, reHi, staticOption);
var w_right = buildRect(reWi, reHi*0.5, reWi/10, reHi, staticOption);

World.add(world, [
  w_bot_l,
  w_bot_r,
  w_top,
  w_left,
  w_right
]);

var ballOptions = { 
  label: "pinball",
  //density: 0.015, 
  //frictionAir: 0.001, //0.01 def
  friction: 0.0005,
  restitution: 0.1,
  render: {
    fillStyle: '#ff0000',
    strokeStyle: '#006516',
    lineWidth: 3
  }
};
var pinball = buildCircle(reWi*0.71, reHi*(1/3), reHi/45, ballOptions);
const PINBALL_INERTIA = pinball.inertia;
World.add(world, [pinball]);

// CONSTS
const BUMPER_BOUNCE = 1.5;

// TODO create garbage collection zones and add them to the world

// collision events
Matter.Events.on(engine, 'collisionStart', function(event) {
  let pairs = event.pairs;
  pairs.forEach(function(pair) {
    console.log(pair.bodyA.label, pair.bodyB.label);
    if (pair.bodyB.label === 'pinball') {
      switch (pair.bodyA.label) {
        case 'reset':
          //launchPinball();
          break;
        case 'bumper':
          pingBumper(pair.bodyA, '#ff00ff', '#55ff00', 100);
          stopBall(pair.bodyB, pair.bodyA);
          break;
      }
    }else if (pair.bodyA.label === 'pinball') {
      switch (pair.bodyB.label) {
        case 'reset':
          //launchPinball();
          break;
        case 'bumper':
          pingBumper(pair.bodyB, '#ff00ff', '#55ff00', 100);
          stopBall(pair.bodyA, pair.bodyB, BUMPER_BOUNCE, PINBALL_INERTIA);
          break;
      }
    }
  });
});

// bumper generation
var stud_options = {
  density: 0.055,
  label: "bumper",
  render: {
    fillStyle: '#ff00ff',
    strokeStyle: '#006516',
    lineWidth: 2
  },
  isStatic: true
};
var stud_size = reHi/45;
function placeStud(x, y, size, bounce, options) {
  let bumper = buildCircle(x, y, size, options);
  bumper.restitution = bounce;
  World.add(world, bumper);
}

placeStud(reWi*0.7, reHi*(1/6), stud_size, BUMPER_BOUNCE, stud_options);
placeStud(reWi*0.3, reHi*(1/6), stud_size, BUMPER_BOUNCE, stud_options);
placeStud(reWi*0.7, reHi*(4/6), stud_size, BUMPER_BOUNCE, stud_options);
placeStud(reWi*0.3, reHi*(4/6), stud_size, BUMPER_BOUNCE, stud_options);
placeStud(reWi*0.6, reHi*(2/6), stud_size, BUMPER_BOUNCE, stud_options);
placeStud(reWi*0.4, reHi*(3/6), stud_size, BUMPER_BOUNCE, stud_options);

var rock = Bodies.polygon(pcWidth(0.5), pcHeight(0.9), 7, 80, { 
  chamfer: { radius: [0, 40, 0, 0, 0, 0, 10] },
  isStatic: true
});
rock.restitution = 1.5;
World.add(world, rock);

World.add(world, [
    buildRect(reWi*0.4125, reHi*(595/600), reWi/40, reHi*50/600, staticOption),
    buildRect(reWi*(1-0.4125), reHi*(595/600), reWi/40, reHi*50/600, staticOption),

    //Bodies.rectangle(reWi*0.5, reHi*(535/600), reWi/40, reHi*80/600, { isStatic: true, collisionFilter: { group: group } }),
    /*Bodies.circle(reWi*0.7, reHi*(1/4), reHi/24, { 
      density: 0.015, 
      render: {
        fillStyle: 'transparent',
        strokeStyle: '#006516',
        lineWidth: 2
      },
      label: "REPULSOR BALL",
      plugin: {
        attractors: [
          function(bodyA, bodyB) {
            return {
              x: (bodyB.position.x - bodyA.position.x) * 1e-4,
              y: (bodyB.position.y - bodyA.position.y) * 1e-4,
            };
          }
        ]
      }
    }),*/
    
    /*
    Constraint.create({ 
        bodyA: flipper_l, 
        pointB: Vector.clone(flipper_l.position),
        stiffness: 1,
        length: 0
    }),
    Constraint.create({ 
        bodyA: flipper_r, 
        pointB: Vector.clone(flipper_r.position),
        stiffness: 1,
        length: 0
    })
    */
]);

Body.rotate( w_left, Math.PI/24);
Body.rotate( w_right, -Math.PI/24);

var cannonRad = reHi/20;
var cannon = buildCircle(reWi*0.5, reHi*(1/12), cannonRad, 
  { 
    isStatic: true,
    isSensor: true,
    label: "cannon",
    render: {
      fillStyle: "#faa0f033"
    }
  });
World.add(world, [cannon]);
//rotate by PI = rotate half circle
Body.rotate( cannon, Math.PI/2);

document.addEventListener("keydown", function(e){
  console.log(e.keyCode);
  //90 & 37 ; left
  //88 & 39 ; right
  //67 ; c

  if(e.keyCode == 90 || e.keyCode == 37){
    // Body.setAngularVelocity( flipper_l, Math.PI/12);
    // Body.setAngularVelocity( flipper_r, -Math.PI/12);
    Body.rotate( cannon, Math.PI/18);
  }
  if(e.keyCode == 88 || e.keyCode == 39){
    // Body.setAngularVelocity( flipper_l, -Math.PI/12);
    // Body.setAngularVelocity( flipper_r, Math.PI/12);
    Body.rotate( cannon, -Math.PI/18);
  }
  if(e.keyCode == 67){
    //Body.setAngle( cannon, Vector.angle( cannon.position, mouse.position));
    Body.setPosition( pinball, cannon.position );

    var force = 0.1;
    var deltaVector = Vector.sub(mouse.position, cannon.position);
    var normalizedDelta = Vector.normalise(deltaVector);
    var forceVector = Vector.mult(normalizedDelta, force);
    Body.applyForce( pinball, pinball.position, forceVector);
  }

});

Events.on(render, 'afterRender', function() {
  var context = render.context,
      startPoint = cannon.position,
      endPoint = mouse.position;

  Render.startViewTransform(render);

  context.beginPath();
  context.moveTo(startPoint.x, startPoint.y);
  context.lineTo(endPoint.x, endPoint.y);
  context.strokeStyle = '#555';
  context.lineWidth = 0.5;
  context.stroke();

  context.fillStyle = 'rgba(255,165,0,0.7)';
  context.fill();

  Body.setAngle( cannon, Vector.angle( cannon.position, mouse.position));

  Render.endViewTransform(render);
});