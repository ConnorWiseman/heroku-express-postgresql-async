/**
 * @file src/promises.js
 *
 * The Promise pattern is a way of reifying the callback pattern. In software
 * design, reification is a way of making an abstract concept concrete.
 *
 * If that didn't make sense, no worries. Think of it as a way of cramming the
 * callback pattern into an Object. That Object, a Promise, can be passed
 * around, chained, forked, and even run concurrently alongside other Promises.
 * Callbacks are the first step up the pyramid of JavaScript's asynchronous
 * programming patterns; Promises are the next. async/await follows Promises,
 * but I haven't touched on that in this demo.
 */
'use strict';

const bodyParser = require('body-parser');
const express    = require('express');

const database = require('./database.js');


express()
  .get('/', (req, res) => {
    res.json({ page: 'index' });
  })
  .use(bodyParser.json())
  .get('/person', database, (req, res) => {
    // Promises are Objects that represent one of three potential states for an
    // asynchronous operation. Those states are:
    //   * Pending
    //   * Rejected
    //   * Fulfilled
    //
    // A pending Promise has yet to fail or succeed. A rejected Promise has
    // failed in its execution, most likely because it encountered an error
    // state. A fulfilled Promise has successfully completed whatever operation
    // it set out to accomplish.
    //
    // We can react to a fulfilled Promise with its `.then()` method.
    // We can catch errors from a rejected Promise with is `.catch()` method.
    getPersons(req.db)
      .then(result => {
        res.json({
          page:   'GET /person',
          result: result.rows
        });
      })
      .catch(error => {
        res.json({
          page:  'GET /person',
          error: error.message
        });
      });
  })
  .get('/employee', database, (req, res) => {
    getEmployees(req.db)
      .then(result => {
        res.json({
          page:   'GET /employee',
          result: result.rows
        });
      })
      .catch(error => {
        res.json({
          page:  'GET /employee',
          error: error.message
        });
      });
  })
  .post('/person', database, (req, res) => {
    postPerson(req.db, req.body)
      .then(result => {
        res.json({
          page:   'POST /person',
          result: result.rows[0]
        });
      })
      .catch(error => {
        res.json({
          page:  'POST /person',
          error: error.message
        });
      });
  })
  .post('/employee', database, (req, res) => {
    postEmployee(req.db, req.body)
      .then(result => {
        res.json({
          page:   'POST /employee',
          result: result.rows[0]
        });
      })
      .catch(error => {
        res.json({
          page:  'POST /employee',
          error: error.message
        });
      });
  })
  .listen(process.env.PORT);


// Note that we no longer pass a callback function to Promise-returning functions:
function getPersons(db) {
  const sql = 'SELECT * FROM person';

  // To create a new Promise, we follow the pattern on the line below:
  return new Promise((resolve, reject) => {
    // `resolve()` and `reject()` represent functions that we can call to inform
    // the Promise Object about its success or failure states. We can consume
    // the error or result from node-postgres's callback pattern very simply:
    db.query(sql, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}


function getEmployees(db) {
  const sql = 'SELECT * FROM employee';

  return new Promise((resolve, reject) => {
    db.query(sql, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}


function postPerson(db, body) {
  const sql    = 'INSERT INTO person (name) VALUES $1::TEXT RETURNING *';
  const params = [ body.name ];

  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}


function postEmployee(db, body) {
  // Because `postPerson()` returns a Promise, we can chain off of its result
  // with `.then()`. Note that we do not provide any `catch()` logic here; we've
  // chosen to force whoever calls `postEmployee()` to catch all error state
  // themselves. Any errors encountered by `postPerson()` will propagate up the
  // Promise chain to the calling context:
  return postPerson(db, body)
    .then(result => {
      const sql    = 'INSERT INTO employee (person_id, salary) VALUES ($1::INT, $2::MONEY) RETURNING *';
      const params = [ result.rows[0].id, req.body.salary ];

      return new Promise((resolve, reject) => {
        db.query(sql, params, (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        });
      });
    });
}
