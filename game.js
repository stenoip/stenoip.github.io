// Variables
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

// Preparar requestAnimationFrame y cancelAnimationFrame para su uso en el codigo del juego
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());

//Inicio
$(window).load(function () {
    game.init();
});

var game = {
    // Comienzo inicializando los objetos, precargando los assets y mostrando la pantalla de inicio
    init: function () {
        // Inicializo objetos
        levels.init();
        loader.init();
        mouse.init();

        // Cargo sonidos etc ...

        game.backgroundMusic = loader.loadSound('audio/gurdonark-kindergarten');

        game.slingshotReleasedSound = loader.loadSound("audio/released");
        game.bounceSound = loader.loadSound('audio/bounce');
        game.breakSound = {
            "glass": loader.loadSound('audio/glassbreak'),
            "wood": loader.loadSound('audio/woodbreak'),
            "rock":loader.loadSound('audio/rockbreak')
            // CARL AQUI AUDIO PARA LA ROCA
        };


        // Oculto todas la capas del juego y muestra la pantalla 
        $('.gamelayer').hide();
        $('#gamestartscreen').show();

        //Obtener el controlador para el canvas y el contexto del juego
        game.canvas = document.getElementById('gamecanvas');
        game.context = game.canvas.getContext('2d');
    },
    startBackgroundMusic: function () {
        var toggleImage = $("#togglemusic")[0];
        game.backgroundMusic.play();
        toggleImage.src = "images/icons/sound.png";
    },
    stopBackgroundMusic: function () {
        var toggleImage = $("#togglemusic")[0];
        toggleImage.src = "images/icons/nosound.png";
        game.backgroundMusic.pause();
        game.backgroundMusic.currentTime = 0; // Empezar de nuevo la cancion
    },
    toggleBackgroundMusic: function () {
        var toggleImage = $("#togglemusic")[0];
        if (game.backgroundMusic.paused) {
            game.backgroundMusic.play();
            toggleImage.src = "images/icons/sound.png";
        } else {
            game.backgroundMusic.pause();
            $("#togglemusic")[0].src = "images/icons/nosound.png";
        }
    },
    showLevelScreen: function () {
        this.stopBackgroundMusic();
        $('.gamelayer').hide();
        $('#levelselectscreen').show('slow');
    },
    restartLevel: function () {
        this.stopBackgroundMusic();
        window.cancelAnimationFrame(game.animationFrame);
        game.lastUpdateTime = undefined;
        levels.load(game.currentLevel.number);
    },
    startNextLevel: function () {
        window.cancelAnimationFrame(game.animationFrame);
        game.lastUpdateTime = undefined;
        levels.load(game.currentLevel.number + 1);
    },
    // CARL AQUI, Funcion en los niveles para poder salir 
    goBack: function(){
        this.stopBackgroundMusic();
        window.cancelAnimationFrame(game.animationFrame);
		game.lastUpdateTime = undefined;
		game.ended = true;
		game.showLevelScreen();
    },

    // Modo Game
    mode: "intro",
    // Coordenadas de la honda 
    slingshotX: 140,
    slingshotY: 280,
    start: function () {
        $('.gamelayer').hide();
        // Mostrar el canvas del juego y la puntuacion
        $('#gamecanvas').show();
        $('#scorescreen').show();

        game.startBackgroundMusic();

        game.mode = "intro";
        game.offsetLeft = 0;
        game.ended = false;
        game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
    },

    // Velocidad maxima de fotograma
    maxSpeed: 3,
    // minimo y maximo de offset
    minOffset: 0,
    maxOffset: 300,
    // Desplazamiento de panorámica actual
    offsetLeft: 0,
    // La puntuacion del juego.
    score: 0,

    //Desplegar la pantalla para centrarse en newCenter. Primero mueve hacia la derecha para mostrar el objetivo, luego deberia volver.
    panTo: function (newCenter) {
        if (Math.abs(newCenter - game.offsetLeft - game.canvas.width / 4) > 0
            && game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset) {

            var deltaX = Math.round((newCenter - game.offsetLeft - game.canvas.width / 4) / 2);
            if (deltaX && Math.abs(deltaX) > game.maxSpeed) {
                deltaX = game.maxSpeed * Math.abs(deltaX) / (deltaX);
            }
            game.offsetLeft += deltaX;
        } else {

            return true;
        }
        if (game.offsetLeft < game.minOffset) {
            game.offsetLeft = game.minOffset;
            return true;
        } else if (game.offsetLeft > game.maxOffset) {
            game.offsetLeft = game.maxOffset;
            return true;
        }
        return false;
    },
    countHeroesAndVillains: function () {
        game.heroes = [];
        game.villains = [];
        for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            var entity = body.GetUserData();
            if (entity) {
                if (entity.type == "hero") {
                    game.heroes.push(body);
                } else if (entity.type == "villain") {
                    game.villains.push(body);
                }
            }
        }
    },
    mouseOnCurrentHero: function () {
        if (!game.currentHero) {
            return false;
        }
        var position = game.currentHero.GetPosition();
        var distanceSquared = Math.pow(position.x * box2d.scale - mouse.x - game.offsetLeft, 2) + Math.pow(position.y * box2d.scale - mouse.y, 2);
        var radiusSquared = Math.pow(game.currentHero.GetUserData().radius, 2);
        return (distanceSquared <= radiusSquared);
    },
    handlePanning: function () {
        if (game.mode == "intro") {
            if (game.panTo(700)) {
                game.mode = "load-next-hero";
            }
        }

        if (game.mode == "wait-for-firing") {
            if (mouse.dragging) {
                if (game.mouseOnCurrentHero()) {
                    game.mode = "firing";

                } else {
                    game.panTo(mouse.x + game.offsetLeft)
                }
            } else {
                game.panTo(game.slingshotX);
            }
        }

        if (game.mode == "firing") {
            if (mouse.down) {
                game.panTo(game.slingshotX);
                var distance = Math.sqrt(Math.pow(mouse.x - mouse.downX, 2) + Math.pow(mouse.y - mouse.downY, 2));
                var maxDistance = 130;
                if (maxDistance > distance) {
                    game.currentHero.SetPosition({ x: (mouse.x + game.offsetLeft) / box2d.scale, y: mouse.y / box2d.scale });
                } else {
                    var angle = Math.atan2(mouse.y - mouse.downY, mouse.x - mouse.downX);
                    game.currentHero.SetPosition({ x: (mouse.downX + maxDistance * Math.cos(angle) + game.offsetLeft) / box2d.scale, y: (mouse.downY + maxDistance * Math.sin(angle)) / box2d.scale });
                }
            } else {

                game.mode = "fired";
                game.slingshotReleasedSound.play();
                var impulseScaleFactor = 0.75;

                // Coordenadas para cuando se tensa la honda
                var slingshotCenterX = game.slingshotX + 35;
                var slingshotCenterY = game.slingshotY + 25;
                var impulse = new b2Vec2((slingshotCenterX - mouse.x - game.offsetLeft) * impulseScaleFactor, (slingshotCenterY - mouse.y) * impulseScaleFactor);
                game.currentHero.ApplyImpulse(impulse, game.currentHero.GetWorldCenter());


                game.currentHero.SetAngularDamping(0.5);
                game.currentHero.SetLinearDamping(0.1);

            }
        }

        if (game.mode == "fired") {
            //Disparar para cualquiera de los heroes
            var heroX = game.currentHero.GetPosition().x * box2d.scale;
            game.panTo(heroX);

            //Esperar hasta que se pare de mover
            if (!game.currentHero.IsAwake() || heroX < 0 || heroX > game.currentLevel.foregroundImage.width) {
                // Quitar el antiguo hero
                box2d.world.DestroyBody(game.currentHero);
                game.currentHero = undefined;
                // Cargar uno nuevo
                game.mode = "load-next-hero";
            }
        }


        if (game.mode == "load-next-hero") {
            game.countHeroesAndVillains();

            // Mirar si hay villano, si no terminar
            if (game.villains.length == 0) {
                game.mode = "level-success";
                return;
            }

            // Mirar si hay heroes para cargar , sino hemos perdido 
            if (game.heroes.length == 0) {
                game.mode = "level-failure"
                return;
            }

            // Cargsr un heroes, para esperar el disparo 
            if (!game.currentHero) {
                game.currentHero = game.heroes[game.heroes.length - 1];
                game.currentHero.SetPosition({ x: 180 / box2d.scale, y: 200 / box2d.scale });
                game.currentHero.SetLinearVelocity({ x: 0, y: 0 });
                game.currentHero.SetAngularVelocity(0);
                game.currentHero.SetAwake(true);
            } else {
                // Esperar a que este quito para disparar 
                game.panTo(game.slingshotX);
                if (!game.currentHero.IsAwake()) {
                    game.mode = "wait-for-firing";
                }
            }
        }

        if (game.mode == "level-success" || game.mode == "level-failure") {
            if (game.panTo(0)) {
                game.ended = true;
                game.showEndingScreen();
            }
        }


    },
    showEndingScreen: function () {
        game.stopBackgroundMusic();
        if (game.mode == "level-success") {
            if (game.currentLevel.number < levels.data.length - 1) {
                $('#endingmessage').html('Level Complete. Well Done!!!');
                $("#playnextlevel").show();
            } else {
                $('#endingmessage').html('All Levels Complete. Well Done!!!');
                $("#playnextlevel").hide();
            }
        } else if (game.mode == "level-failure") {
            $('#endingmessage').html('Failed. Play Again?');
            $("#playnextlevel").hide();
        }

        $('#endingscreen').show();
    },

    animate: function () {
        // Animar el fondo
        game.handlePanning();

        // Animar personajes
        var currentTime = new Date().getTime();
        var timeStep;
        if (game.lastUpdateTime) {
            timeStep = (currentTime - game.lastUpdateTime) / 1000;
            if (timeStep > 2 / 60) {
                timeStep = 2 / 60
            }
            box2d.step(timeStep);
        }
        game.lastUpdateTime = currentTime;


        //  Dibujar el background con parallax scrolling
        game.context.drawImage(game.currentLevel.backgroundImage, game.offsetLeft / 4, 0, 640, 480, 0, 0, 640, 480);
        game.context.drawImage(game.currentLevel.foregroundImage, game.offsetLeft, 0, 640, 480, 0, 0, 640, 480);

        // Dibujar la honda
        game.context.drawImage(game.slingshotImage, game.slingshotX - game.offsetLeft, game.slingshotY);

        game.drawAllBodies();

        // Dibujar la banda
        if (game.mode == "wait-for-firing" || game.mode == "firing") {
            game.drawSlingshotBand();
        }

        // Honda de frente
        game.context.drawImage(game.slingshotFrontImage, game.slingshotX - game.offsetLeft, game.slingshotY);

        if (!game.ended) {
            game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
        }
    },
    drawAllBodies: function () {
        box2d.world.DrawDebugData();

        for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            var entity = body.GetUserData();

            if (entity) {
                var entityX = body.GetPosition().x * box2d.scale;
                if (entityX < 0 || entityX > game.currentLevel.foregroundImage.width || (entity.health && entity.health < 0)) {
                    box2d.world.DestroyBody(body);
                    if (entity.type == "villain") {
                        game.score += entity.calories;
                        $('#score').html('Score: ' + game.score);
                    }
                    if (entity.breakSound) {
                        entity.breakSound.play();
                    }
                } else {
                    entities.draw(entity, body.GetPosition(), body.GetAngle())
                }
            }
        }
    },
    drawSlingshotBand: function () {
        game.context.strokeStyle = "rgb(68,31,11)"; 
        game.context.lineWidth = 6; 

        // Calcular las coordenadas 
        var radius = game.currentHero.GetUserData().radius;
        var heroX = game.currentHero.GetPosition().x * box2d.scale;
        var heroY = game.currentHero.GetPosition().y * box2d.scale;
        var angle = Math.atan2(game.slingshotY + 25 - heroY, game.slingshotX + 50 - heroX);

        var heroFarEdgeX = heroX - radius * Math.cos(angle);
        var heroFarEdgeY = heroY - radius * Math.sin(angle);



        game.context.beginPath();
        // Empezar a tirar de la honda
        game.context.moveTo(game.slingshotX + 50 - game.offsetLeft, game.slingshotY + 25);

        // Dibujar linea en el heroe
        game.context.lineTo(heroX - game.offsetLeft, heroY);
        game.context.stroke();

        // Dibujar el heroe
        entities.draw(game.currentHero.GetUserData(), game.currentHero.GetPosition(), game.currentHero.GetAngle());

        game.context.beginPath();
    
        game.context.moveTo(heroFarEdgeX - game.offsetLeft, heroFarEdgeY);

   
        game.context.lineTo(game.slingshotX - game.offsetLeft + 10, game.slingshotY + 30)
        game.context.stroke();
    },

}

