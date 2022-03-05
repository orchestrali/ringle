var rowArr = [];
var method;
var rownum = 0;
var place = 0;
var board = [[]];
var check = 0;
var stage = Number($("game-row:first-child").attr("length"));
var guesses = $("game-row").length;
var easymode = true;

$(function() {
  console.log(stage + " " + guesses);
  $("game-row .row").css("grid-template-columns", "repeat("+stage+", 1fr)");
  $("#board").css("grid-template-rows", "repeat("+guesses+", 1fr)");
  dimensions();
  window.addEventListener("resize", dimensions);
  loadMethods();
  $("#keyboard button").on("click", addtoboard);
  $("body").on("keyup", addtoboard);
  
  $("#help-button").on("click", (e) => {
    $("#help").show();
    $("#info").hide();
    $("#overlay").css("display", "flex");
  });
  $("#info-button").on("click", () => {
    $("#help").hide();
    $("#info").show();
    $("#overlay").css("display", "flex");
  });
  $(".close").on("click", (e) => {
    $("#overlay").css("display", "none");
  });
  if (!localStorage.getItem("visited")) {
    $("#help-button").click();
    localStorage.setItem("visited", "true");
  }
});

function dimensions() {
  let e = document.getElementById("board-container");
  
  let a = Math.min(Math.floor(e.clientHeight * (stage / guesses)), stage*70);
  let s = guesses * Math.floor(a / stage);
  $("#board").css({width: a+"px", height: s+"px"});
}

function addtoboard(e) {
  let key;
  switch (e.type) {
    case "keyup":
      key = e.key;
      break;
    case "click":
      key = $(e.target).attr("data-key");
      break;
  }
  
  switch (key) {
    case "↵": case "Enter":
      //submit guess
      checkGuess();
      break;
    case "←": case "Backspace":
      //remove number
      if (place > 0) {
        board[rownum].pop();
        place--;
        $("game-row:nth-child("+(rownum+1)+") game-tile:nth-child("+(place+1)+") > div").attr("data-state", "empty").text("");
      }
      break;
    case "1":case "2":case "3":case "4":case "5":case "6":case "7":case "8":
      if (place < stage && Number(key) <= stage) {
        board[rownum].push(Number(key));
        $("game-row:nth-child("+(rownum+1)+") game-tile:nth-child("+(place+1)+") > div").attr({"data-state": "tbd", "data-animation": "pop"}).text(key);
        
        place++;
      }
      break;
  }
  
}

function loadMethods() {
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
    buildanswer();
    //console.log(data.length);
    //console.log(data.filter(o => o.class === "Surprise").length);
    //localStorage.setItem("played", arr.join(","));
  });
}

function buildanswer() {
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
  if (!board || !rowArr || rownum >= board.length || rownum >= rowArr.length) {
    console.log(board);
    console.log(rowArr);
    alert("Sorry, something has gone wrong! Try reloading");
  } else {
    if (board[rownum][i] === rowArr[rownum][i]) {
      //$("game-row:nth-child("+(rownum+1)+") game-tile:nth-child("+(i+1)+")").attr({"evaluation": "correct", letter: board[rownum][i]}).prop("reveal", true);
      $("game-row:nth-child("+(rownum+1)+") game-tile:nth-child("+(i+1)+") > div").attr({"data-state": "correct", "data-animation": "flip-out"});

      $('button[data-key="'+board[rownum][i]+'"]').attr("data-state", "correct");
    } else if ((i > 0 && board[rownum][i] === rowArr[rownum][i-1]) || (i < stage-1 && board[rownum][i] === rowArr[rownum][i+1])) {
      $("game-row:nth-child("+(rownum+1)+") game-tile:nth-child("+(i+1)+") > div").attr({"data-state": "present", "data-animation": "flip-out"});
      $('button[data-key="'+board[rownum][i]+'"]').attr("data-state", "present");
    } else {
      $("game-row:nth-child("+(rownum+1)+") game-tile:nth-child("+(i+1)+") > div").attr({"data-state": "tbd", "data-animation": "flip-out"});
      $('button[data-key="'+board[rownum][i]+'"]').attr("data-state", "");
    }
    if (i < stage-1) {
      check++;
      setTimeout(evaluate, 200);
    } else {
      if (board[rownum].every((n,j) => rowArr[rownum][j] === n)) {
        setTimeout(() => {
          alert("🎉🎉🎉\nMethod: "+method.name);
        }, 200);
      } else {
        rownum++;
        if (rownum === guesses) {
          alert("Oh no, no more guesses!\nMethod: "+method.name);
        } else {
          board.push([]);
          place = 0;
          check = 0;
        }
      }


    }
  }
  
}