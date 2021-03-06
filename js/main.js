var EnemyZombie = function (index, game, player) {

  var x = game.world.randomX;
  var y = -game.world.height/2; 

  this.game = game;
  this.health = 3;
  this.player = player;
  this.alive = true;

  this.zombie = game.add.sprite(x, y, 'enemy_box');
  // console.log('this.zombie.y: ' + this.zombie.y);
  // console.log('this.zombie.position.y: ' + this.zombie.position.y);

  this.zombie.anchor.set(0.5);
  
  this.zombie.name = index.toString(); // used for accessing each item
  game.physics.enable(this.zombie, Phaser.Physics.ARCADE);
  this.zombie.body.immovable = false;
  this.zombie.body.collideWorldBounds = true;
  this.zombie.body.bounce.setTo(0.1, 0.1); // 10% rebound velocity
  
  this.zombie.angle = game.rnd.angle(); // random angle
  
  this.zombie.body.velocity.x = Math.random()*(50+50)-50;
  this.zombie.body.velocity.y = Math.random()*(50+50)-50;

  // game.physics.arcade.velocityFromRotation(this.zombie.rotation, 100, this.zombie.body.velocity);

};

EnemyZombie.prototype.damage = function () {

  this.health -= 1;
  if (this.health <= 0) {
    this.alive = false;
    this.zombie.kill();
    return true;
  }
  return false;

};

EnemyZombie.prototype.update = function() {

  // follows if player is alive
  if (health > 0) {
    this.game.physics.arcade.moveToObject(this.zombie, this.player, 50);
  }
  else {
    // this.zombie.body.velocity.x = Math.random()*(50+50)-50;
    // this.zombie.body.velocity.y = Math.random()*(50+50)-50;
  }

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

function preload () {
  
  game.load.image('bullet', 'assets/bullet.png');
  game.load.image('light_sand', 'assets/light_sand.png');
  game.load.image('enemy_box', 'assets/enemy_box.png');
  game.load.spritesheet('kaboom', 'assets/explosion.png', 64, 64, 23);
  
  // new player 1 sprite
  game.load.image('red_box', 'assets/red_box.png');
  game.load.image('yellow_box', 'assets/yellow_box.png');
}



var floor;

// field characters
var player;
var moveSpeed = 200; // speed which player moves
var health = 5;

var enemies;
var enemiesAlive = 0;
var enemiesTotal;

// shooting
var bullets;
var fireRate = 150;
var nextFire = 0;
var bulletSpeed = 600; 

// input key controller
var cursors;
var fireButton;

// game components
var stateText;
// score
var score = 0;
var scoreString = '';
var scoreText;

function create () {
  
  // Resize game world to be a 800 x 600 square
  game.world.setBounds(-400, -300, 800, 600);

  // Tiled scrolling background
  floor = game.add.tileSprite(0, 0, 800, 600, 'light_sand');
  floor.fixedToCamera = true;
  
  
  // Player Sprite: yellow_box 
  player = game.add.sprite(0, 0, 'yellow_box');
  player.anchor.setTo(0.5, 0.5); // Centers the sprite (half is 0.5)

  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.collideWorldBounds = true;
  // player.body.bounce.setTo = (10, 10);

  
  // Player bullet group
  bullets = game.add.group();
  bullets.enableBody = true; // Allows group to have physics body 
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(30, 'bullet', 0, false); // False bc bullets do not exist on default
  bullets.setAll('anchor.x', 0);
  bullets.setAll('anchor.y', 0.5);
  bullets.setAll('outOfBoundsKill', true);
  bullets.setAll('checkWorldBounds', true);


  // Create enemy zombie array and total 
  // Instantiation happens during game, in update()
  enemies = [];
  enemiesTotal = 5;
  // for (var i = 0; i < enemiesTotal; i++) {
  //   enemies.push(new Zombie(i, game, player));
  // }
  
  
  // Game text
  stateText = game.add.text(0, 0, ' ', { font: '34px Monospace', fill: '#fff' });
  stateText.anchor.setTo(0.5, 0.5);
  stateText.visible = false;
  // Score
  scoreString = 'Score : ';
  scoreText = game.add.text(-400 + 32, -300 + 32, scoreString + score, { font: '24px Monospace', fill: '#fff' });
  
  
  // Camera related 
  player.bringToTop();    

  game.camera.follow(player);
  game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
  game.camera.focusOnXY(0, 0);


  // Input keys 
  cursors = game.input.keyboard.createCursorKeys();
  fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

}



/*  
  NOTE: sprite.angle is orientation in degrees 
  whereas sprite.body.angle is calculated by its velocity in radians
*/

// Spawning enemies
var enemyIndex = 0;
var spawnRate = 1500;
var nextCheckEnemies = 0;

function update () {
  
  // default player color is yellow
  player.loadTexture('yellow_box');

  
  // Spawn enemies: during game, not before
  if (enemyIndex < enemiesTotal) {
    if (game.time.time > nextCheckEnemies) {
      nextCheckEnemies = game.time.time + spawnRate;
      // populate array zomibes
      enemies.push(new EnemyZombie(enemyIndex, game, player));
      enemyIndex++;
    }
  }
  

  // iterate and update each zombie (collisions, follow, death)
  enemiesAlive = 0;
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemiesAlive++;
      
      // check collision player and zombie
      game.physics.arcade.collide(player, enemies[i].zombie, enemyHitPlayer, null, this); 
      
      // check if enemies collide with other enemies
      for (var j = 0; j < enemies.length; j++) {
        if (i !== j) {
          game.physics.arcade.collide(enemies[j].zombie, enemies[i].zombie);    
        }
      }
      
      // check if zombie is hit by bullet - it dies
      game.physics.arcade.overlap(bullets, enemies[i].zombie, bulletHitEnemy, null, this);
      enemies[i].update(); 
    }
  }


  // --- Player input/movement ---
  // Movement done through velocity, not position
  // Velocity is 0 if no key is pressed
  if (player.alive) {
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;
  
    // player.angle (orientation) is the angle of velocity + pi/2 (offset)
    // then converted converted into degrees (multiply by 180/pi)
    if (cursors.left.isDown) { // left
      player.body.velocity.x = -moveSpeed;
      player.angle = (player.body.angle+(Math.PI/2)) * (180/Math.PI); 
    }
    else if (cursors.right.isDown) { // right
      player.body.velocity.x = moveSpeed;
      player.angle = (player.body.angle+(Math.PI/2)) * (180/Math.PI);
    }
    // separation necessary to allow combo movements (move up-right)
    if (cursors.up.isDown) { // up
      player.body.velocity.y = -moveSpeed;
      player.angle = (player.body.angle+(Math.PI/2)) * (180/Math.PI);
    }
    else if (cursors.down.isDown) { // down
      player.body.velocity.y = moveSpeed;
      player.angle = (player.body.angle+(Math.PI/2)) * (180/Math.PI);
    }
  
    if (fireButton.isDown) {
      fireBullet();
    }    
  }



  // floor scrolling
  floor.tilePosition.x = -game.camera.x;
  floor.tilePosition.y = -game.camera.y;


  // // debug 
  // var refreshRate = 10000;
  // if (game.time.time > nextCheck) {
  //   nextCheck = game.time.time + refreshRate;
  //   console.log(player.angle);
  // }
  
  // console.log("coordinates: " + bullets.children[i].x + ", " + bullets.children[i].y);

}

