import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';

@IonicPage({
  name: 'TargetFindGamePage'
})
@Component({
  selector: 'page-target-find-game',
  templateUrl: 'target-find-game.html',
})
export class TargetFindGamePage {

  background = 'targetBackground1';
  objects = [0, 1, 2, 3, 4, 5, 6 ,7, 8, 9, 10, 11];//Yes, this is the only way to do this
  objectPositions = new Array(12);
  objectDirections = new Array(12);
  allTargetNums = [1, 2, 3, 4, 5, 6];
  currentTargetNum = 2;//change to get this value from last game played
  currentMovingObjects = 2; //used to reduce redundancy
  targetsLeftToClick = 2;

  targetSpeed = 1;//changes based on level
  speed = 18 //36 = slow, 18 = fast

  level = '11'; //default level
  objectWidth = 50; //default object width
  objectHeight = 50; //default object height
  maxX;
  maxY;
  minY;

  objectsMoving = false;

  canClick = false;

  countdown = '3';
  correctStreak = 0; //every 3 correct in a row moves player to next speed
  totalCorrect = 0;
  timesLeft = 10;

  constructor(public navCtrl: NavController, public navParams: NavParams, public platform: Platform, public statusBar: StatusBar) {
    let endFor = this.objectPositions.length
    for (var i = 0; i < endFor; i++) {
      this.objectPositions[i] = new Array(2);
    }
    this.level = navParams.get('level');
    this.background = 'targetBackground' + this.level.charAt(0);
    this.targetSpeed = parseInt(this.level.charAt(1));
    this.speed*=this.targetSpeed;
    platform.ready().then(() => {
      statusBar.hide();
    });

    this.maxX = this.platform.width()-this.objectWidth;
    this.maxY = this.platform.height()-this.objectHeight;
    this.minY = this.platform.height()/10;
  }

  ionViewDidLoad() {
    this.countdownStart();
  }

  /**
  * Starts countdown before game begins
  */
  countdownStart() {
    let cd = document.getElementById('countdown');
    this.countdown = '3';
    cd.hidden = false;
    this.sleep(1000).then(() => {
      this.countdown = '2';
      this.sleep(1000).then(() => {
        this.countdown = '1';
        this.sleep(1000).then(() => {
          this.countdown = 'GO';
          this.sleep(200).then(() => {
            cd.hidden = true;
            this.startTime();
          });
        });
      });
    });
  }

  /**
  * Sleep for an alloted time
  * @param {time} Time slept in milliseconds
  */
  sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  /**
  * Ends game or begins next bird spawn
  */
  startTime() {
    if(this.timesLeft <= 0) {
      this.end();
    }
    else {
      this.targetsLeftToClick = this.currentTargetNum;
      this.currentMovingObjects = this.currentTargetNum;
      this.loadObjects(0, this.currentTargetNum);
      this.sleep(2000).then(() => {
        this.objectsMoving = true;
        this.moveObjects();
        this.sleep(1500).then(() => {
          this.loadObjects(this.currentTargetNum, this.objects.length);
          this.currentMovingObjects = this.objects.length;
          this.sleep(6000).then(() => {
            this.objectsMoving = false;
            this.canClick = true;
          })
        })
      });
    }
  }

  loadObjects(start, end) {
    var maxWidth = this.platform.width()-this.objectWidth;
    var maxHeight = this.platform.height()-this.objectHeight;
    var minHeight = 90;
    var x;
    var y;

    for(let i = start; i < end; i++) {
      var object = document.getElementById(i + '');
      var invalidSpot;
      do {
        invalidSpot = false;
        x = Math.floor(Math.random()*maxWidth);
        y = Math.floor(Math.random()*(maxHeight-minHeight)+minHeight);
        for(let j = 0; j < i; j++) {
          let otherObjectX = this.objectPositions[j][0];
          let otherObjectY = this.objectPositions[j][1];
          if((Math.abs(x-otherObjectX) <= this.objectWidth) && (Math.abs(y-otherObjectY) <= this.objectHeight))
            invalidSpot = true;
        }
      } while(invalidSpot)

      this.objectPositions[i][0] = x;
      this.objectPositions[i][1] = y;
      this.objectDirections[i] = Math.random()*6.2832;//0 to 2pi
      object.hidden = false;
    }

    console.log(Date.now());
  }

