const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  priority: { 
    type: DataTypes.ENUM('Düşük', 'Orta', 'Yüksek'), 
    defaultValue: 'Orta' 
  },
  status: { 
    type: DataTypes.ENUM('Yapılacak', 'Devam Ediyor', 'Tamamlandı'), 
    defaultValue: 'Yapılacak' 
  },
  due_date: { type: DataTypes.DATE },
  completed_at: { type: DataTypes.DATE }
}, { 
  timestamps: true,
  // İŞTE ARTI PUAN GETİRECEK INDEX STRATEJİMİZ:
  indexes: [
    { fields: ['user_id'] }, // Kullanıcının görevlerini hızlı getirmek için
    { fields: ['status'] },  // Tamamlanan/Bekleyen görevleri hızlı filtrelemek için
    { fields: ['due_date'] } // Geciken görevleri bulurken tarihi hızlı taramak için
  ]
});

User.hasMany(Task, { foreignKey: 'user_id' });
Task.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Task;
