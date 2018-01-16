
Template.info.onCreated(function () {

});

Template.info.helpers({
    users() {
        var ab = Meteor.users.find({}, {sort: {online: -1, balance: -1}})
        ab = ab.map(x=>{
            x.email = x.emails[0].address;
            return x
        })
        return ab
        var a = Games.findOne({}, {sort: {start: -1}})
            if (a == undefined){
            return ab
            }
            var b=a.bettors
            if (b == undefined){
                return ab
            }
            ab.map((x)=>{
                var c = b.find((x)=>x.userId==Meteor.userId());
                if (c == undefined){
                    return ab
                }
                x.bet = c.bet

            })
        return a
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
