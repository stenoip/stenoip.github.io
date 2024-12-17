// Objetos
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body; // Corazón, contiene los metodos de inicio
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;

var world;
var scale = 30; // 30 pixeles en el canvas equivalen a 1 metro
function init() {
    // Configuracion del mundo Box2d que realizará la mayor parte del cálculo
    var gravity = new b2Vec2(0, 9.8); // Declara la gravedar como 9.8. Se puede fijar a 0 si no necesita gravedad
    var allowSleep = true; // Permite a los objetos estar en reposo

    world = new b2World(gravity, allowSleep);

    createFloor();
    //Crear algunos cuerpos 
    createRectangularBody();
    createCircularBody();
    createSimplePolyonBody();
    //Crear un cuerpo combinado de dos formas
    createComplexBody();
    //Unir dos cuerpos mediante un joint
    createRevoluteJoint();
    //Crear un cuerpo con datos especiales
    createSpecialBody();

    //Crear contact listener y registar los eventos
    listenForContact();

    setupDebugDraw();
    animate(); // 105 
}

var timeStep = 1 / 60;
// La iteraccion sugerida para Box2D es 8 para velocidad y 3 para posicion
var velocityIterations = 8;
var positionIterations = 3;

function animate() {
    world.Step(timeStep, velocityIterations, positionIterations);
    world.ClearForces();

    world.DrawDebugData();

    //Dibujo personalizado
    if(specialBody){
        drawSpecialBody();
    }

    //Matar Special body si muere
    if (specialBody && specialBody.GetUserData().life <= 0) {
        world.DestroyBody(specialBody);
        specialBody = undefined;
        console.log("The special body was destroyed");
    }

    setTimeout(animate, timeStep);
}

function createFloor() {
    // Una deficnicion body que tiene todos los datos necesarios para contruir un cuerpo rigido 
    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.position.x = 640 / 2 / scale;
    bodyDef.position.y = 450 / scale;

    //VARIABLE SCALE PARA CONVERTIR DE METROS A PIXELES

    // Un accesorio se utiliza para unir una forma a un cuerpo para la deteccion de colision
    // La deficion de un accesorio se utiliza para crear un fixture 
    var fixtureDef = new b2FixtureDef;
    fixtureDef.density = 1.0; // Peso del cuerpo
    fixtureDef.friction = 0.5; // El cuerpo escurre de forma realista
    fixtureDef.restitution = 0.2; // Que el cuerpo rebote (0 nada y 1 muy elástica)

    fixtureDef.shape = new b2PolygonShape;
    fixtureDef.shape.SetAsBox(320 / scale, 10 / scale); // 640 de ancho por 20 de alto
    // Escala variable para crear de pixeles a metros 

    var body = world.CreateBody(bodyDef);
    var fixture = body.CreateFixture(fixtureDef);

}

var context;
function setupDebugDraw() {
    context = document.getElementById('canvas').getContext('2d');

    var debugDraw = new b2DebugDraw();

    //Utilizar este contexto para dibujar la pantalla de depuracion
    debugDraw.SetSprite(context);
    // Fijar la escala
    debugDraw.SetDrawScale(scale);
    // Rellenar las cajas con transparencia de 0.3
    debugDraw.SetFillAlpha(0.3);
    //Dibujar lineas con espesor 1 
    debugDraw.SetLineThickness(1.0);
    // Mostrar todas las formas y uniones
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);

    //Empezar a utilizar el dibujo de depuracion en el mundo
    world.SetDebugDraw(debugDraw);
}

function createRectangularBody() {

    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 40 / scale;
    bodyDef.position.y = 100 / scale;

    var fixtureDef = new b2FixtureDef;
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.5;
    fixtureDef.restitution = 0.3;

    fixtureDef.shape = new b2PolygonShape;
    fixtureDef.shape.SetAsBox(30 / scale, 50 / scale);

    var body = world.CreateBody(bodyDef);
    var fixture = body.CreateFixture(fixtureDef);
}

function createCircularBody() {
    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 130 / scale;
    bodyDef.position.y = 100 / scale;

    var fixtureDef = new b2FixtureDef;
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.5;
    fixtureDef.restitution = 0.7;

    fixtureDef.shape = new b2CircleShape(30 / scale);

    var body = world.CreateBody(bodyDef);
    var fixture = body.CreateFixture(fixtureDef);
}

function createSimplePolyonBody() {
    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 230 / scale;
    bodyDef.position.y = 50 / scale;

    var fixtureDef = new b2FixtureDef;
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.5;
    fixtureDef.restitution = 0.2;

    fixtureDef.shape = new b2PolygonShape;
    //Crear un array de puntos b2Vec2 en la direccion de las agujas del reloj
    var points = [
        new b2Vec2(0, 0),
        new b2Vec2(40 / scale, 50 / scale),
        new b2Vec2(50 / scale, 100 / scale),
        new b2Vec2(-50 / scale, 100 / scale),
        new b2Vec2(-40 / scale, 50 / scale),
    ];

    //Usar SetAsArray para definir la forma utilizando el array de puntos.
    fixtureDef.shape.SetAsArray(points, points.length);

    var body = world.CreateBody(bodyDef);

    var fixture = body.CreateFixture(fixtureDef);
}

