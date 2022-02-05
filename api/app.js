const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();

// Loading Mongoose models

const { List, Task } = require("./db/models/models");
const { User } = require("./db/models/user.model");

// MIDDLEWARES

// Body parser middleware
app.use(bodyParser.json());

// Cors headers middleware
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id"
  );

  res.header(
    "Access-Control-Expose-Headers",
    "x-access-token, x-refresh-token"
  );

  next();
});

// check whether the request has a valid JWT access token
let authenticate = (req, res, next) => {
  let token = req.header("x-access-token");

  // verify the JWT
  jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
    if (err) {
      // there was an error
      // jwt is invalid - * DO NOT AUTHENTICATE *
      res.status(401).send(err);
    } else {
      // jwt is valid
      req.user_id = decoded._id;
      next();
    }
  });
};

// Verify Refresh Token Middleware (which will be verifying the session)
let verifySession = (req, res, next) => {
  // grab the refresh token from the request header
  let refreshToken = req.header("x-refresh-token");

  // grab the _id from the request header
  let _id = req.header("_id");

  User.findByIdAndToken(_id, refreshToken)
    .then((user) => {
      if (!user) {
        // user couldn't be found
        return Promise.reject({
          error:
            "User not found. Make sure that the refresh token and user id are correct",
        });
      }

      // if the code reaches here - the user was found
      // therefore the refresh token exists in the database - but we still have to check if it has expired or not

      req.user_id = user._id;
      req.userObject = user;
      req.refreshToken = refreshToken;

      let isSessionValid = false;

      user.sessions.forEach((session) => {
        if (session.token === refreshToken) {
          // check if the session has expired
          if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
            // refresh token has not expired
            isSessionValid = true;
          }
        }
      });

      if (isSessionValid) {
        // the session is VALID - call next() to continue with processing this web request
        next();
      } else {
        // the session is not valid
        return Promise.reject({
          error: "Refresh token has expired or the session is invalid",
        });
      }
    })
    .catch((e) => {
      res.status(401).send(e);
    });
};

// ROUTE HANDLER

/* LIST ROUTES */

/**
 * GET /lists
 * Purpose: Get all lists
 */
app.get("/lists", authenticate, (req, res) => {
  List.find({
    _userId: req.user_id,
  }).then((lists) => {
    if (lists.length < 1) {
      res.send("There are no lists at the moment");
    }

    res.send(lists);
  });
 
});

/**
 * POST /lists
 * Purpose: Create a list
 */


app.post("/lists", authenticate, (req, res) => {
  let title = req.body.title;

  let newList = new List({
    title: title,
    _userId: req.user_id,
    created: Date.now(),
  });

  newList.save().then((listDoc) => {
    res.send(listDoc);
  });

  // We want to create a new list and return the new list document back to the user (which includes the id)
  // The list information (fields) will be passed in via the JSON request body
});

/**
 * PATCH /lists/:id
 * Purpose: Update a specified list
 */
app.patch("/lists/:id", authenticate, (req, res) => {
  // We want to update the specified list (list document with id in the URL) with the new values specified in the JSON body of the request

  List.findOneAndUpdate(
    { _id: req.params.id, _userId: req.user_id },
    {
      $set: req.body,
    }
  ).then(() => {
    res.send({ message: "updated successfully" });
  });
});

/**
 * DELETE /lists/:id
 * Purpose: Delete a list
 */
app.delete("/lists/:id", authenticate, (req, res) => {
  // We want to delete the specified list (document with id in the URL)

  List.findOneAndRemove({
    _id: req.params.id,
    _userId: req.user_id,
  }).then((removedListDoc) => {
    res.send({
      message: "list deleted successfully",
      removedList: removedListDoc,
    });
    // Deleting all the tasks in the list
    deleteTasksFromList(removedListDoc._id);
  });
});

/* TASK ROUTES */

/**
 * GET /lists/:listId/tasks
 * Purpose: Get all tasks in a specific list
 */
app.get("/lists/:listId/tasks", authenticate, (req, res) => {
  // We want to return all tasks that belong to a specific list (specified by listId)
  Task.find({
    _listId: req.params.listId,
  }).then((tasks) => {
    res.send(tasks);
  });
});

