"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPost = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../db/sequelize");
class BlogPost extends sequelize_1.Model {
}
exports.BlogPost = BlogPost;
BlogPost.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    churrasqueiroId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(180),
        allowNull: false,
    },
    subtitle: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: sequelize_2.sequelize,
    tableName: "blog_posts",
});
//# sourceMappingURL=BlogPost.js.map