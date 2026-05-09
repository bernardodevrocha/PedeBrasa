"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payBooking = payBooking;
async function payBooking(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
    }
    return res.status(410).json({
        message: "Metodo de pagamento online removido desta versao",
    });
}
//# sourceMappingURL=paymentController.js.map