function createComplexBody() {
    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 350 / scale;
    bodyDef.position.y = 50 / scale;
    var body = world.CreateBody(bodyDef);

    //Crear el primer accesorio y añdir una forma circular al cuerpo
    var fixtureDef = new b2FixtureDef;
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.5;
    fixtureDef.restitution = 0.7;
    fixtureDef.shape = new b2CircleShape(40 / scale);
    body.CreateFixture(fixtureDef);

    //Crear el segundo accesorio y añadir una forma poligonal al cuerpo
    fixtureDef.shape = new b2PolygonShape;
    var points = [
        new b2Vec2(0, 0),
        new b2Vec2(40 / scale, 50 / scale),
        new b2Vec2(50 / scale, 100 / scale),
        new b2Vec2(-50 / scale, 100 / scale),
        new b2Vec2(-40 / scale, 50 / scale),
    ];

    fixtureDef.shape.SetAsArray(points, points.length);
    body.CreateFixture(fixtureDef);
}

function createRevoluteJoint() {
    //Definir el primer cuerpo
    var bodyDef1 = new b2BodyDef;
    bodyDef1.type = b2Body.b2_dynamicBody;
    bodyDef1.position.x = 480 / scale;
    bodyDef1.position.y = 60 / scale;
    var body1 = world.CreateBody(bodyDef1);

    //Crear el primer accesorio y añadir la forma rectangular al cuerpo
    var fixtureDef1 = new b2FixtureDef;
    fixtureDef1.density = 1.0;
    fixtureDef1.friction = 0.5;
    fixtureDef1.restitution = 0.5;
    fixtureDef1.shape = new b2PolygonShape;
    fixtureDef1.shape.SetAsBox(50 / scale, 10 / scale);

    body1.CreateFixture(fixtureDef1);

    //Definir el segundo cuerpo
    var bodyDef2 = new b2BodyDef;
    bodyDef2.type = b2Body.b2_dynamicBody;
    bodyDef2.position.x = 470 / scale;
    bodyDef2.position.y = 50 / scale;
    var body2 = world.CreateBody(bodyDef2);

    //Crear el segundo accesorio y añadir la forma rectangular al cuerpo
    var fixtureDef2 = new b2FixtureDef;
    fixtureDef2.density = 1.0;
    fixtureDef2.friction = 0.5;
    fixtureDef2.restitution = 0.5;
    fixtureDef2.shape = new b2PolygonShape;
    var points = [
        new b2Vec2(0, 0),
        new b2Vec2(40 / scale, 50 / scale),
        new b2Vec2(50 / scale, 100 / scale),
        new b2Vec2(-50 / scale, 100 / scale),
        new b2Vec2(-40 / scale, 50 / scale),
    ];

    fixtureDef2.shape.SetAsArray(points, points.length);
    body2.CreateFixture(fixtureDef2);

    //Crear una articulacion entre el body1 y el body2
    var jointDef = new b2RevoluteJointDef;
    var jointCenter = new b2Vec2(470 / scale, 50 / scale);

    jointDef.Initialize(body1, body2, jointCenter);
    world.CreateJoint(jointDef);
}

//132

var specialBody;
function createSpecialBody() {
    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 450 / scale;
    bodyDef.position.y = 0 / scale;
    specialBody = world.CreateBody(bodyDef);
    specialBody.SetUserData({ name: "special", life: 250 })

    var fixtureDef = new b2FixtureDef;
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.5;
    fixtureDef.restitution = 0.5;
    fixtureDef.shape = new b2CircleShape(30 / scale);
    var fixture = specialBody.CreateFixture(fixtureDef);
}

function listenForContact() {
    var listener = new Box2D.Dynamics.b2ContactListener;
    listener.PostSolve = function (contact, impulse) {
        var body1 = contact.GetFixtureA().GetBody();
        var body2 = contact.GetFixtureB().GetBody();

        if (body1 == specialBody || body2 == specialBody) {
            var impulseAlongNormal = impulse.normalImpulses[0];
            specialBody.GetUserData().life -= impulseAlongNormal;
            console.log("The special body was in a collision with impulse", impulseAlongNormal, "and its life has now become ", specialBody.GetUserData().life);

        }
    }; world.SetContactListener(listener);
}

function drawSpecialBody() {
    //Obtener la posicion y el angulo del cuerpo
    var position = specialBody.GetPosition();
    var angle = specialBody.GetAngle();

    //Transladar y girar el eje a la posicion y el angulo del cuerpo 
    context.translate(position.x * scale, position.y * scale);
    context.rotate(angle);

    //Dibuja una cara circular llena
    context.fillStyle = "rgb(200,150,250);";
    context.beginPath();
    context.arc(0, 0, 30, 0, 2 * Math.PI, false);
    context.fill();

    //Dibujar dos ojos rectangulares
    context.fillStyle = "rgb(255,255,255);";
    context.fillRect(-15, -15, 10, 5);
    context.fillRect(5, -15, 10, 5);

    //Dibujar un arco hacia arriba o hacia abajo para una sonrisa dependendiendo de la vida
    context.strokeStyle = "rgb(255,255,255);";
    context.beginPath();
    if (specialBody.GetUserData().life > 100) {
        context.arc(0, 0, 10, Math.PI, 2 * Math.PI, true);
    } else {
        context.arc(0, 10, 10, Math.PI, 2 * Math.PI, false);
    } 
    context.stroke();

    //Transladar y girar el eje de nuevo a la posicion original y el angulo
    context.rotate(-angle);
    context.translate(-position.x * scale, -position.y * scale);
}

// 152 

