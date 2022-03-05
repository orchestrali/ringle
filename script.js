var rowArr = [];
var method;
var rownum = 0;
var place = 0;
var board = [[]];
var check = 0;
var stage = 6;
var guesses = 6;
var easymode = true;
var solutions;
var current = {row: 1, place: 1};
var gameover = false;
var changestage;
var darktheme;

if (localStorage.getItem("darktheme")) {
  setdark();
}

$(function() {
  dimensions();
  window.addEventListener("resize", dimensions);
  if (!localStorage.getItem("stage") || Number(localStorage.getItem("stage")) === 6) {
    loadMethods();
  } else {
    stagechange(Number(localStorage.getItem("stage")));
  }
  $("#help,#settings").hide();
  $("body").on("keyup", clickorkey);
  $(".keyboard").on("click", "button", clickorkey);
  $("#help-button").on("click", (e) => {
    $("#help").show();
    $("#overlay").css("display", "flex");
  });
  $("#settings-button").on("click", (e) => {
    $("#settings").show();
    $("#overlay").css("display", "flex");
  });
  $(".close").on("click", (e) => {
    $("#overlay,#help,#settings").hide();
  });
  $(".dialogclose").on("click", () => {
    $("#dialog").hide();
  });
  if (!localStorage.getItem("visited")) {
    $("#help-button").click();
    localStorage.setItem("visited", "true");
    localStorage.setItem("stage", 6);
  }
  $(".cancel").on("click", () => {
    $(".dialog").hide();
  });
  $("#resetbutton").on("click", () => {
    $(".dialog").hide();
    stagechange(changestage);
  });
  $(".stage-tile").on("click", (e) => {
    let n = Number($(e.target).text());
    if (n != stage) {
      if (gameover) {
        stagechange(n);
      } else {
        changestage = n;
        $("#resetdialog").show();
      }
    }
  });
  $("#dark-theme").on("click", setdark);
  
});


function dimensions() {
  let e = window.innerHeight;
  $("body").css("height", e+"px");
  let keyboardheight = 132;
  if (e < 400) keyboardheight = 132/400*e;
  $(".keyboard").css("max-height", keyboardheight+"px");
  //console.log(e);
  if (e > window.innerWidth) {
    solutions = $("#notes").text();
    $("#solution-container").hide();
    $("#notes").text("");
  } else if (solutions) {
    $("#solution-container").css("display", "flex");
    $("#notes").text(solutions);
    solutions = null;
  }
  let a = Math.min(Math.floor((e-50-keyboardheight) * (stage / guesses)), stage*70);
  let w = (document.getElementById("game").clientWidth-250)/2;
  $("#dialog,#resetdialog").css("left", w+"px");
  let s = guesses * Math.floor(a / stage);
  $(".board").css({width: a+"px", height: s+"px"});
}

function buildanswer() {
  gameover = false;
  rownum = 0, place = 0;
  rowArr = [];
  let startrow = [];
  for (let p = 1; p <= stage; p++) {
    if (method.hunts.includes(p)) {
      startrow.push(p);
    } else {
      let num = Math.ceil(Math.random() * stage);
      while (startrow.includes(num) || method.hunts.includes(num)) {
        num = Math.ceil(Math.random() * stage);
      }
      startrow.push(num);
    }
  }
  let prevrow = startrow;
  let changes = Math.max(method.leadLength+guesses-2, guesses);
  //console.log(changes);
  for (let i = 0; i < changes; i++) {
    let row = [];
    let change = method.plainPN[i%method.leadLength];
    let dir = 1;
    for (let p = 0; p < stage; p++) {
      if (change === "x" || !change.includes(p+1)) {
        row.push(prevrow[p+dir]);
        dir *= -1;
      } else if (change.includes(p+1)) {
        row.push(prevrow[p]);
      } 
    }
    rowArr.push(row);
    prevrow = row;
  }
  if (changes > guesses) {
    let start = Math.floor(Math.random() * (changes-guesses));
    if (start%2 === 1) start -= 1;
    rowArr = rowArr.slice(start, start+guesses);
  }
  //console.log(rowArr.length);
}

