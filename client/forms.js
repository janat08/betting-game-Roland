
Template.forms.onCreated(function () {
    var self = this
    var handle = this.subscribe("config")
    this.autorun(function(){
        if (handle.ready()){
            self.values = Config.findOne()
        }
    })
    this.values = Config.findOne()
});

Template.forms.helpers({
    forms() {
        return Constants
    },
});

Template.forms.events({
    "input .value"(event){
      var val = event.target.value
      var prop = event.target.name
        Template.instance().values[prop] = val*1
    },
    'click .forms'(event) {
    var a = Template.instance().values
    console.log(a, "values")
        Meteor.call('configure', a);
    },
    "click .newGame"(event){
        Meteor.call("newGame")
    }
});

Template.fields.helpers({
    value() {
        if (Template.instance().subscriptionsReady()) {
            return Config.findOne()[Template.currentData()]
        } else {
            null
        }
    },
    data() {
        return Template.currentData()
    }
})

Template.fields.events({

})