function fireBullet () {
  if (game.time.time > nextFire) {
    
    var bullet = bullets.getFirstExists(false);
    
    if (bullet) 
    {
      nextFire = game.time.time + fireRate;
      bullet.reset(player.x, player.y);
      bullet.angle = player.angle - 90;
    
      if (player.angle == 0) { // up
        bullet.body.velocity.y = -bulletSpeed;
      }
      else if (player.angle == 45) { // up right 
        bullet.body.velocity.y = -bulletSpeed;
        bullet.body.velocity.x = bulletSpeed;
      }
      else if (player.angle == 90) { // right
        bullet.body.velocity.x = bulletSpeed;
      }
      else if (player.angle == 135) { // down right
        bullet.body.velocity.x = bulletSpeed;
        bullet.body.velocity.y = bulletSpeed;
      }
      else if (player.angle == -180) { // down
        bullet.body.velocity.y = bulletSpeed;
      }
      else if (player.angle == -135) { // down left
        bullet.body.velocity.y = bulletSpeed;
        bullet.body.velocity.x = -bulletSpeed;
      }
      else if (player.angle == -90) { // left
        bullet.body.velocity.x = -bulletSpeed;  
      }
      else if (player.angle == -45) { // up left 
        bullet.body.velocity.x = -bulletSpeed;  
        bullet.body.velocity.y = -bulletSpeed;
      }
    }
    
  }
}

function bulletHitEnemy (zombie, bullet) { // zombie passed in first since bullet is from bullets group 
  bullet.kill();
  var destroyed = enemies[zombie.name].damage(); // returns true if destroyed
  
  score += 1;
  scoreText.text = scoreString + score;
  
  if (destroyed) {
    // death animation
    // var explosionAnimation = explosions.getFirstExists(false);
    // explosionAnimation.reset(tank.x, tank.y);
    // explosionAnimation.play('kaboom', 30, false, true);
  }
}

var nextCheckHit = 0;
function enemyHitPlayer (player, zombie) {
  var hitDelay = 1000;
  if (game.time.time > nextCheckHit) {
    nextCheckHit = game.time.time + hitDelay;
    player.loadTexture('red_box'); // player turns red when hit
    health--;
  }
  
  if (health < 1) {
    player.kill();
    
    stateText.text = "GAME OVER\nClick to restart";
    stateText.visible = true;
    
    //the "click to restart" handler
    game.input.onTap.addOnce(restart, this);
    
  }
}

function restart () {
    
    // reset health
    health = 5; 

    // revive player
    player.x = 0;
    player.y = 0;
    player.revive();
    
    // hide text
    stateText.visible = false;

}


function render () {

  // game.debug.text('Active Bullets: ' + bullets.countLiving() + ' / ' + bullets.length, 32, 512);
  game.debug.text('enemies: ' + enemiesAlive + ' / ' + enemiesTotal, 32, 512+32);
  // game.debug.text('Screen: ' + game.world.width + ', ' + game.world.height, 32, 64);
  
  // game.debug.bodyInfo(player, 16, 32);
  // game.debug.bodyInfo(bullets.children[0], 16, 22);
  // game.debug.bodyInfo(enemies[0], 16, 22); // doesn't work

  // game.debug.text(enemies[0].zombie.y, 32, 32);
  // console.log('[inside render()] enemies[0].zombie.y: ' + enemies[0].zombie.y);
  
  game.debug.text('heatlh: ' + health, 32, 512);
  
}