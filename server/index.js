const express = require("express");
const app = express();

const http = require("http");

const expressServer = http.createServer(app);

const cors = require("cors");
app.use(cors);

const socketIO = require("socket.io");
const io = socketIO(expressServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
const users = [];

let cards = [
  "JS",
  "9S",
  "AS",
  "10S",
  "KS",
  "QS",
  "8S",
  "7S",
  "JH",
  "9H",
  "AH",
  "10H",
  "KH",
  "QH",
  "8H",
  "7H",
  "JC",
  "9C",
  "AC",
  "10C",
  "KC",
  "QC",
  "8C",
  "7C",
  "JD",
  "9D",
  "AD",
  "10D",
  "KD",
  "QD",
  "8D",
  "7D",
];




let bids = [];
let selectedTrump;
let gameCards = [];
let gameCardsNum = [];
let showTrump = false;
let sum = 0;
let oneAndThree = 0;
let twoAndFour = 0;

//cards with trump card calculation
const cardNumTrump = (item) => {
  let sT = selectedTrump[selectedTrump?.length - 1];
  let num;
  if (item.card[0] === "J" && item.card[item.card?.length - 1] === sT) {
    num = 12;
  } else if (item.card[0] === "9" && item.card[item.card?.length - 1] === sT) {
    num = 11;
  } else if (item.card[0] === "A" && item.card[item.card?.length - 1] === sT) {
    num = 10;
  } else if (item.card[0] === "1" && item.card[item.card?.length - 1] === sT) {
    num = 9;
  } else if (item.card[0] === "K" && item.card[item.card?.length - 1] === sT) {
    num = 8;
  } else if (item.card[0] === "Q" && item.card[item.card?.length - 1] === sT) {
    num = 7;
  } else if (item.card[0] === "8" && item.card[item.card?.length - 1] === sT) {
    num = 6;
  } else if (item.card[0] === "7" && item.card[item.card?.length - 1] === sT) {
    num = 5;
  } else if (item.card[0] === "J") {
    num = 4;
  } else if (item.card[0] === "9") {
    num = 3;
  } else if (item.card[0] === "A") {
    num = 2;
  } else if (item.card[0] === "1") {
    num = 1;
  } else {
    num = 0;
  }

  return { id: item.id, card: num };
};

//cards without trump card

const cardNum = (item) => {
  let num;
  if (item.card[0] === "J") {
    num = 4;
  } else if (item.card[0] === "9") {
    num = 3;
  } else if (item.card[0] === "A") {
    num = 2;
  } else if (item.card[0] === "1") {
    num = 1;
  } else {
    num = 0;
  }
  return { id: item.id, card: num };
};

//card sum

const cardSum = (item) => {
  if (item.card === 12 || item.card === 4) {
    sum += 3;
  } else if (item.card === 11 || item.card === 3) {
    sum += 2;
  } else if (item.card === 10 || item.card === 2) {
    sum += 1;
  } else if (item.card === 9 || item.card === 1) {
    sum += 1;
  } else {
    sum += 0;
  }
};

const sendCardsToUser = () => {
  if (users.length === 4) {
    cards = cards.sort(() => 0.5 - Math.random());
    let s = 0;
    for (let i = 0; i < 4; i++) {
      io.to(users[i]).emit("cards", cards.slice(s, 8 * (i + 1)));
      s += 8;
    }
  }
};

const numOfPass = () => {
  let countPass = 0;
  for (let i = 0; i < bids.length; i++) {
    if (bids[i] === "pass") {
      countPass++;
    }
  }
  return countPass;
};
//---------------------------------------------------//

io.on("connection", (socket) => {
  //add user
  socket.join("game");
  users.push(socket.id);

  // send cards to all users
  if (users.length === 4) {
    cards = cards.sort(() => 0.5 - Math.random());
    let s = 0;
    for (let i = 0; i < 4; i++) {
      io.to(users[i]).emit("cards", cards.slice(s, 8 * (i + 1)));
      s += 8;
    }

    //send first person,your turn
    io.to(users[0]).emit("turn", "Your turn");
  }

  // receive all bids

  socket.on("bid",async (msg) => {
      //assign bids and send bids to all users
      if (socket.id === users[0]) {
        io.to(users[1]).emit("turn", "Your turn");

        bids[0] = msg;
        io.emit("bids", bids);
      } else if (socket.id === users[1]) {
        io.to(users[2]).emit("turn", "Your turn");

        bids[1] = msg;
        io.emit("bids", bids);
      } else if (socket.id === users[2]) {
        io.to(users[3]).emit("turn", "Your Turn");
        bids[2] = msg;
        io.emit("bids", bids);
      } else {
        io.to(users[0]).emit("turn", "Your turn");

        bids[3] = msg;
        io.emit("bids", bids);
      }

      //find out highest bid
      if (bids.length === 4 && numOfPass() === 3) {
        let highestBidIndex = bids.findIndex((bid) => bid !== "pass");
        io.to(users[highestBidIndex]).emit("trump", true); //send trump cards
        io.emit("highest-bid", bids[highestBidIndex]);
        io.emit("turn", "");
        io.to(users[highestBidIndex]).emit("turn","Your turn");

        // //for 0 and 2 person
        // if (bids[0] === "pass" && bids[2] === "pass") {
        //   if (bids[1] > bids[3]) {
        //     io.to(users[1]).emit("trump", true); //send trump cards
        //     io.emit("highest-bid", bids[1]);
        //     io.emit("turn", "");
        //   } else {
        //     io.to(users[3]).emit("trump", true); //send trump cards
        //     io.emit("highest-bid", bids[3]);
        //     io.emit("turn", "");
        //   }
        // }
        //  //for 1 and 3 person
        // else if (bids[1] === "pass" && bids[3] === "pass") {
        //   if (bids[0] > bids[2]) {
        //     io.to(users[0]).emit("trump", true); //send trump cards
        //     io.emit("highest-bid", bids[0]);
        //     io.emit("turn", "");
        //   } else {
        //     io.to(users[2]).emit("trump", true); //send trump cards
        //     io.emit("highest-bid", bids[2]);
        //     io.emit("turn", "");
        //   }
        // }
      }
    }
    //------------------------------------------------//
  );

  //receive trump card from client

  socket.on("select-trump", (msg) => {
    selectedTrump = msg;
    io.emit("selected-trump-card", msg);
  });

  //show trump
  socket.on("show-trump", (msg) => {
    showTrump = true;
  });

  //Game board section

  socket.on("card", (msg) => {
    let card;

    // console.log({ selectedTrump });

    gameCards.push({ id: socket.id, card: msg });
    io.emit("game-cards", gameCards);

    if (gameCards.length === 4) {
      if (showTrump) {
        gameCardsNum = gameCards.map((item) => cardNumTrump(item));
      } else {
        gameCards.forEach((item) => {
          gameCardsNum = gameCards.map((item) => cardNum(item));
        });
      }

      //sum of cards
      gameCardsNum.forEach((item) => cardSum(item));
      //sort of cards
      gameCardsNum = gameCardsNum.sort((a, b) => {
        return a.card - b.card;
      });

      // calculate  result
      let last = gameCardsNum[gameCardsNum?.length - 1]?.id;
      if (last === users[0] || last === users[2]) {
        oneAndThree += sum;
        io.emit("one-three", oneAndThree);
        sum = 0;
      } else if (last === users[1] || last === users[3]) {
        twoAndFour += sum;
        io.emit("two-four", twoAndFour);
        sum = 0;
      }

      let index = users.findIndex((user) => user === last);

      io.to(users[index]).emit("turn", "Your turn");

      console.log({ users, gameCards, gameCardsNum, index });

      //reset all
      // io.emit("reset-all","all");

      // io.emit("reset-highest-bid", 0);
      // io.emit("reset-selected-trump-card", 0);
      io.emit("reset-game-cards", []);
      // io.emit("reset-bids", 0);
      // io.emit("reset-item",4);
      // io.emit("reset-trump", false);

      //send cards to all user here
      // sendCardsToUser();

      // console.log({
      //   gameCards,
      //   gameCardsNum,
      //   sum,
      //   users,
      //   oneAndThree,
      //   twoAndFour,
      // });

      gameCards = [];
      gameCardsNum = [];
      bids = [];

      return;
    }

    //turn message to client side
    let index = users.findIndex((user) => user === socket.id);

    if (index === 3) {
      io.to(users[0]).emit("turn", "Your turn");
    } else if (index === 2) {
      io.to(users[3]).emit("turn", "Your turn");
    } else if (index === 1) {
      io.to(users[2]).emit("turn", "Your turn");
    } else if (index === 0) {
      io.to(users[1]).emit("turn", "Your turn");
    }
  });

  //disconnect
  socket.on("disconnect", () => {
    const index = users.findIndex((user) => user === socket.id);
    users.splice(index, 1);
    bids = [];
    gameCards = [];
    sum = 0;
  });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

expressServer.listen(4000, () => {
  console.log("Server is running...");
});
