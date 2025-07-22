import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";

const router = Router();

// Adaugă o livrare nouă
router.post('/addDelivery', userAuthMiddleware, async (req, res) => {
    try {

        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }


        const idResult = await (await db())('delivery').insert({ admin_id: userId }).returning('id');
        const id = Array.isArray(idResult) ? idResult[0] : idResult;
        // Extract the actual ID value from the object
        const deliveryId = typeof id === 'object' && id.id ? id.id : id;

        const delivery = await (await db())('delivery').where({ id: deliveryId }).first();
        return sendJsonResponse(res, true, 201, "Livrarea a fost adăugată cu succes!", delivery);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea livrării!", { details: error.message });
    }
});


router.get('/getDeliveriesByAdminId', userAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const deliveries = await (await db())('delivery')
            .leftJoin('users', 'delivery.courier_id', 'users.id')
            .select('delivery.*', 'users.name as courier_name');


        if (deliveries.length === 0) {
            return sendJsonResponse(res, true, 200, "Nu există livrări pentru acest curier.", []);
        }

        const results = await Promise.all(deliveries.map(async delivery => {
            const orders = await (await db())('orders')
                .where('orders.delivery_id', delivery.id)
                .select(
                    'orders.id',
                    'orders.recipient',
                    'orders.phone',
                    'orders.address',
                    'orders.status',
                    'orders.delivery_id'

                );
            return {
                ...delivery,
                orders
            };
        }));

        return sendJsonResponse(res, true, 200, "Livrările au fost preluate cu succes!", results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la preluarea livrărilor!", { details: error.message });
    }
});

router.get('/getDeliveriesByCourierId', userAuthMiddleware, async (req, res) => {
    try {

        const userId = req.user.id;


        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 2 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const deliveries = await (await db())('delivery').
            leftJoin('users', 'delivery.courier_id', 'users.id')
            .where('delivery.courier_id', userId)
            .select('delivery.*', 'users.name as courier_name');


        if (deliveries.length === 0) {
            return sendJsonResponse(res, true, 200, "Nu există livrări pentru acest curier.", []);
        }

        const results = await Promise.all(deliveries.map(async delivery => {
            const orders = await (await db())('orders')
                .where('orders.delivery_id', delivery.id)
                .select(
                    'orders.id',
                    'orders.recipient',
                    'orders.phone',
                    'orders.address',
                    'orders.status',
                );
            return {
                ...delivery,
                orders
            };
        }));

        return sendJsonResponse(res, true, 200, "Livrările au fost preluate cu succes!", results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la preluarea livrărilor!", { details: error.message });
    }
});

// Șterge o livrare
router.delete('/deleteDelivery/:deliveryId', userAuthMiddleware, async (req, res) => {

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

        const delivery = await (await db())('delivery').where({ id: deliveryId }).first();
        if (!delivery) return sendJsonResponse(res, false, 404, "Livrarea nu există!", []);
        await (await db())('delivery').where({ id: deliveryId }).del();

        return sendJsonResponse(res, true, 200, "Livrarea a fost ștearsă cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea livrării!", { details: error.message });
    }
});

// // Adaugă o problemă la o livrare
// router.post('/addIssue/:deliveryId', userAuthMiddleware, async (req, res) => {

//     try {

//         const { deliveryId } = req.params;
//         const { issueId } = req.body;

//         const userId = req.user.id;


//         const userRights = await (await databaseManager.getKnex())('user_rights')
//             .join('rights', 'user_rights.right_id', 'rights.id')
//             .where({ 'user_rights.user_id': userId, 'rights.right_code': 2 })
//             .first();

//         if (!userRights) {
//             return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
//         }


//         const delivery = await (await databaseManager.getKnex())('delivery').where({ id: deliveryId }).first();
//         const issue = await (await databaseManager.getKnex())('issues').where({ id: issueId }).first();
//         if (!delivery || !issue) return sendJsonResponse(res, false, 404, "Livrarea sau problema nu există!", []);
//         await (await databaseManager.getKnex())('delivery').where({ id: deliveryId }).update({ issue_id: issueId });
//         const updated = await (await databaseManager.getKnex())('delivery').where({ id: deliveryId }).first();
//         return sendJsonResponse(res, true, 200, `Problema a fost atribuită livrării ${deliveryId}!`, { delivery: updated });
//     } catch (error) {
//         return sendJsonResponse(res, false, 500, "Eroare la adăugarea problemei!", { details: error.message });
//     }
// });

// Asociază mai multe comenzi la o livrare
router.post('/addOrdersToDelivery/:deliveryId', userAuthMiddleware, async (req, res) => {

    try {

        const { order_ids } = req.body;
        const userId = req.user.id;
        const deliveryId = req.params.deliveryId;


        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }


        if (!Array.isArray(order_ids) || order_ids.length === 0) {
            return sendJsonResponse(res, false, 400, "Trebuie să selectezi cel puțin o comandă!", []);
        }
        await (await db())('orders').whereIn('id', order_ids).update({ delivery_id: deliveryId });
        const orders = await (await db())('orders').whereIn('id', order_ids);
        return sendJsonResponse(res, true, 200, "Comenzile au fost adăugate la livrare!", { orders });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la asocierea comenzilor la livrare!", { details: error.message });
    }
});

router.post('/assignCourierToDelivery/:deliveryId', userAuthMiddleware, async (req, res) => {

    try {

        const { deliveryId } = req.params;
        const { courier_id } = req.body;


        const userId = req.user.id;


        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': userId, 'rights.right_code': 1 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const delivery = await (await db())('delivery').where({ id: deliveryId }).first();
        const courier = await (await db())('users').where({ id: courier_id }).first();
        if (!delivery || !courier) return sendJsonResponse(res, false, 404, "Livrarea sau curierul nu există!", []);
        await (await db())('delivery').where({ id: deliveryId }).update({ courier_id: courier_id });
        const updated = await (await db())('delivery').where({ id: deliveryId }).first();
        return sendJsonResponse(res, true, 200, `Curierul a fost atribuit livrării ${deliveryId}!`, { delivery: updated });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la atribuirea curierului!", { details: error.message });
    }
});


router.get('/searchDeliveryByCourierId', userAuthMiddleware, async (req, res) => {

    try {
        const { searchField } = req.query;

        if (!searchField) {
            return sendJsonResponse(res, false, 400, 'Search field is required', null);
        }

        const userRights = await (await db())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where({ 'user_rights.user_id': req.user.id, 'rights.right_code': 2 })
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        // Query the database to search for employees where name contains the searchField
        const deliveries = await (await db())('delivery')
            .join('users', 'delivery.courier_id', 'users.id')
            .where('delivery.courier_id', req.user.id)
            .where(function () {
                this.where('delivery.id', 'like', `%${searchField}%`)

            })
            .select('delivery.*');

        if (deliveries.length === 0) {
            return sendJsonResponse(res, false, 404, 'Nu există livrări!', []);
        }

        // Attach the employees to the request object for the next middleware or route handler
        return sendJsonResponse(res, true, 200, 'Livrările au fost găsiți!', deliveries);
    } catch (err) {
        console.error(err);
        return sendJsonResponse(res, false, 500, 'An error occurred while retrieving deliveries', null);
    }
})




export default router;
