console.log('%cUo Poko game','color:#ff0000;font-family:Comic Sans MS;');

/*  Table of Contents
*   Constants and settings
*   Actual physics objects
*   Functions
*   Lifecycle events
*   Rendering
*/

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

/*
*   Constants and settings
*/
Events.on(render, 'afterRender', function() {
  var ctx = render.context;

  Render.startViewTransform(render);

    ctx.font = '16px alber';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('v0.0.1', 100, 20);

  Render.endViewTransform(render);
});