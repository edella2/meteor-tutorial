Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {
  Meteor.publish("tasks", function() {
    return Tasks.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  })
}

if (Meteor.isClient) {
  // This code only runs on client
  // assuming .isServer is server side only
  // how does metoer take information that is run on client
  // and store in server/DB?
  Meteor.subscribe("tasks");
  Template.body.helpers({
    tasks: function() {
      if (Session.get("hideCompleted")) {
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
      return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
    incompleteCount: function() {
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {


      event.preventDefault();

      var text = event.target.text.value;

      //Like create from PG like DBs, adds a new collection
      Meteor.call("addTask", text);

      // this will clear the form
      // event.target is it like $(this)?

      event.target.text.value = "";
    },
    "change .hide-completed input": function(event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });


  Template.task.helpers({
    isOwner: function() {
      return this.owner === Meteor.userId();
    }
  });
  //_id refers to the id of a specific inserted item
  //can set multiple events for task
  Template.task.events({
    "click .toggle-checked": function() {
      // Changes the check value to the opposite
      // True to false // false to true
      Meteor.call("setChecked", this._id, ! this.checked);
        // sets the opposite value of checked
    },
    "click .delete": function() {
      // remove takes one argument, a selector to remove from the collection
      Meteor.call("deleteTask", this._id);
    },
    "click .toggle-private": function() {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}


Meteor.methods({
  addTask: function(text) {
    // checks to see if user logged in
    // similar to session[:id] I believe and seeing if it is not a null/nil value
    if (! Meteor.userId()) {
      // like flash errors?
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function(taskId) {
    var task = Tasks.findOne(taskId);
    // similar to Table.find(id)?
    if (task.private && task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    // similar to Table.find(id)?
    if (task.private && task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskId, { $set: {checked: setChecked}});
  },
  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);
    // what does findOne do?

    //Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskId, { $set: {private: setToPrivate} });
  },
});

// #.helpers is similar to how we used helper methods in ruby
// do they only work for specific tasks?
//