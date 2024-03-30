/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
'use strict';
const {Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Todo, {
        foreignKey: 'userId',
      });
    }
    static addUser({ firstName, lastName, email, password }) {
      return this.create({ firstName, lastName, email, password });
    }
    static async getUser(userId) {
      return this.findByPk(userId);
    }
  }
  User.init(
      {
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING,
      },
      {
        sequelize,
        modelName: 'User',
      },
  );
  return User;
};