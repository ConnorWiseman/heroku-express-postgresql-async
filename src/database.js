'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  // PostgreSQL connection configuration goes here
});

module.exports = (req, res, next) => {
  req.db = pool;

  next();
};
