const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
mongoose
  .connect(
    "mongodb+srv://<username>:<password>@cluster0.04kkk.mongodb.net/Cluster0?authSource=admin&retryWrites=true&w=majority",
    { useNewUrlParser: true }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((e) => {
    console.log("Error while attempting to connect to database");
    console.log(e);
  });

// To prevent deprecation warnings

module.exports = {
  mongoose,
};
