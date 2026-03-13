"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminMenu = getAdminMenu;
const User_1 = require("../models/User");
const Churrasqueiro_1 = require("../models/Churrasqueiro");
async function getAdminMenu(_req, res) {
    const [userCount, churrasqueiroCount] = await Promise.all([
        User_1.User.count(),
        Churrasqueiro_1.Churrasqueiro.count(),
    ]);
    return res.json({
        message: 'Admin menu',
        stats: {
            users: userCount,
            churrasqueiros: churrasqueiroCount,
        },
    });
}
//# sourceMappingURL=adminController.js.map