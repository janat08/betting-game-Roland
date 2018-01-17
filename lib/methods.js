
var deadline
var currentGameId, currentGame
var increment
var timesTimerStepDecrementByBets
var gameFinishing, gameEnd


//TODO deadline is still moving up with every bet
//TODO enable top bracket rejection
//TODO enable bets
Meteor.methods({
    'configure'(data) {
        Config.update({}, data)
    },
    "newGame"(){
        endGame()
    },
});
if (Meteor.isServer){
    Meteor.methods({

        "bet" (gameId) {
            if (this.isSimulation){
                return
            }
            if (typeof this.userId == "undefined") {
                throw new Meteor.Error("not logged in")
            }
            if (Meteor.user().balance < Conf.betIncrement) {
                throw new Meteor.Error("out of credits")
            }
            if (currentGameId != gameId) {
                throw new Meteor.Error("too late")
            }

            var newD = new Date()*1

            var user = undefined
            if (currentGame.bottom != undefined && currentGame.bettors.length) {
                user = currentGame.bettors.find((user)=>{return this.userId == user.userId})
                if (user != undefined){
                    if (currentGame.bottom>=user.bet) {
                        throw new Meteor.Error("ineligible at bot")
                    }
                    if(currentGame.top<=user.date){
                        throw new Meteor.Error("ineligible at top")
                    }
                    user.bet+=Conf.betIncrement
                    user.date = newD
                } else {
                    if (Conf.betIncrement<=currentGame.bottom){
                        throw new Meteor.Error("ineligible at bot")
                    }
                    user = {userId: this.userId, bet: Conf.betIncrement, date: newD}
                    currentGame.bettors.push(user)

                }
            } else {
                user = {userId: this.userId, bet: Conf.betIncrement, date: newD}
                currentGame.bettors= [user]

            }

            currentGame.pot += Conf.betIncrement
            currentGame.bottom = Math.floor((Conf.ineByLowShareOfPot*(currentGame.pot)))
            currentGame.bets += 1


            // @summary decrements increment of timer
            if (currentGame.bets >= Conf.timerStepDecrementByBets * (timesTimerStepDecrementByBets + 1)) {
                timesTimerStepDecrementByBets += 1
                increment = Conf.timerIncrement - Math.floor(currentGame.bets / Conf.timerStepDecrementByBets) * Conf.timerStepDecrementByAmount
                Config.update({}, {$set: {timer: increment}})
            }
            var old = newD+increment*1000
            currentGame.deadline = old
            deadline = old


            //@summary calculate the top bracket from the eligible players
            if (currentGame.bettors.length){
                var bettors = currentGame.bettors.sort((x,y)=>y.date-x.date)
                var eligibleNum =  0
                if (Conf.betIncrement>currentGame.bottom){
                    eligibleNum += (Conf.online)
                } else {
                   eligibleNum +=  bettors.filter(x=>x.bet>=currentGame.bottom).length
                }
                // if(!!currentGame.top){
                //     eligibleNum -= bettors.filter(x=>currentGame.top <= x.date).length
                // }

                var eligibleIndex = Math.ceil(Conf.ineByLowShareOfPot*(eligibleNum))-1
            //     var eligibleTop = bettors.map((x,i)=>{
            //         if (i eligibleIndex})
                var eligibleTop = bettors[eligibleIndex].date
                if (bettors.length>1){
                    if(eligibleTop == bettors[eligibleIndex+1].date){
                        eligibleTop -= 1
                    }
                }
                currentGame.top = eligibleTop
            }

            var cd
            cd = Promise.await(Games.rawCollection().findAndModify(
                {_id: currentGameId},
                [],
                {
                    $inc: {
                        pot: Conf.betIncrement,
                        bets: 1,
                    },
                    $set: {deadline: currentGame.deadline,
                        bottom: Conf.ineByLowShareOfPot*(currentGame.pot),
                        top: eligibleTop,
                        bettors: currentGame.bettors
                    }
                },
                {new: true, multi:true}
            ))
            // }
            currentGame = cd.value

            Meteor.users.update(this.userId,
                {$inc: {balance: Conf.betIncrement * -1}}
            )
        }
    })
}



export function start() {
    increment = Conf.timerIncrement
    Config.update({}, {$set: {timer: increment}})
    timesTimerStepDecrementByBets= 0
    gameFinishing = false
    gameEnd = undefined
    var a = new Date()
    var newDeadLine = a.setSeconds(a.getSeconds() + Conf.timerDefault)
    var id = Games.insert({deadline: newDeadLine, bettors: [], pot: 0, start: new Date()*1})
    deadline = newDeadLine
    currentGameId = id
    currentGame = {_id: id, deadline: newDeadLine, bettors: [], pot: 0, start: new Date()*1}
    currentGame = Games.findOne({_id: currentGameId})
     watch()
}

function watch() {
    Timer = Meteor.setInterval(
        function () {
            if (!gameFinishing && currentGame.bets >= 10 && (deadline-new Date()<1000)){
                var newer = Math.trunc((Math.random()*(Conf.randomLimitTop-Conf.randomLimitBot)+Conf.randomLimitBot))
                gameFinishing = true
                gameEnd = newer
                return
            }

            if (gameEnd <= currentGame.bets){
                    endGame()
            }

            if (deadline < new Date()) {

                endGame()

                return
            }


        }, 500
    )
}

var rank

function endGame (){
    Meteor.clearInterval(Timer)
    console.log("Game Ended")
    if (!currentGame.bettors.length){
        start()
        return
    }
    rank = currentGame.bettors.sort((a,b)=> b.date-a.date)
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
