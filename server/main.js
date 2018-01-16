import { Meteor } from 'meteor/meteor';
import {start} from "/lib/methods.js"
// Meteor.startup(() => {


Meteor.startup(function(){
    var a = Config.findOne()
    if (!a){
        Conf = Constants.reduce(function (a, v, i) {
            a[v] = Defaults[i]
            return a
        }, {})
        Config.insert(
            Conf
        )
    } else {
        Conf = a
    }
    start()

})

UserPresence.onUserOnline(function(connection){
    Config.update({}, {$set: {online: Meteor.users.find({online: true}).count()}})
    Meteor.users.update({_id:connection}, {$set:{online:true}})

});
UserPresence.onUserOffline(function(connection){
    Config.update({}, {$inc: {online: -10}})
    console.log(connection)
        Meteor.users.update({_id:connection}, {$set:{online:false}})
});

UserPresence.onCleanup(function(){
    var a = Config.update({}, {$set: {online: 0}})
    Meteor.users.update({}, {$set:{online: false}}, {multi: true})
});

if (!Meteor.users.find({username: "house"}).count()){
    Accounts.createUser({username: "house", password: "house", email: "house@house"})
}


Accounts.onCreateUser(( options, user ) => {
    return Object.assign({}, user, {balance: Conf.userCredits})
    });

Tracker.autorun(function(){
    Config.findOne()
})

Meteor.startup(function(){
    Meteor.users._ensureIndex({ "balance": -1});
})
Games._ensureIndex({ "start": -1});
