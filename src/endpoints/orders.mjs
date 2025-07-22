import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";

const router = Router();

// Adaugă o comandă nouă 
router.post('/addOrder', userAuthMiddleware, async (req, res) => {

    try {

        const { recipient, phone, address, status } = req.body;
        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const dbInstance = await db();
        const orderResult = await dbInstance('orders').insert({ recipient, phone, address, admin_id: userId, delivery_id: null, status: status }).returning('*');
        const order = Array.isArray(orderResult) ? orderResult[0] : orderResult;
        return sendJsonResponse(res, true, 201, "Comanda a fost adăugată cu succes!", { id: order.id });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea comenzii!", { details: error.message });
    }
});

// Actualizează o comandă
router.put('/updateOrder/:orderId', userAuthMiddleware, async (req, res) => {

    try {
        const { orderId } = req.params;
        const { recipient, phone, address, status } = req.body;

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const dbInstance = await db();
        const order = await dbInstance('orders').where({ id: orderId }).first();
        if (!order) return sendJsonResponse(res, false, 404, "Comanda nu există!", []);
        await dbInstance('orders').where({ id: orderId }).update({
            recipient: recipient || order.recipient,
            phone: phone || order.phone,
            address: address || order.address,
            status: status || order.status
        });
        const updated = await dbInstance('orders').where({ id: orderId }).first();
        return sendJsonResponse(res, true, 200, "Comanda a fost actualizată cu succes!", { order: updated });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la actualizarea comenzii!", { details: error.message });
    }
});

// Șterge o comandă
router.delete('/deleteOrder/:orderId', userAuthMiddleware, async (req, res) => {

    try {
        const { orderId } = req.params;

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const dbInstance = await db();
        const order = await dbInstance('orders').where({ id: orderId }).first();
        if (!order) return sendJsonResponse(res, false, 404, "Comanda nu există!", []);
        await dbInstance('orders').where({ id: orderId }).del();
        return sendJsonResponse(res, true, 200, "Comanda a fost ștearsă cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea comenzii!", { details: error.message });
    }
});

// Obține o comandă după id
router.get('/getOrder/:orderId', userAuthMiddleware, async (req, res) => {

    try {

        const { orderId } = req.params;

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const dbInstance = await db();
        const order = await dbInstance('orders')
            .where('orders.id', orderId)
            .select(
                'orders.id',
                'orders.recipient',
                'orders.phone',
                'orders.address',
                'orders.status',
            )
            .first();
        if (!order) {
            return sendJsonResponse(res, false, 404, 'Comanda nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Comanda a fost găsită!', order);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea comenzii!', { details: error.message });
    }
});

router.get('/getOrdersByAdminId', userAuthMiddleware, async (req, res) => {
    try {

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }


        const dbInstance = await db();
        const orders = await dbInstance('orders')
            .join('users', 'orders.admin_id', 'users.id')
            .select(
                'orders.id',
                'orders.recipient',
                'orders.phone',
                'orders.address',
                'orders.status',
                'orders.delivery_id',
                'orders.created_at',
            )
        if (orders.length === 0) {
            return sendJsonResponse(res, false, 404, 'Nu există comenzi!', []);
        }
        return sendJsonResponse(res, true, 200, 'Comenzi a fost găsite!', orders);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea comenzilor!', { details: error.message });
    }
});



router.get('/getOrdersByCourierId', userAuthMiddleware, async (req, res) => {
    try {

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 2 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const dbInstance = await db();
        const orders = await dbInstance('orders')
            .join('delivery', 'orders.delivery_id', 'delivery.id')
            .where('delivery.courier_id', req.user.id)
            .select(
                'orders.id',
                'orders.recipient',
                'orders.phone',
                'orders.address',
                'orders.status',
                'orders.delivery_id',
                'orders.created_at',
            )
        if (orders.length === 0) {
            return sendJsonResponse(res, false, 404, 'Nu există comenzi!', []);
        }
        return sendJsonResponse(res, true, 200, 'Comenzi a fost găsite!', orders);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea comenzilor!', { details: error.message });
    }
});


router.get('/searchOrder', userAuthMiddleware, async (req, res) => {

    try {

        const { searchField } = req.query;

        if (!searchField) {
            return sendJsonResponse(res, false, 400, 'Search field is required', null);
        }

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        // Query the database to search for employees where name contains the searchField
        const dbInstance = await db();
        const orders = await dbInstance('orders')

            .where('delivery_id', null)
            .where(function () {
                this.where('recipient', 'like', `%${searchField}%`)
                    .orWhere('phone', 'like', `%${searchField}%`)
                    .orWhere('address', 'like', `%${searchField}%`)
            })

            .select('orders.*');


        if (orders.length === 0) {
            return sendJsonResponse(res, false, 404, 'Nu există comenzi!', []);
        }

        // Attach the employees to the request object for the next middleware or route handler
        return sendJsonResponse(res, true, 200, 'Comenzi a fost găsite!', orders);
    } catch (err) {
        console.error(err);
        return sendJsonResponse(res, false, 500, 'An error occurred while retrieving employeesr', null);
    }
})

router.get('/getOrdersByDeliveryId/:deliveryId', userAuthMiddleware, async (req, res) => {
    try {
        const { deliveryId } = req.params;

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const dbInstance = await db();
        const orders = await dbInstance('orders')
            .join('delivery', 'orders.delivery_id', 'delivery.id')
            .where('delivery.id', deliveryId)
            .select(
                'orders.id',
                'orders.recipient',
                'orders.phone',
                'orders.address',
                'orders.status',
                'orders.created_at',
            )
        if (orders.length === 0) {
            return sendJsonResponse(res, false, 404, 'Nu există comenzi!', []);
        }
        return sendJsonResponse(res, true, 200, 'Comenzi a fost găsite!', orders);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea comenzilor!', { details: error.message });
    }
});


export default router; 