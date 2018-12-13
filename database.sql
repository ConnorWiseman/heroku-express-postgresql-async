CREATE TABLE IF NOT EXISTS person (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS employee (
  id        SERIAL PRIMARY KEY,
  person_id INT NOT NULL REFERENCES person (id) ON DELETE CASCADE,
  salary    MONEY NOT NULL
);



INSERT INTO person (name) VALUES
  ('Dr. Strange'),
  ('Dr. Doom'),
  ('Dr. Mario');

INSERT INTO employee (person_id, salary) VALUES
  (
    (SELECT id FROM person WHERE name = 'Dr. Strange'),
    1234567.89
  ),
  (
    (SELECT id FROM person WHERE name = 'Dr. Doom'),
    9876543.21
  ),
  (
    (SELECT id FROM person WHERE name = 'Dr. Mario'),
    3.50
  );



SELECT
  person.id,
  person.name,
  employee.salary
FROM person
INNER JOIN employee
  ON person.id = employee.person_id;
