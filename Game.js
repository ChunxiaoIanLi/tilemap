var game= new Phaser.Game(640, 640, Phaser.CANVAS, 'gameContainer',{preload: preload, create: create, update:update,render:render});

function preload(){
	game.load.tilemap('map', 'assets/test.json',null, Phaser.Tilemap.TILED_JSON);
	game.load.image('tiles', 'assets/tiles/terrain.png');
	game.load.spritesheet('hero','assets/players/mario.png',50,50);
}

var myMap; //map
var pathfinder; //pathfinder plugin
var cursors; //cursors object for taking cursor input
var hero_sprite; //hero sprite on the map that represents hero's location
var marker; //square following mouse cursor
var pathGroup; //group that holds sprites along the path
var destination; //hold the coordinate when a tapEvent happens
var lastPath; //hold the last path with coordinates
var scaleX=0.64; //x scale for hero image
var scaleY=0.64; //y scale for hero image
var heroMoving=false; //initialize hero moving status to false

function create(){
	myMap=game.add.tilemap('map');
	myMap.addTilesetImage('terrain', 'tiles');
	
	//create layers corresponding to JSON file
	grass_layer = myMap.createLayer('grass_background');
	not_grass_layer=myMap.createLayer('not_grass');
	lily_layer=myMap.createLayer('lilypad');
	
    grass_layer.resizeWorld(); //resize the world to the size of grass_layer
	
	pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin); //initialize pathfinding plugin
	pathfinder._easyStar.enableDiagonals(); //enable paths with diagonals
	var walkables=[-1];
    pathfinder.setGrid(myMap.layers[1].data, walkables);// so that none of the not_grass tiles are walkable
	
	//set hero at [10,5]
	hero_sprite=game.add.sprite(320,160,'hero');
	hero_sprite.scale.set(scaleX,scaleY); //scale hero image to 32x32
	
	//enable cursor input
	cursors=game.input.keyboard.createCursorKeys();
	
	//add square that follows mounse pointer
	marker=game.add.graphics();
	marker.lineStyle(2,0x000000,1);
	marker.drawRect(0,0,32,32);
	
	//initialize pathGroup
	pathGroup=game.add.group();
	
	//register tapEvent function when cursor is tapped
	game.input.onTap.add(tapEvent,this);
}

function update(){
	//move marker to the tile that the cursor is currently on
	marker.x=grass_layer.getTileX(game.input.activePointer.worldX)*32;
	marker.y=grass_layer.getTileY(game.input.activePointer.worldY)*32;
}

function render(){
	//don't know what to put yet lol
}

//when a click event happens
function tapEvent(){
	destination=typeof destination!=='undefined'?destination:[]; //set destination to empty list if it's not initialized
	
	lastPath=typeof lastPath!=='undefined'?lastPath:[]; //set lastPath to empty list if it's not initialized
	//if hero is not moving
	if(heroMoving ==false){
		//if player clicked on same tile twice
		if(marker.x==destination.x&&marker.y==destination.y){
			heroMoving=true; //set hero state to moving
			moveHero(); //move hero along lastPath
		}
		//if player clicked on a new tile
		else{
			pathGroup.removeChildren(); //clear the path on the map
			//if not clicking on hero
			if(marker.x!=hero_sprite.x && marker.y!=hero_sprite.y){
				findPathTo(); //find path to the new destination
			}
			
		};
	}
	//if in middle of moving, set heroMoving to false to interrupt recursion? 
	else{
		heroMoving=false;
	};
}

//calculate shortest path from hero to destination
function findPathTo() {
	//get destination tile coordinate
	endx=marker.x/32;
	endy=marker.y/32;
	//get starting point tile coordinate
	herox=grass_layer.getTileX(hero_sprite.x);
	heroy=grass_layer.getTileX(hero_sprite.y);
	//I don't get this 
    pathfinder.setCallbackFunction(function(path) {
		//for each tile in path
        for(var i = 0, ilen = path.length; i < ilen; i++) {
			//create a sprite at the tile position and add it to pathGroup
			pathGroup.create(path[i].x*32, path[i].y*32,'hero');
			//set the sprite to 32x32
			pathGroup.getChildAt(pathGroup.length-1).scale.set(scaleX,scaleY);
        }
		//update destination
		destination.x=marker.x;
		destination.y=marker.y;
		//update path
		lastPath=path;
    });
	//plugin call
    pathfinder.preparePathCalculation([herox,heroy], [endx,endy]);
    pathfinder.calculatePath();
}

//moves hero towards destination
function moveHero(i) {
	if(heroMoving == true){
		i = typeof i !== 'undefined' ? i : 0; //if function is called with no variable set i=0
		
		//move hero long lastPath every 50ms
		game.time.events.add(50, function() {
		   hero_sprite.x = (lastPath[i].x * 32);
		   hero_sprite.y = (lastPath[i].y * 32);
		   //delete coordinate from lastPath
		   lastPath.splice(i,1);
		   i--;
		   //remove sprite on the path
		   pathGroup.removeChildAt(0);
		   //if hero is at destination change hero to not moving
			if(pathGroup.length==0){
				heroMoving=false;
				destination=undefined; //reset destination
			}
		   if (lastPath[i + 1]) { //if there exists another step run move hero again
			   moveHero(i + 1)
		   }
		}, this);
	};
};