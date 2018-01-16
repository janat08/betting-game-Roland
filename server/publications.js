import {Meteor} from "meteor/meteor";

Meteor.publish('config', function () {
    return Config.find()
});

Meteor.publish("games", function () {
    return Games.find()
    }
)

Meteor.publish("user", function(){
    return Meteor.users.find()
})
