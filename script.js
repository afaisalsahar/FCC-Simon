var colors = ["G", "B", "R", "O"], simonSounds = [], playerSounds = [];
var rounds = 0, strictMode = false, gameStart = false, playersTurn = false, nextRound = false, patternError = false, playerclick = false;

var audioC = new (window.AudioContext || window.webkitAutioContext)(), audioO, audioG, audioTada = "";

function randomColor() { return colors[Math.floor(Math.random() * 4)]; }

function check(color) {
    if(color == simonSounds[playerSounds.length]) {
        playerSounds.push(color);
        if(playerSounds.length == simonSounds.length && color == simonSounds[simonSounds.length-1]) {
            if(rounds == 20) return {status: true, lastmatch: true, win: true};
            else return {status: true, lastmatch: true, win: false};
        } else {
            return {status: true, lastmatch: false, win: false};
        }
    }
    return false;
}

function error() {
    patternError = true; playersTurn = false;
    loadSound("square", 2500);
    audioG.gain.setValueAtTime(0.5, audioC.currentTime);
    audioO.start();
    results(1, "error");

    if(strictMode) {
        setTimeout(function() {
            results(0, "error");
        }, 800);
        setTimeout(stopSound, 810);
        setTimeout(resetGame, 820);
    } else {
        setTimeout(function() {
            results(0, "error");
        }, 800);
        setTimeout(stopSound, 810);
        setTimeout(function() {
            simonSpeaks(false);
        }, 820);
    }
}

function success() {
    stopSound();
    audioTada[0].play();
    results(1, "success");
    setTimeout(function() {
        results(0, "success");
    }, 2000);
    setTimeout(function() {
        resetGame(true);
    }, 2200);
}

function results(mode, status) {
    if(mode) {
        $(".results").addClass(status).fadeIn(200, function() {
        	$("#"+status).fadeIn(200);
        }).css("display", "flex");

        return;
    }

    $("#"+status).fadeOut(200, function() {
        $(".results").removeClass(status).fadeOut(200);
    });
}

function lights(mode, light) {
    // mode = 0 (turn off), 1 (turn on);
    var lights = $(".light");
    for (var i = 0; i < lights.length; i++) {$(lights[i]).removeClass("active");}

    if(mode == 1) $(lights[light]).addClass("active");
}

function showRounds(increment) {$("#rounds").html((++rounds < 10) ? "Round: 0"+rounds : "Round: "+rounds);}

function loadSound(oType, freq) {
    audioO = audioC.createOscillator();
    audioO.type = oType;
    audioO.frequency.value = freq;
    audioG = audioC.createGain();

    audioO.connect(audioG);
    audioG.connect(audioC.destination);
}

function playSound(index, wave, freq) {
    loadSound(wave, freq);
    lights(1, index);
    audioG.gain.setValueAtTime(0.5, audioC.currentTime);
    audioO.start();
}

function stopSound(value) {
    lights(0, false);
    audioG.gain.exponentialRampToValueAtTime(0.001, audioC.currentTime + 1)
    audioO.stop(audioC.currentTime + 1);
}

function simonSpeaks(generateSound) {
    if(generateSound) simonSounds.push(randomColor());

    (function theLoop(i) {
        setTimeout(function() {
            var lights = $(".light");
            for (var j = 0; j < lights.length; j++) {
                if(lights[j].dataset.color == simonSounds[i]) {
                    playSound(j, lights[j].dataset.wave, 400);
                }
            }
            setTimeout(function() {
                stopSound();
                if(++i < simonSounds.length) {
                    theLoop(i);
                } else {
                    playersTurn = true;
                }
            }, 800);
        }, 800);
    })(0);
}

function startGame() {
    showRounds(true);
    simonSpeaks(true);
    gameStart = true;
}

function resetGame(stop) {
    simonSounds.length = 0; playerSounds.length = 0;
    rounds = 0, gameStart = false, playersTurn = false, nextRound = false, patternError = false;

    if(stop) {
        strictMode = false;
        $("#strict").removeClass("active");
        $("#rounds").html("Round:00");
    } else {
        startGame();
    }
};

function gradientColors(color) {
    switch (color) {
        case "G": return "#1abc9c";
        case "B": return "#0197da";
        case "R": return "#ec5657";
        case "O": return "#f9b649";
        default: return "#818486";
    }
}

function clickedBtn(event) {
    if(("button" in event && (event.button == 2 || event.button == 3)) ||
    ("which" in event && (event.which == 2 || event.button == 3))) return false;

    return true;
}

function init() {
    audioTada = $("<audio>");
    $(audioTada).attr("src", "tada.mp3");

    $(".title").css("background-image", "linear-gradient(45deg,"+gradientColors(randomColor())+","+gradientColors(randomColor())+")");

    $(".button").on("click", function(e) {
        if((this.id == "reset" && !gameStart) || (this.id == "start" && gameStart) || !clickedBtn(e)) return false;

        if(this.id == "strict" && !strictMode) {
            $(this).addClass("active");
            strictMode = true;
            return;
        } else {
            $(this).addClass("active");
        }

        (function(button) {
            setTimeout(function() {
                $(button).removeClass("active");
                if(button.id == "start" && !gameStart) return startGame();
                if(button.id == "strict" && strictMode) strictMode = false;
                if(button.id == "reset" && gameStart) return resetGame(true);
            }, 400);
        })(this);
    });


    $(".light").on("mousedown", function(e) {
        if((!playersTurn) || (!clickedBtn(e))) return false;

        $(this).addClass("active");
        playerclick = true;

        var checkLight = check(this.dataset.color);
        if(checkLight.status) {
            if(patternError) patternError = false;

            playSound(colors.indexOf(this.dataset.color), this.dataset.wave, 400);

            if(checkLight.win) {return success();}
            if(checkLight.lastmatch) {nextRound = true; playerSounds.length = 0;}
        } else {
            playerSounds.length = 0;
            error();
        }
    });

    $(".light").on("mouseup", function(e) {
        if((!playersTurn) || patternError) return false;
        $(this).removeClass("active");
        if(playerclick) {
            playerclick = false;
            stopSound();
            if(nextRound) {
                showRounds(true);
                simonSpeaks(true);
                nextRound = false;
                playersTurn = false;
            }
        }
    });

    $(".light").on("mouseenter", function(e) {
        if(!playersTurn) return false;
        $(this).addClass("active");
    }).on("mouseleave", function(e) {
        if(!playersTurn) return false;
        $(this).removeClass("active");
        if(playerclick) {
            playerclick = false;
            stopSound();
            if(nextRound) {
                showRounds(true);
                simonSpeaks(true);
                nextRound = false;
                playersTurn = false;
            }
        }
    });
}

init();
