/**
 * @file src/callbacks.js
 *
 * Breaking everything apart into functions increases composability, which is the
 * only advantage you get with the callback pattern and only then, it's only truly
 * noticeable with the nested callback in `postEmployee()`, where the logic from
 * `postPerson()` is re-used.
 *
 * Other than that, there are no significant differences from the code in
 * src/index.js. The callback pattern here is essentially what node-postgres
 * uses internally, so the programming API looks very similar.
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
    getPersons(req.db, (error, result) => {
      if (error) {
        return res.json({
          page:  'GET /person',
          error: error.message
        });
      }

      res.json({
        page:   'GET /person',
        result: result.rows
      });
    });
  })
  .get('/employee', database, (req, res) => {
    getEmployees(req.db, (error, result) => {
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
  .post('/person', database, (req, res) => {
    postPerson(req.db, req.body, (error, result) => {
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
  .post('/employee', database, (req, res) => {
    postEmployee(req.db, req.body, (error, result) => {
      if (error) {
        return res.json({
          page:  'POST /employee',
          error: error.message
        });
      }

      res.json({
        page:   'POST /employee',
        result: result.rows[0]
      });
    });
  })
  .listen(3000);


function getPersons(db, callback) {
  const sql = 'SELECT * FROM person';

  db.query(sql, (error, result) => {
    if (error) {
      return callback(error, null);
    }

    return callback(null, result);
  });
}


function getEmployees(db, callback) {
  const sql = 'SELECT * FROM employee';

  db.query(sql, (error, result) => {
    if (error) {
      return callback(error, null);
    }

    return callback(null, result);
  });
}


function postPerson(db, body, callback) {
  const sql    = 'INSERT INTO person (name) VALUES $1::TEXT RETURNING *';
  const params = [ body.name ];

  db.query(sql, params, (error, result) => {
    if (error) {
      return callback(error, null);
    }

    return callback(null, result);
  });
}


function postEmployee(db, body, callback) {
  postPerson(db, body, (error, result) => {
    if (error) {
      return callback(error, null);
    }

    const sql    = 'INSERT INTO employee (person_id, salary) VALUES ($1::INT, $2::MONEY) RETURNING *';
    const params = [ result.rows[0].id, req.body.salary ];

    db.query(sql, params, (error, result) => {
      if (error) {
        return callback(error, null);
      }

      return callback(null, result);
    });
  });
}
