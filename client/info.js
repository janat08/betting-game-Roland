
Template.info.onCreated(function () {

});

Template.info.helpers({
    users() {
        var ab = Meteor.users.find({}, {sort: {online: -1}, fields: {emails:1, balance: 1, online:1}})
        ab = ab.map(x=>{
            x.email = x.emails[0].address;
            return x
        })
    // return ab

        var a = Session.get("game")
            if (a == undefined){
            return ab
            }
            var b=a.bettors
            if (!b.length){
            ab = ab.map(x=>{x.date = undefined, x.bet = undefined; return x})
                return ab
            }
            ab = ab.map((x)=>{
                let c = undefined
                c = b.find((y)=>{return y.userId==x._id});
                if (c == undefined){
                    return x
                }
                x.bet = c.bet
               x.date = Math.trunc((c.date-a.start)/100)/10
            console.log(a.start, c.date, c)
                return x
            }).sort((x,y)=>{
                return y.date-x.date})
    console.log(ab)
        return ab
    },
    onlineBold(param, email){
        if (param == true){
            return `<strong> ${email} </strong>`
            // return {
            //     style: {color: "green"}
            // }
        } else {
            return email
            // return
        }
        return ``
    },
    onlineC(){
        return Config.findOne().online
    }
});

Template.info.events({

});
