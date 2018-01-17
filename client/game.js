// import * as hyperHTMLRaw from '/node_modules/hyperhtml';
// const hyperHTML = hyperHTMLRaw.default;
// import hyperHTML from '/node_modules/hyperhtml/esm/index.js'
const hyperHTML = require('hyperhtml/cjs').default;


Template.game.onCreated(function(){
    this.subscribe('games')
    this.rec = new ReactiveVar()
    this.autorun(function(){
        if (Template.instance().subscriptionsReady()) {
             var a = Games.findOne({}, {sort: {start: -1},
                 // fields: {_id: 1, deadline: 1}
             })
            Template.instance().currentId = a._id
            Session.set("game", a)
            console.log(Template.instance.rec)
            Session.set("deadLine", new Date(a.deadline))
        }
    })
    console.log(this.rec)
})

Template.game.onRendered(function(){
    var a = document.querySelector('#time')
    setInterval(tick, 100,
        hyperHTML.bind(a)
    );
})

Template.game.helpers({
    eligibility() {
        var a = Session.get('game')
        if (!a.bettors.length){
            return true
        }
        var arr = a.bettors
        var bettor = arr.find((user)=>user.userId==Meteor.userId())
        if (a.bottom>=bettor.bet){
            return false
        }
        if (a.top<=bettor.date){
            return false
        }
        return true
    },
    pot(){
        return Session.get("game").pot
    },
    bets(){
        return Session.get("game").bets
    },
    betAmount() {
        return Config.findOne().betIncrement
    },
    balance() {
        return Meteor.user().balance
    },
    timer() {
      return Config.findOne().timer
    },
    watcher(){
        return JSON.stringify(Session.get("game"))
    },

});

Template.game.events({
    "click .bet"(event, temp){
        Meteor.call("bet", temp.currentId, function(error, res){
            if (error){
                 return console.log(error.error)
                // console.warn(error.error)
            } else {
                return res
            }
        })
    },
});


function tick(render) {
    var a = Session.get('deadLine')
    // console.log(a, Math.trunc((a-new Date())/100)/10)
    render`
    <span>
      ${Math.trunc((a-new Date())/100)/10}
    </span>
  `;
}

