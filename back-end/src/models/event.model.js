const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },

  image: {
    type: String,
    required: true,
  },
  rsvp: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
},
{
  timestamps: true,
}
);

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
