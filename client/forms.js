
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
        if (Template.instance().subscriptionsReady()) {
            var a = Config.findOne()
            var b = Constants.map((x,i)=>{return {val: a[x], name: x}})
            return b
        } else {

        }
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
        Meteor.call('configure', a);
    },
    "click .newGame"(event){
        Meteor.call("newGame")
    }
});

Template.fields.helpers({

})

Template.fields.events({

})