function loadMethods() {
  $(".board .game-tile").attr("data-state", "").text("");
  $(".keyboard .button").attr("data-state", "");
  $(".board .game-row").css("grid-template-columns", "repeat("+(stage)+", 1fr)");
  $.get(stage === 8 ? "methods.json" : "minor.json", function(data) {
    if (stage === 8 && easymode) {
      data = data.filter(m => {
        let i = 0;
        while (i < m.plainPN.length && !Array.isArray(m.plainPN[i])) {
          i+=2;
        }
        return m.plainPN.length > 1 && i >= m.plainPN.length;
      });
    }
    console.log(data.length);
    let num = Math.floor(Math.random() * data.length);
    let played = localStorage.getItem("played");
    let arr;
    if (played) {
      arr = played.split(",").map(n => Number(n));
      while (arr.includes(num)) {
        num = Math.floor(Math.random() * data.length);
      }
      
      arr.push(num);
      if (arr.length === data.length) arr = [num];
    } else {
      arr = [num];
    }
    method = data[num];
    let search = {
      stage: stage,
      methodClass: method.class,
      methodName: method.name.replace(/ /g, "+"),
      leadhead: "rounds",
      otherLeadhead: "",
      quantity: "plaincourse",
      type: "grid",
      numbers: "show",
      player: "include",
      huntBellw: 1,
      huntColor: "red",
      blueBell: 2,
      blueBellw: 2,
      blueBellc: "blue",
      tenors: "0",
      sounds: "tower",
      numrounds: 2,
      huntbells: "draw"
    };
    let link = "https://www.changeringing.net/?";
    for (let key in search) {
      if (key != "stage") link += "&";
      link += key + "=" + search[key];
    }
    $("#method").html(`<a href="${link}#svgs" target="blank">${method.name}</a>`);
    buildanswer();
    //console.log(data.length);
    //console.log(data.filter(o => o.class === "Surprise").length);
    //localStorage.setItem("played", arr.join(","));
  });
}

function setdark(e) {
  if (e) {
    darktheme = !$("#dark-theme").hasClass("checked");
  } else {
    darktheme = localStorage.getItem("darktheme");
  }
  if (darktheme) {
    $("#dark-theme").addClass("checked");
    $("body").addClass("nightmode");
    localStorage.setItem("darktheme", "true");
  } else {
    $("#dark-theme").removeClass("checked");
    $("body").removeClass("nightmode");
    localStorage.removeItem("darktheme");
  }
}


function clickorkey(e) {
  let key;
  let parent;
  switch (e.type) {
    case "keyup":
      let i = "!@#$%^&*".indexOf(e.key);
      parent = (e.shiftKey || i > -1 ? "solution" : "guess") + "-container";
      key = i > -1 ? "12345678"[i] : e.key;
      break;
    case "click":
      parent = $(e.target).parents(".game-container").attr("id");
      key = $(e.currentTarget).attr("data-key");
      break;
  }
  
  if (key.includes("Arrow")) {
    //navigate solutions
    if (!solutions) {
      navigate(key);
    }
  } else if (["←","Backspace"].includes(key)) {
    //remove number
    backspace(parent);
  } else if (["↵", "Enter"].includes(key) && !gameover) {
    //check guess
    checkGuess()
  } else if ("12345678".includes(key) && Number(key) <= stage) {
    addtoboard(parent, key);
  }
}

function navigate(key) {
  //console.log(key);
  let change;
  switch (key) {
    case "ArrowLeft":
      if (current.place > 1) {
        change = true;
        current.place--;
      }
      break;
    case "ArrowUp":
      if (current.row > 1) {
        change = true;
        current.row--;
      }
      break;
    case "ArrowDown":
      if (current.row < guesses) {
        change = true;
        current.row++;
      }
      break;
    case "ArrowRight":
      if (current.place < stage) {
        change = true;
        current.place++;
      }
      break;
  }
  if (change) {
    $(".current").removeClass("current");
    $("#solution-container .game-row:nth-child("+current.row+") > .game-tile:nth-child("+current.place+")").addClass("current");
  }
}

function backspace(parent) {
  if (parent.includes("solution")) {
    $("#solution-container .game-row:nth-child("+current.row+") > .game-tile:nth-child("+current.place+")").text("").attr("data-state", "");
  } else if (parent.includes("guess") && place > 0) {
    board[rownum].pop();
    place--;
    $("#guess-container .game-row:nth-child("+(rownum+1)+") > .game-tile:nth-child("+(place+1)+")").text("").attr("data-state", "");
  }
}

