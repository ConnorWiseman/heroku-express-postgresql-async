/**
 * @file src/index.js
 *
 * The most straightforward approach: everything is nested together in one giant
 * block for terseness. The node-postgres module uses callbacks itself, so breaking
 * the functionality out into separate functions that, themselves, use callbacks
 * is an extra step.
 *
 * This is what your approach might look like if you just used the node-postgres
 * functions without writing your own.
 */
'use strict';

// Dependencies from npm, written by others:
const bodyParser = require('body-parser');
const express    = require('express');

// Internal dependencies we wrote ourselves:
const database = require('./database.js');

// Create an ExpressJS application:
express()
  // Listen for requests to '/':
  .get('/', (req, res) => {
    res.json({ page: 'index' });
  })
  // Listen for requests to '/person'. All following endpoints require a database
  // connection to function, so we provide one in the form of our `database`
  // middleware before defining the route logic:
  .get('/person', database, (req, res) => {
    const sql = 'SELECT * FROM person';

    // The definition for `req.db` is in src/database.js. Run our query:
    req.db.query(sql, (error, result) => {
      // If there is an error, return a different JSON response:
      if (error) {
        return res.json({
          page:  'GET /person',
          error: error.message
        });
      }

      // No error occured, so return the standard JSON response:
      res.json({
        page:   'GET /person',
        result: result.rows
      });
    });
  })
  // Second verse, same as the first:
  .get('/employee', database, (req, res) => {
    const sql = 'SELECT person.id, person.name, employee.salary FROM person INNER JOIN employee ON person.id = employee.person_id;';

    req.db.query(sql, (error, result) => {
      if (error) {
        return res.json({
          page:  'GET /employee',
          error: error.message
        });
      }

      res.json({
        page:   'GET /employee',
        result: result.rows
      });
    });
  })
  // All POST requests must consume a request body, so apply body parsing
  // middleware beforehand:
  .use(bodyParser.json())
  // Listen for incoming POST requests to create a new person in the database:
  .post('/person', database, (req, res) => {
    // Casting placeholders (the ::TEXT bit) is optional, but may help with
    // understandability in lengthier queries:
    const sql    = 'INSERT INTO person (name) VALUES ($1::TEXT) RETURNING *';

    // `req.body` is populated by the body parsing middleware:
    const params = [ req.body.name ];

    // Standard query execution pattern; the only difference is the additional
    // `params` argument:
    req.db.query(sql, params, (error, result) => {
      if (error) {
        return res.json({
          page:  'POST /person',
          error: error.message
        });
      }

      res.json({
        page:   'POST /person',
        result: result.rows[0]
      });
    });
  })
  // Inserting an employee is trickier. In this contrived data model, employees
  // are also persons, and a person must exist beforehand. Because both of these
  // operations are asynchronous, we must strictly perform one before the other.
  // This approach uses nested callbacks.
  .post('/employee', database, (req, res) => {
    const sql1    = 'INSERT INTO person (name) VALUES ($1::TEXT) RETURNING *';
    const params1 = [ req.body.name ];

    // Insert the person record first:
    req.db.query(sql1, params1, (error1, result1) => {
      // If an error occurred while inserting the person, abort with an early
      // `return` statement:
      if (error1) {
        return res.json({
          page:  'POST /employee',
          error: error1.message
        });
      }

      const sql2    = 'INSERT INTO employee (person_id, salary) VALUES ($1::INT, $2::MONEY) RETURNING *';
      const params2 = [ result1.rows[0].id, req.body.salary ];

      // All went well inserting the person, so now insert the employee:
      req.db.query(sql2, params2, (error2, result2) => {
        if (error2) {
          return res.json({
            page:  'POST /employee',
            error: error2.message
          });
        }

        res.json({
          page:   'POST /employee',
          result: result2.rows[0]
        });
      });
    });
  })
  .listen(process.env.PORT);
