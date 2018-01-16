
var deadline
var currentGameId, currentGame
var increment
var timesRandomed
var timesTimerStepDecrementByBets

Meteor.methods({
    'configure'(data) {
        Config.update({}, data)
    },
    "newGame"(){
        endGame()
    },
    "bet" (game) {
        // if (this.isSimulation){
        //     return
        // }
        if (typeof this.userId == "undefined") {
            throw new Meteor.Error("not logged in")
        }
        if (Meteor.user().balance < Conf.betIncrement) {
            throw new Meteor.Error("out of credits")
        }
        if (currentGameId != game._id) {
            throw new Meteor.Error("too late")
        }

        var user = undefined
        if (currentGame.bottom != undefined && currentGame.bettors.length) {
            user = currentGame.bettors.find((user)=>{return this.userId == user.userId})
            if (user != undefined){
                if (currentGame.bottom>=user.bet) {
                    throw new Meteor.Error("ineligible at bot")
                }
                // if(currentGame.top <= user.bet){
                //     throw new Meteor.Error("ineligible at top")
                // }
                user.bet+=Conf.betIncrement
            } else {
                if (Conf.betIncrement<=currentGame.bottom){
                    throw new Meteor.Error("ineligible at bot")
                }
                currentGame.bettors= currentGame.bettors.push({userId: this.userId, bet: Conf.betIncrement})
                user = {userId: this.userId, bet: Conf.betIncrement}
            }
        } else {
            user = {userId: this.userId, bet: Conf.betIncrement}
            currentGame.bettors= [{userId: this.userId, bet: Conf.betIncrement}]

        }

        currentGame.pot += Conf.betIncrement
        currentGame.bottom = (Conf.ineByLowShareOfPot*(currentGame.pot))

        
        // @summary decrements increment of timer
        currentGame.bets+=1
        if (currentGame.bets >= Conf.timerStepDecrementByBets*(timesTimerStepDecrementByBets+1)){
            timesTimerStepDecrementByBets += 1
            increment = Conf.timerIncrement - Math.floor(currentGame.bets/Conf.timerStepDecrementByBets)*Conf.timerStepDecrementByAmount
        }


        var old = new Date()*1+increment*1000
        currentGame.deadline = old
        deadline = old


        if (currentGame.bettors.length){

            var bettors = currentGame.bettors.sort((x,y)=>y.bet-x.bet)
            var eligibleNum =  bettors.length
            if (Conf.betIncrement>currentGame.bottom){
                eligibleNum += (Conf.online - bettors.length)
            }

            var eligibleIndex = Math.ceil(Conf.ineByLowShareOfPot*(bettors.length+eligibleNum))
            var eligibleTop = bettors[eligibleIndex-1].bet
            currentGame.top = eligibleTop
            // currentGame.bettors = bettors.map((x, i)=>{
            //     if (i<eligibleInex){
            //         x.eligibleTop = false
            //     } else {
            //         x.eligibleTop = true
            //     }
            //     return x
            // })
        }



            /*

             */

            var cd
            // if (typeof currentGame.bettors == "undefined" || !user) {
            //     cd = Promise.await(Games.rawCollection().findAndModify(
            //     {
            //         _id: currentGameId
            //     },
            //     [],
            //     {
            //         $addToSet: {
            //             bettors: {
            //                 userId: this.userId, bet :Conf.betIncrement
            //             }
            //         },
            //         $inc: {
            //             pot: Conf.betIncrement, bets:1,
            //         },
            //         $set: {
            //             deadline: new Date()*1+increment*1000,
            //            // top: eligibleAmount*Conf.ineByTopShareOfPot,
            //             bottom: currentGame.bottom,
            //         }
            //     },
            //     {new: true},
            // ))
            // } else {
                cd = Promise.await(Games.rawCollection().findAndModify(
                    {_id: currentGameId},
                    [],
                    {
                        $inc: {
                            pot: Conf.betIncrement,
                            bets: 1,
                        },
                        $set: {deadline: new Date()*1+increment*1000,
                       //     top: commited*Conf.ineByTopShareOfPot,
                            bottom: Conf.ineByLowShareOfPot*(currentGame.pot),
                            top: eligibleTop,
                            bettors: currentGame.bettors
                        }
                    },
                    {new: true, multi:true}
                ))
            // }
            currentGame = cd.value
                console.log(cd.value)
        Meteor.users.update(this.userId,
            {$inc: {balance: Conf.betIncrement * -1}}
        )
    }
});
if (Meteor.isServer){

}



export function start() {
    increment = Conf.timerIncrement
    timesRandomed = 0
    timesTimerStepDecrementByBets= 0
    var a = new Date()
    var newDeadLine = a.setSeconds(a.getSeconds() + Conf.timerDefault)
    var id = Games.insert({deadline: newDeadLine, bettors: [], pot: 0, start: new Date()*1})
    deadline = newDeadLine
    currentGameId = id
    currentGame = {_id: id, deadline: newDeadLine, bettors: [], pot: 0,}
    currentGame = Games.findOne({_id: currentGameId})
     watch()
}

function watch() {
    Timer = Meteor.setInterval(
        function () {
            if (currentGame.bets >= 10*(timesRandomed+1) && (deadline-new Date()<1000)){
                var newer = Math.trunc(new Date()*1+(Math.random()*(Conf.randomLimitTop-Conf.randomLimitBot)+Conf.randomLimitBot)*1000)
                timesRandomed+=1
                deadline= newer
                currentGame.deadline = newer
                Games.update({_id: currentGameId}, {$set: {deadline: newer}})
                currentGame = Games.find({_id: currentGameId})
                return
            }
            if (deadline < new Date()) {

                endGame()

                return
            }


        }, 300
    )
}

var rank

function endGame (){
    Meteor.clearInterval(Timer)
    console.log("Game Ended")
    if (typeof currentGame == "undefined" || typeof currentGame.bettors == "undefined"){
        start()
        return
    }
    rank = currentGame.bettors.sort((a,b)=> b.bet-a.bet)
    var pot = currentGame.pot
    var fee = Math.ceil(pot*Conf.houseFee)
    pot = pot -fee
    Meteor.users.update({username: "house"}, {$inc: {balance: fee}})
    var table = rewardCalc([], pot)
    if (rank.length < table.length){
        table = table.reduce(compactTableForRank, Array(rank.length).fill(0,0,rank.length))
    }

    table.forEach(transactions)

    function transactions(x, i){
        Meteor.users.update({_id: rank[i].userId}, {$inc: {balance: x}})
    }

    start()
}

function rewardCalc (table, amount){
    if (amount<1){
        return table
    }
    var b = Math.ceil(Conf.winningsDestribution*amount)
    var a = amount-b
    table.push(b)
    return rewardCalc(table, a)
}

function compactTableForRank(a, x, i, z){
    if (i+1>rank.length){
        var divisor =Math.floor(i/rank.length)
        i = i%divisor
    }
        a[i] += x
    return a
}