  //0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW
  //0=left, 1=top
  //1.4142 is used instead of sqrt(2) for efficiency
  //50 is used instead of object width and height for efficiency
  moveObjects() {
    if(this.objectsMoving) {
      this.sleep(this.speed).then(() => {
        for(let i = 0; i < this.currentMovingObjects; i++) {
          let direction = this.objectDirections[i];
          this.objectPositions[i][0]+=2*Math.cos(direction);
          this.objectPositions[i][1]+=2*Math.sin(direction);

          let iX = this.objectPositions[i][0];
          let iY = this.objectPositions[i][1];
          if(iX >= this.maxX || iX <= 0)
            this.objectDirections[i] = direction+2*(1.5708-direction);
          else if(iY >= this.maxY || iY <= this.minY)
            this.objectDirections[i] = direction+2*(6.2832-direction);

          for(let j = 0; j < this.currentMovingObjects; j++) {
            if(j != i && (Math.abs(iX-this.objectPositions[j][0]) <= 50 && Math.abs(iY-this.objectPositions[j][1]) <= 50)) {
              let tempDirection =  this.objectDirections[i];
              this.objectDirections[i] = this.objectDirections[j];
              this.objectDirections[j] = tempDirection;
            }
          }
        }
        this.moveObjects();
      });
    }
  }

  /**
  * Checks if place tapped contains one of the target objects
  * @param {ev} The tap event
  */
  handleTap(ev) {
    if(this.canClick) {
      var xClick = ev.changedPointers[0].x;
      var yClick = ev.changedPointers[0].y;
      var clickedCorrect = true;
      for(let i = 0; i < this.objects.length; i++) {
        var target = document.getElementById(i + '');
        var targetX = this.objectPositions[i][0];
        var targetY = this.objectPositions[i][1];
        if(xClick-targetX <= this.objectWidth && xClick-targetX >= 0 && yClick-targetY <= this.objectHeight && yClick-targetY >= 0) {
          if(i < this.currentTargetNum && !target.hidden) {
            target.hidden = true;
            this.targetsLeftToClick--;
            if(this.targetsLeftToClick == 0)
              this.correct();
          }
          else {
            clickedCorrect = false;
            this.incorrect();
          }
        }
      }
    }
  }

  /**
  * Decides what to do after correct button was pressed
  */
  correct() {
    this.canClick = false;
    this.timesLeft--;
    this.hideObjects();
    this.totalCorrect++;
    this.correctStreak++;
    if(this.correctStreak == 3) {
      this.correctStreak = 0;
      if(this.currentTargetNum < this.allTargetNums.length-1)
        this.currentTargetNum++;
    }
    this.displayImage('check');
  }

  /**
  * Decides what to do after incorrect button was pressed
  */
  incorrect() {
    this.canClick = false;
    this.timesLeft--;
    this.hideObjects();
    this.correctStreak = 0;
    if(this.currentTargetNum > 1)
      this.currentTargetNum--;
    this.displayImage('x');
  }

  /**
  * Displays check mark if correct object was clicked, or
  * an x otherwise
  * @param {s} The image to be displayed
  */
  displayImage(s : string) {
    document.getElementById(s).hidden = false;
    this.sleep(500).then(() => {
      document.getElementById(s).hidden = true;
      this.startTime();
    });
  }

  hideObjects() {
    for(let i = 0; i < this.objects.length; i++) {
      document.getElementById(i + '').hidden = true;
    }
  }

  getPosition(o: any) {
    return {'left': this.objectPositions[parseInt(o)][0] + 'px',
            'top': this.objectPositions[parseInt(o)][1] + 'px'}
  }

  /**
  * Decides which type of object will appear
  * @return The object type url
  */
  getSource() {
    return this.level.charAt(0) == '1' ? 'assets/imgs/target-find-game/frog.svg' : 'assets/imgs/target-find-game/camel.svg';
  }

  /**
  * @return The width of the x and check mark
  */
  getXCheckWidth() {
    return this.platform.width()/2;
  }

  /**
  * @return The height of the x and check mark
  */
  getXCheckHeight() {
    return this.platform.height()/2;
  }

  /**
  * @return The width of the x and check mark
  */
  getWidth() {
    return this.platform.width()/2;
  }

  /**
  * @return The height of the x and check mark
  */
  getHeight() {
    return this.platform.height()/2;
  }

  /**
  * @return The amount of times left in the level
  */
  getTimesLeft() {
    return this.timesLeft;
  }

  /**
  * @return The number of objects being tracked
  */
  getObjectNum() {
    return this.currentTargetNum;
  }

  /**
  * @return Countdown from 3
  */
  getCountDown() {
    return this.countdown;
  }

  ionViewWillUnload() {
    this.statusBar.show();
    this.objectsMoving = false;
  }

  /**
  * Ends game
  */
  end() {
    this.navCtrl.pop();
  }

}