//Objeto levels
var levels = {
    // Nivel de datos. Tiene un array con info acerca de cada nivel 
    data: [
        { // Primer nivel 
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: [
                { type: "ground", name: "dirt", x: 500, y: 440, width: 1000, height: 20, isStatic: true },
                { type: "ground", name: "wood", x: 185, y: 390, width: 30, height: 80, isStatic: true },

                { type: "block", name: "wood", x: 520, y: 380, angle: 90, width: 100, height: 25 },
                { type: "block", name: "glass", x: 520, y: 280, angle: 90, width: 100, height: 25 },
                { type: "villain", name: "burger", x: 520, y: 205, calories: 590 },

                { type: "block", name: "wood", x: 620, y: 380, angle: 90, width: 100, height: 25 },
                { type: "block", name: "glass", x: 620, y: 280, angle: 90, width: 100, height: 25 },
                { type: "villain", name: "fries", x: 620, y: 205, calories: 420 },

                { type: "hero", name: "orange", x: 80, y: 405 },
                { type: "hero", name: "apple", x: 140, y: 405 },
            ]
        },
        {   // Segundo nivel
            foreground: 'Egip_BG',
            background: 'Egip_BG',
            entities: [
                { type: "ground", name: "dirt", x: 500, y: 440, width: 1000, height: 20, isStatic: true },
                { type: "ground", name: "wood", x: 185, y: 390, width: 30, height: 80, isStatic: true },

                { type: "block", name: "wood", x: 820, y: 380, angle: 90, width: 100, height: 25 },
                { type: "block", name: "wood", x: 720, y: 380, angle: 90, width: 100, height: 25 },
                { type: "block", name: "wood", x: 620, y: 380, angle: 90, width: 100, height: 25 },
                { type: "block", name: "glass", x: 670, y: 317.5, width: 100, height: 25 },
                { type: "block", name: "glass", x: 770, y: 317.5, width: 100, height: 25 },

                { type: "block", name: "glass", x: 670, y: 255, angle: 90, width: 100, height: 25 },
                { type: "block", name: "glass", x: 770, y: 255, angle: 90, width: 100, height: 25 },
                { type: "block", name: "wood", x: 720, y: 192.5, width: 100, height: 25 },

                { type: "villain", name: "burger", x: 715, y: 155, calories: 590 },
                { type: "villain", name: "fries", x: 670, y: 405, calories: 420 },
                { type: "villain", name: "sodacan", x: 765, y: 400, calories: 150 },

                { type: "hero", name: "strawberry", x: 30, y: 415 },
                { type: "hero", name: "orange", x: 80, y: 405 },
                { type: "hero", name: "apple", x: 140, y: 405 },
            ]
        },
        // CARL NIVELES AÑADIDOS 
        {   // Tercer nivel. Shakura Lvl 
            foreground: 'shakuraBG',
            background: 'shakuraBG',
            entities: [
                { type: "ground", name: "dirt", x: 500, y: 440, width: 1000, height: 20, isStatic: true },
                { type: "ground", name: "wood", x: 185, y: 390, width: 30, height: 80, isStatic: true },

                // Empieza por delante los paneles 
                // Todos mismos sitio alineados
                { type: "block", name: "wood", x: 620, y: 380, angle: 90, width: 100, height: 25 },
                { type: "block", name: "glass", x: 620, y: 280, angle: 90, width: 100, height: 25 },
                { type: "block", name: "glass", x: 620, y: 180, angle: 90, width: 90, height: 25 },
                // Uno depie largo
                { type: "block", name: "glass", x: 710, y: 380, angle: 90, width: 150, height: 35 },
                // Uno tumbado para poner un villano encima , sin angulo
                { type: "block", name: "wood", x: 770, y: 380, width: 100, height: 25 },
                //Ultimo para impedir que el donut nuede
                { type: "block", name: "glass", x: 840, y: 380, angle: 90, width: 100, height: 15 },

                //Coloco los villanos
                { type: "villain", name: "sodaglass", x: 710, y: 280, calories: 20 },
                { type: "villain", name: "cupcake", x: 666, y: 405, calories: 520 },
                { type: "villain", name: "Donut", x: 780, y: 360, calories: 250 },

                { type: "hero", name: "coconut", x: 30, y: 415 },
                { type: "hero", name: "watermelon", x: 80, y: 405 },
                { type: "hero", name: "pear", x: 140, y: 405 },
                
            ]
        },

        {   // Cuarto nivel. Strawberry lvl  
            foreground: 'backgroundDefault',
            background: 'backgroundDefault',
            entities: [
                //Modificar el suelo
                { type: "ground", name: "dirt", x: 500, y: 440, width: 1000, height: 20, isStatic: true },
                { type: "ground", name: "wood", x: 185, y: 390, width: 30, height: 80, isStatic: true },

                // Empieza por delante los paneles 
                // Uno de madera y encima de cristal, y el villano encima de esto
                //Coloco villanos a la vez en su puesto
                { type: "block", name: "wood", x: 510, y: 280, angle: 90, width: 50, height: 15 },
                { type: "block", name: "glass", x: 510, y: 220, width: 100, height: 25 },
                { type: "villain", name: "cupcake", x: 510, y: 210, calories: 120 },
                //Otro
                { type: "block", name: "wood", x: 620, y: 380, angle: 90, width: 100, height: 15 },
                { type: "block", name: "glass", x: 620, y: 320, width: 100, height: 25 },
                { type: "villain", name: "pizza", x: 620, y: 310, calories: 180 },
                //Otro más 
                { type: "block", name: "wood", x: 720, y: 280, angle: 90, width: 50, height: 15 },
                { type: "block", name: "glass", x: 720, y: 220, width: 100, height: 25 },
                { type: "villain", name: "Donut", x: 720, y: 210, calories: 190 },
                //Otro más alto
                { type: "block", name: "wood", x: 820, y: 280, angle: 90, width: 140, height: 15 },
                { type: "block", name: "glass", x: 820, y: 220, width: 100, height: 25 },
                { type: "villain", name: "fries", x: 820, y: 210, calories: 130 },
                
                // Coloco heroes, todo fresas
                { type: "hero", name: "strawberry", x: 30, y: 415 },
                { type: "hero", name: "strawberry", x: 80, y: 405 },
                { type: "hero", name: "strawberry", x: 140, y: 405 },
            ]
        },
        {   // Quinto nivel  cocos ??????
            foreground: 'GrassBG',
            background: 'GrassBG',
            entities: [
                //Modificar el suelo
                { type: "ground", name: "dirt", x: 500, y: 440, width: 1000, height: 50, isStatic: true },
                { type: "ground", name: "wood", x: 185, y: 390, width: 30, height: 80, isStatic: true },

                // Empieza por delante los paneles 
                // Uno de madera y encima de cristal, y el villano encima de esto
                { type: "block", name: "rock", x: 410, y: 350, angle: 90, width: 80, height: 25 },
                { type: "block", name: "rock", x: 510, y: 350, angle: 90, width: 80, height: 25 },
                { type: "block", name: "rock", x: 610, y: 350, angle: 90, width: 80, height: 25 },
                { type: "block", name: "rock", x: 710, y: 350, angle: 90, width: 80, height: 25 },
                { type: "block", name: "rock", x: 810, y: 350, angle: 90, width: 80, height: 25 },
                //Nivel 2 del castillo
                { type: "block", name: "rock", x: 510, y: 280, angle: 90, width: 50, height: 15 },
                { type: "block", name: "rock", x: 610, y: 280, angle: 90, width: 50, height: 15 },
                { type: "block", name: "rock", x: 710, y: 280, angle: 90, width: 50, height: 15 },
                { type: "block", name: "wood", x: 610, y: 250,  width: 300, height: 15 },
                // Tercer nivel del castillo 
                { type: "block", name: "rock", x: 580, y: 215, angle: 90, width: 50, height: 15 },
                { type: "block", name: "rock", x: 670, y: 215, angle: 90, width: 50, height: 15 },
                                
                //Villano arriba
                { type: "villain", name: "sodaglass", x: 520, y: 215, calories: 130 },
                { type: "villain", name: "fries", x: 720, y: 215, calories: 190 },
                { type: "villain", name: "sodacan", x: 620, y: 215, calories: 240 },
                //Villanos abajo
                { type: "villain", name: "burger", x: 560, y: 380, calories: 130 },
                { type: "villain", name: "cupcake", x: 660, y: 380, calories: 130 },

                // Coloco heroes, todo fresas
                { type: "hero", name: "coconut", x: 30, y: 415 },
                { type: "hero", name: "strawberry", x: 80, y: 405 },
            ]
        }
    ],

    // Seleccion de nivel
    init: function () {
        var html = "";
        for (var i = 0; i < levels.data.length; i++) {
            var level = levels.data[i];
            html += '<input type="button" value="' + (i + 1)+ ' ">';
        };
        $('#levelselectscreen').html(html);

        // Poner el boton para cargar el nivel
        $('#levelselectscreen input').click(function () {
            levels.load(this.value - 1);
            $('#levelselectscreen').hide();
        });

        $('#goBackbtn input').click(function () {
            $('#levelselectscreen').hide();
            $('.gamelayer').show('slow');
        });


    },

    // Carga todos los datos e imagenes para un nivel especifico
    load: function (number) {
        //Inicializar cuando el juego este sin más 
        box2d.init();

        // Declarar un nuevo objeto de nivel actual
        game.currentLevel = { number: number, hero: [] };
        game.score = 0;
        $('#score').html('Score: ' + game.score);
        game.currentHero = undefined;
        var level = levels.data[number];


        //Cargar el fondo, el primer plano y las imagenes de la honda
        game.currentLevel.backgroundImage = loader.loadImage("images/backgrounds/" + level.background + ".png");
        game.currentLevel.foregroundImage = loader.loadImage("images/backgrounds/" + level.foreground + ".png");
        game.slingshotImage = loader.loadImage("images/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("images/slingshot-front.png");

        // Cargar todas las entidades
        for (var i = level.entities.length - 1; i >= 0; i--) {
            var entity = level.entities[i];
            entities.create(entity);
        };

        //Llamar a game.start() cuando los assets se hayan cargado
        if (loader.loaded) {
            game.start()
        } else {
            loader.onload = game.start;
        }
    }
}
// Definir entidades 
var entities = {
    definitions: {
        "glass": {
            fullHealth: 200,
            density: 2.4,
            friction: 0.4,
            restitution: 0.15,
        },
        "wood": {
            fullHealth:900,
            density: 0.7,
            friction: 0.4,
            restitution: 0.4,
        },
        // ROCA AÑADIDA NUEVA CARL 
        "rock":{
            fullHealth:8000,
            density:20,
            friction:0.4,
            restitution:0,
        },
        "dirt": {
            density: 3.0,
            friction: 1.5,
            restitution: 0.2,
        },
        "burger": {
            shape: "circle",
            fullHealth: 40,
            radius: 25,
            density: 1,
            friction: 0.5,
            restitution: 0.4,
        },
        "sodacan": {
            shape: "rectangle",
            fullHealth: 80,
            width: 40,
            height: 60,
            density: 1,
            friction: 0.5,
            restitution: 0.7,
        },
        "fries": {
            shape: "rectangle",
            fullHealth: 50,
            width: 40,
            height: 50,
            density: 1,
            friction: 0.5,
            restitution: 0.6,
        },
        "apple": {
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4,
        },
        "orange": {
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4,
        },
        "strawberry": {
            shape: "circle",
            radius: 15,
            density: 2.0,
            friction: 0.5,
            restitution: 0.4,
        },
        // CARL ENTIDADES NUEVAS 
        // Nuevas entidades definidas
        "coconut": {
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.5,
        },
        "pineapple": {
            shape: "rectangle",
            fullHealth: 50,
            width: 40,
            height: 50,
            density: 1,
            friction: 0.5,
            restitution: 0.6,
        },
        "pear": {
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4,
        },
        "watermelon": {
            shape: "circle",
            radius: 30,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4,
        },
        "sodaglass": {
            shape: "rectangle",
            fullHealth: 80,
            width: 40,
            height: 60,
            density: 1,
            friction: 0.5,
            restitution: 0.7,
        },
        "cupcake": {
            shape: "circle",
            fullHealth: 40,
            radius: 25,
            density: 1,
            friction: 0.5,
            restitution: 0.4,
        },
        "Donut": {
            shape: "circle",
            fullHealth: 40,
            radius: 25,
            density: 1,
            friction: 0.5,
            restitution: 0.4,
        },
        "pizza": {
            shape: "rectangle",
            fullHealth: 50,
            width: 40,
            height: 50,
            density: 1,
            friction: 0.5,
            restitution: 0.6,
        },
    },
    // Tomar la entidad crear un cuerpo Box2D y añadirlo al mundo
    create: function (entity) {
        var definition = entities.definitions[entity.name];
        if (!definition) {
            console.log("Undefined entity name", entity.name);
            return;
        }
        switch (entity.type) {
            case "block": // Rectangulos
                entity.health = definition.fullHealth;
                entity.fullHealth = definition.fullHealth;
                entity.shape = "rectangle";
                entity.sprite = loader.loadImage("images/entities/" + entity.name + ".png");
                entity.breakSound = game.breakSound[entity.name];
                box2d.createRectangle(entity, definition);
                break;
            case "ground": // Rectangulos
                //Indestructibles
                entity.shape = "rectangle";
                // No sprite, no tiene dibujo
                box2d.createRectangle(entity, definition);
                break;
            case "hero":	// Circulo simples
            case "villain": // Pueden ser circulos o rectangulos 
                entity.health = definition.fullHealth;
                entity.fullHealth = definition.fullHealth;
                entity.sprite = loader.loadImage("images/entities/" + entity.name + ".png");
                entity.shape = definition.shape;
                entity.bounceSound = game.bounceSound;
                if (definition.shape == "circle") {
                    entity.radius = definition.radius;
                    box2d.createCircle(entity, definition);
                } else if (definition.shape == "rectangle") {
                    entity.width = definition.width;
                    entity.height = definition.height;
                    box2d.createRectangle(entity, definition);
                }
                break;
            default:
                console.log("Undefined entity type", entity.type);
                break;
        }
    },

    // Coge la posicion y la entidad y la dibuja 
    draw: function (entity, position, angle) {
        game.context.translate(position.x * box2d.scale - game.offsetLeft, position.y * box2d.scale);
        game.context.rotate(angle);
        switch (entity.type) {
            case "block":
                game.context.drawImage(entity.sprite, 0, 0, entity.sprite.width, entity.sprite.height,
                    -entity.width / 2 - 1, -entity.height / 2 - 1, entity.width + 2, entity.height + 2);
                break;
            case "villain":
            case "hero":
                if (entity.shape == "circle") {
                    game.context.drawImage(entity.sprite, 0, 0, entity.sprite.width, entity.sprite.height,
                        -entity.radius - 1, -entity.radius - 1, entity.radius * 2 + 2, entity.radius * 2 + 2);
                } else if (entity.shape == "rectangle") {
                    game.context.drawImage(entity.sprite, 0, 0, entity.sprite.width, entity.sprite.height,
                        -entity.width / 2 - 1, -entity.height / 2 - 1, entity.width + 2, entity.height + 2);
                }
                break;
            case "ground":
                break;
        }

        game.context.rotate(-angle);
        game.context.translate(-position.x * box2d.scale + game.offsetLeft, -position.y * box2d.scale);
    }

}

var box2d = {
    scale: 30,
    init: function () {
        // Box2d hace los calculos 
        var gravity = new b2Vec2(0, 9.8); //Gravedad
        var allowSleep = true; // Cuando caen los objetos se duermen 
        box2d.world = new b2World(gravity, allowSleep);

        var debugContext = document.getElementById('debugcanvas').getContext('2d');
        var debugDraw = new b2DebugDraw();
        debugDraw.SetSprite(debugContext);
        debugDraw.SetDrawScale(box2d.scale);
        debugDraw.SetFillAlpha(0.3);
        debugDraw.SetLineThickness(1.0);
        debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
        box2d.world.SetDebugDraw(debugDraw);

        var listener = new Box2D.Dynamics.b2ContactListener;
        listener.PostSolve = function (contact, impulse) {
            var body1 = contact.GetFixtureA().GetBody();
            var body2 = contact.GetFixtureB().GetBody();
            var entity1 = body1.GetUserData();
            var entity2 = body2.GetUserData();

            var impulseAlongNormal = Math.abs(impulse.normalImpulses[0]);
            // Listener que se llama mucho
            if (impulseAlongNormal > 5) {
                // Reducir la vida si la tienen 
                if (entity1.health) {
                    entity1.health -= impulseAlongNormal;
                }

                if (entity2.health) {
                    entity2.health -= impulseAlongNormal;
                }

                // Si hacen bounce emitir el sonido 
                if (entity1.bounceSound) {
                    entity1.bounceSound.play();
                }

                if (entity2.bounceSound) {
                    entity2.bounceSound.play();
                }
            }
        };
        box2d.world.SetContactListener(listener);
    },
    step: function (timeStep) {
        // Velocidad = 8
        // Iteraciones  = 3
        box2d.world.Step(timeStep, 8, 3);
    },
    createRectangle: function (entity, definition) {
        var bodyDef = new b2BodyDef;
        if (entity.isStatic) {
            bodyDef.type = b2Body.b2_staticBody;
        } else {
            bodyDef.type = b2Body.b2_dynamicBody;
        }

        bodyDef.position.x = entity.x / box2d.scale;
        bodyDef.position.y = entity.y / box2d.scale;
        if (entity.angle) {
            bodyDef.angle = Math.PI * entity.angle / 180;
        }

        var fixtureDef = new b2FixtureDef;
        fixtureDef.density = definition.density;
        fixtureDef.friction = definition.friction;
        fixtureDef.restitution = definition.restitution;

        fixtureDef.shape = new b2PolygonShape;
        fixtureDef.shape.SetAsBox(entity.width / 2 / box2d.scale, entity.height / 2 / box2d.scale);

        var body = box2d.world.CreateBody(bodyDef);
        body.SetUserData(entity);

        var fixture = body.CreateFixture(fixtureDef);
        return body;
    },

    createCircle: function (entity, definition) {
        var bodyDef = new b2BodyDef;
        if (entity.isStatic) {
            bodyDef.type = b2Body.b2_staticBody;
        } else {
            bodyDef.type = b2Body.b2_dynamicBody;
        }

        bodyDef.position.x = entity.x / box2d.scale;
        bodyDef.position.y = entity.y / box2d.scale;

        if (entity.angle) {
            bodyDef.angle = Math.PI * entity.angle / 180;
        }
        var fixtureDef = new b2FixtureDef;
        fixtureDef.density = definition.density;
        fixtureDef.friction = definition.friction;
        fixtureDef.restitution = definition.restitution;

        fixtureDef.shape = new b2CircleShape(entity.radius / box2d.scale);

        var body = box2d.world.CreateBody(bodyDef);
        body.SetUserData(entity);

        var fixture = body.CreateFixture(fixtureDef);
        return body;
    },
}

var loader = {
    loaded: true,
    loadedCount: 0, //Assets que han sido cargados antes
    totalCount: 0, //Numero total de assets que es necesario cargar

    init: function () {
        // Comprobar el soporte para el sonido 
        var mp3Support, oggSupport;
        var audio = document.createElement('audio');
        if (audio.canPlayType) {
            //Actualmente canPlayType() devuelve: "","maybe","probaly"
            mp3Support = "" !== audio.canPlayType('audio/mpeg');
            oggSupport = "" !== audio.canPlayType('audio/ogg; codecs="vorbis"');
        } else {
            //La etiqueta de audio no es soportada
            mp3Support = false;
            oggSupport = false;
        }

        //Comprueba para ogg o mp3 y si no finalmente fija soundFileExtn como undefined
        // Comprobar para ogg y mp3 si fija soundFileExt como undefined
        loader.soundFileExtn = oggSupport ? ".ogg" : mp3Support ? ".mp3" : undefined;


        var webMSupport, h264Support;
        var video = document.createElement('video');
        if (video.canPlayType) {
            h264Support = "" !== (video.canPlayType('video/mp4; codecs="avc1.42E01E"')
                || video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'));
            webMSupport = "" !== video.canPlayType('video/webm; codecs="vp8, vorbis"');
        } else {
            h264Support = false;
            webMSupport = false;
        }

        loader.videoFileExtn = webMSupport ? ".webm" : h264Support ? ".mp4" : undefined;
    },
    loadImage: function (url, callback) {
        this.totalCount++;
        loader.updateStatus();
        this.loaded = false;
        $('#loadingscreen').show();
        var image = new Image();
        image.src = url;
        image.onload = function (ev) {
            loader.itemLoaded(ev);
            if (callback) {
                callback(image);
            }
        };
        return image;
    },
    soundFileExtn: ".ogg",
    loadSound: function (url) {
        var audio = new Audio();
        if (!loader.soundFileExtn) {
            return audio;
        }

        this.totalCount++;
        loader.updateStatus();
        this.loaded = false;
        $('#loadingscreen').show();
        audio.addEventListener("canplaythrough", loader.itemLoaded, false);
        audio.preload = "auto";
        audio.src = url + loader.soundFileExtn;
        audio.load();
        return audio;
    },
    loadVideo: function (url) {
        var videoObject = document.createElement('video');
        if (!loader.videoFileExtn) {
            return videoObject;
        }
        this.totalCount++;
        loader.updateStatus();
        this.loaded = false;
        $('#loadingscreen').show();
        videoObject.addEventListener("canplaythrough", loader.itemLoaded, false);
        videoObject.preload = "auto";
        videoObject.src = url + loader.videoFileExtn;
        videoObject.load();
        return videoObject;
    },
    itemLoaded: function (e) {
        e.target.removeEventListener("canplaythrough", loader.itemLoaded, false);
        e.target.removeEventListener("canplay", loader.itemLoaded, false);
        e.target.removeEventListener("loadeddata", loader.itemLoaded, false);

        loader.loadedCount++;
        loader.updateStatus();
        if (loader.loadedCount === loader.totalCount) {
            loader.loaded = true;
            loader.loadedCount = 0;
            loader.totalCount = 0;
            $('#loadingscreen').hide();
            if (loader.onload) {
                loader.onload();
                loader.onload = undefined;
            }
        }
    },
    updateStatus: function () {
        $('#loadingmessage').html('Loading ' + loader.loadedCount + ' of ' + loader.totalCount + '...');
        var progress = loader.totalCount ? Math.round(100 * loader.loadedCount / loader.totalCount) : 100;
    }
};

var mouse = {
    x: 0,
    y: 0,
    down: false,
    init: function () {
        $('#gamecanvas').mousemove(mouse.mousemovehandler);
        $('#gamecanvas').mousedown(mouse.mousedownhandler);
        $('#gamecanvas').mouseup(mouse.mouseuphandler);
        $('#gamecanvas').mouseout(mouse.mouseuphandler);
    },
    mousemovehandler: function (ev) {
        var offset = $('#gamecanvas').offset();

        mouse.x = ev.pageX - offset.left;
        mouse.y = ev.pageY - offset.top;

        if (mouse.down) {
            mouse.dragging = true;
        }
    },
    mousedownhandler: function (ev) {
        mouse.down = true;
        mouse.downX = mouse.x;
        mouse.downY = mouse.y;
        ev.originalEvent.preventDefault();

    },
    mouseuphandler: function (ev) {
        mouse.down = false;
        mouse.dragging = false;
    }
}
