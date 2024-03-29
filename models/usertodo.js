/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
'use strict';
const {Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Usertodo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Usertodo.hasMany(models.Todo, {
        foreignKey: 'userId',
      });
    }
  }
  Usertodo.init(
      {
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING,
      },
      {
        sequelize,
        modelName: 'Usertodo',
      },
  );
  return Usertodo;
};