function addtoboard(parent, key) {
  let row = parent.includes("guess") ? rownum+1 : current.row;
  let p = parent.includes("guess") ? place+1 : current.place;
  if (place < stage || parent.includes("solution")) {
    let tile = $("#"+parent+" .game-row:nth-child("+row+") > .game-tile:nth-child("+p+")");
    tile.text(key);
    if (parent.includes("guess")) {
      
      tile.attr("data-state", "tbd");
      
      board[rownum].push(Number(key));
      place++;
    }
  }
  
}

function checkGuess() {
  if (place < stage) {
    //not enough numbers!
    alert("Guess is too short!");
  } else if ([1,2,3,4,5,6,7,8].some(n => n <= stage && !board[rownum].includes(n))) {
    //not all numbers included!
    alert("Guess has a duplicate");
  } else {
    evaluate();
  }
}

function evaluate() {
  let i = check;
  if (!board || !rowArr || rownum >= board.length || rownum >= rowArr.length || place < stage) {
    console.log(board);
    console.log(rowArr);
    alert("Sorry, something has gone wrong! Try reloading");
  } else {
    let datastate;
    let tile = $("#guess-container .game-row:nth-child("+(rownum+1)+") .game-tile:nth-child("+(i+1)+")");
    
    let button = $('#guess-container button[data-key="'+board[rownum][i]+'"]');
    if (board[rownum][i] === rowArr[rownum][i]) {
      datastate = "correct";
      
    } else if ((i > 0 && board[rownum][i] === rowArr[rownum][i-1]) || (i < stage-1 && board[rownum][i] === rowArr[rownum][i+1])) {
      datastate = "present";
    } else {
      datastate = "tbd";
      //button.attr("data-state", "");
    }
    tile.css("transform","rotateX(-90deg)");
    setTimeout(() => {
      tile.attr({"data-state": datastate});
      tile.css("transform","rotateX(0)");
    }, 250);
    if (i < stage-1) {
      check++;
      setTimeout(evaluate, 200);
    } else {
      
      setTimeout(() => {
        for (let j = 0; j < stage; j++) {
          let tile = $("#guess-container .game-row:nth-child("+(rownum)+") .game-tile:nth-child("+(j+1)+")");
          let button = $('#guess-container button[data-key="'+board[rownum-1][j]+'"]');
          if (tile.attr("data-state") === "correct") {
            $("#solution-container .game-row:nth-child("+(rownum)+") .game-tile:nth-child("+(j+1)+")").text(board[rownum-1][j]);
          }
          button.attr("data-state", tile.attr("data-state"));
        }
      }, 250);
      
      
      if (board[rownum].length === stage && board[rownum].every((n,j) => rowArr[rownum][j] === n)) {
        setTimeout(() => {
          $("#method").prepend(`<p>🎉🎉🎉</p>`);
          $("#dialog").show();
          gameover = true;
        }, 500);
      } else {
        rownum++;
        if (rownum === guesses) {
          setTimeout(() => {
          $("#method").prepend(`<p>Oh no, no more guesses!</p>`);
          $("#dialog").show();
          gameover = true;
        }, 500);
        } else {
          board.push([]);
          place = 0;
          check = 0;
        }
      }


    }
  }
  
}

function stagechange(n) {
  //add/remove tiles and buttons
  if (n > stage) {
    let diff = n-stage;
    for (let i = 0; i < diff; i++) {
      $(".board .game-row").append('<div class="game-tile"></div>');
    }
    for (let b = stage+1; b <= n; b++) {
      $(".keyboard .row:first-child").append(`<button data-key="${b}">${b}</button>`);
    }
  } else if (n < stage) {
    $(".board .game-row .game-tile:nth-child(n+"+(n+1)+")").remove();
    $(".keyboard .row:first-child button:nth-child(n+"+(n+1)+")").remove();
  }
  
  //add/remove hard mode option
  //n >= 8 ? $("#hardsetting").show() : $("#hardsetting").hide();
  //actually update stage and localstorage
  stage = n;
  localStorage.setItem("stage", n);
  $(".stage-tile.selected").removeClass("selected");
  let c = stage/2-2;
  $(".stage-tile:nth-child("+c+")").addClass("selected");
  changestage = null;
  //reset game
  dimensions();
  loadMethods();
}