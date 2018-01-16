import {Meteor} from "meteor/meteor";

Config = new Mongo.Collection('config');
Games = new Mongo.Collection("games");
Constants = ["betIncrement", "timerDefault", "timerIncrement", "ineByLowShareOfPot", "ineByTopShareOfPot", "timerStepDecrementByBets", "timerStepDecrementByAmount", "randomLimitBot", "randomLimitTop", "houseFee", "lastBetWinnings", "winningsDestribution"]
Constants.push("userCredits") //online ppl is here
Defaults = [1, 5, 3, .1, .1, 10, 0.5, 3, 30, .02, .2, .2]
Defaults.push(10)

var oldBalance
Tracker.autorun(function(){
    if (Meteor.isClient){
        var handle = Meteor.subscribe("config")
        if (handle.ready()){
            Conf = Config.findOne()
        }
    } else {
        Conf = Config.findOne()
        if (typeof Conf == "undefined"){
            return
        }
        if (typeof oldBalance == "undefined"){
            oldBalance = Conf.userCredits
        } else if (oldBalance != Conf.userCredits) {
            var a = Meteor.users.update({username: {$ne: "house"}}, {$set: {balance: Conf.userCredits}}, {multi:true})
            console.log("modified users", a, Conf.userCredits)
        }
    }
})
Meteor.startup(function(){

})