/**
 * POST /lists/:listId/tasks
 * Purpose: Create a new task in a specific list
 */
app.post("/lists/:listId/tasks", authenticate, (req, res) => {
  // We want to create a new task in a list specified by listId

  // First we check if the currently auth. user has access to
  // the listId passed in the route
  List.findOne({
    _id: req.params.listId,
    _userId: req.user_id,
  })
    .then((list) => {
      // evaluates as true - list object is valid
      // the authenticated user can create new tasks
      if (list) {
        return true;
      }
      return false;
    })
    .then((canCreateTask) => {
      if (canCreateTask) {
        let newTask = new Task({
          title: req.body.title,
          _listId: req.params.listId,
          created: Date.now(),
        });
        newTask.save().then((newTaskDoc) => {
          res.send({ message: "Task created", taskDoc: newTaskDoc });
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Update an existing task
 */
app.patch("/lists/:listId/tasks/:taskId", authenticate, (req, res) => {
  // We want to update an existing task (specified by taskId)

  List.findOne({
    _id: req.params.listId,
    _userId: req.user_id,
  })
    .then((list) => {
      // evaluates as true - list object is valid
      // the authenticated user can update new tasks
      if (list) {
        return true;
      }
      return false;
    })
    .then((canUpdateTask) => {
      if (canUpdateTask) {
        Task.findOneAndUpdate(
          {
            _listId: req.params.listId,
            _id: req.params.taskId,
          },
          {
            $set: req.body,
          }
        ).then((UpdatedTask) => {
          res.send({
            message: "Updated successfully",
            updatedTask: UpdatedTask,
          });
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete a task
 */
app.delete("/lists/:listId/tasks/:taskId", authenticate, (req, res) => {
  List.findOne({
    _id: req.params.listId,
    _userId: req.user_id,
  })
    .then((list) => {
      // evaluates as true - list object is valid
      // the authenticated user can delete new tasks
      if (list) {
        return true;
      }
      return false;
    })
    .then((canDeleteTask) => {
      if (canDeleteTask) {
        Task.findOneAndRemove({
          _listId: req.params.listId,
          _id: req.params.taskId,
        }).then((removedTaskDoc) => {
          res.send({
            message: "Deleted successfully",
            removedTask: removedTaskDoc,
          });
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/* USER ROUTES */

/**
 * POST /users
 * Purpose: Sign up
 */
app.post("/users", (req, res) => {
  // User sign up

  let body = req.body;
  let newUser = new User(body);

  newUser
    .save()
    .then(() => {
      return newUser.createSession();
    })
    .then((refreshToken) => {
      // Session created successfully - refreshToken returned.
      // now we geneate an access auth token for the user

      return newUser.generateAccessAuthToken().then((accessToken) => {
        // access auth token generated successfully, now we return an object containing the auth tokens
        return { accessToken, refreshToken };
      });
    })
    .then((authTokens) => {
      // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
      res
        .header("x-refresh-token", authTokens.refreshToken)
        .header("x-access-token", authTokens.accessToken)
        .send(newUser);
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

/**
 * POST /users/login
 * Purpose: Login
 */
app.post("/users/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  User.findByCredentials(email, password)
    .then((user) => {
      return user
        .createSession()
        .then((refreshToken) => {
          // Session created successfully - refreshToken returned.
          // now we geneate an access auth token for the user

          return user.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken };
          });
        })
        .then((authTokens) => {
          // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
          res
            .header("x-refresh-token", authTokens.refreshToken)
            .header("x-access-token", authTokens.accessToken)
            .send(user);
        });
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

/**
 * GET /users/me/access-token
 * Purpose: generates and returns an access token
 */
app.get("/users/me/access-token", verifySession, (req, res) => {
  // we know that the user/caller is authenticated and we have the user_id and user object available to us
  req.userObject
    .generateAccessAuthToken()
    .then((accessToken) => {
      res.header("x-access-token", accessToken).send({ accessToken });
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

let deleteTasksFromList = (_listId) => {
  Task.deleteMany({
    _listId: _listId,
  }).then(() => {
    console.log("Tasks in list" + _listId + "were successfully deleted");
  });
};

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
