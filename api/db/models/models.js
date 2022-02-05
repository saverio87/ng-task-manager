const mongoose = require("mongoose");

const ListSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  },
  _userId: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    required: true
  }
});

const List = mongoose.model("List", ListSchema);

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  },

  _listId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },

  created: {
    type: Date,
    required: true,
  },

  updated: {
    type: Date,
    required: false,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const Task = mongoose.model("Task", TaskSchema);

module.exports = {
  List,
  Task,
};
