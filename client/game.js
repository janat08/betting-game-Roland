// import * as hyperHTMLRaw from '/node_modules/hyperhtml';
// const hyperHTML = hyperHTMLRaw.default;
// import hyperHTML from '/node_modules/hyperhtml/esm/index.js'
const hyperHTML = require('hyperhtml/cjs').default;


var a
Template.game.onCreated(function(){
    this.subscribe('games')
    this.autorun(function(){
        if (Template.instance().subscriptionsReady()) {
             var a = Games.findOne({}, {sort: {start: -1}, limit: 1})
            Template.instance().currentGame = a
            Session.set("deadLine", new Date(a.deadline))
        }
    })
})

Template.game.onRendered(function(){
    a = document.querySelector('#time')
    setInterval(tick, 100,
        hyperHTML.bind(a)
    );
})

Template.game.helpers({
    eligibility() {
        var a = Games.findOne({}, {sort: {deadline: -1}})
        if (!a.bettors.length){
            return true
        }
        var arr = a.bettors
        var bettor = arr.find((user)=>user.userId==Meteor.userId())
        console.log(arr, bettor)
        if (a.bottom>bettor.bet){
            return false
        }
        if (a.top<bettor.bet){
            return false
        }
        return true
    },
    pot(){
        return Games.findOne({}, {sort: {start: -1}, limit: 1}).pot
    },
    bets(){
        return Games.findOne({}, {sort: {start: -1}, limit: 1}).bets
    },
    betAmount() {
        return Conf.betIncrement
    },
    balance() {
        return Meteor.user().balance
    },
    watcher(){
        return JSON.stringify(Games.findOne({}, {sort: {start: -1}}))
    },

});

Template.game.events({
    "click .bet"(event){
        Meteor.call("bet", Template.instance().currentGame, function(error, res){
            if (error){
                 return console.log(error.error)
                // console.warn(error.error)
            } else {
                return res
            }
        })
    },
});


function watch() {
    Timer = Meteor.setInterval(
        function () {
            Session.set("countDown", Math.trunc((Session.get("deadLine")-new Date())/100)/10)
        }, 100
    )
}

function tick(render) {
    var b = Session.get("deadLine")
    render`
    <span>
      ${Math.trunc((b-new Date())/100)/10}
    </span>
  `;
}

//      <h2>It is ${Math.trunc((a-new Date())/100)/10}.</h2>
 // getElementById('time')
