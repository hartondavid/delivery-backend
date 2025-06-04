import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";

const router = Router();

// Adaugă o rută nouă
router.post('/addRoute', userAuthMiddleware, async (req, res) => {
    const { area, admin_id } = req.body;
    try {
        const [id] = await db('routes').insert({ area, admin_id });
        const route = await db('routes').where({ id }).first();
        return sendJsonResponse(res, true, 201, "Rută adăugată cu succes!", { route });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea rutei!", { details: error.message });
    }
});

// Actualizează o rută
router.put('/updateRoute/:routeId', userAuthMiddleware, async (req, res) => {
    const { routeId } = req.params;
    const { area } = req.body;
    try {
        const route = await db('routes').where({ id: routeId }).first();
        if (!route) return sendJsonResponse(res, false, 404, "Rută inexistentă!", []);
        await db('routes').where({ id: routeId }).update({ area });
        const updated = await db('routes').where({ id: routeId }).first();
        return sendJsonResponse(res, true, 200, "Rută actualizată cu succes!", { route: updated });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la actualizarea rutei!", { details: error.message });
    }
});

// Șterge o rută
router.delete('/deleteRoute/:routeId', userAuthMiddleware, async (req, res) => {
    const { routeId } = req.params;
    try {
        const route = await db('routes').where({ id: routeId }).first();
        if (!route) return sendJsonResponse(res, false, 404, "Rută inexistentă!", []);
        await db('routes').where({ id: routeId }).del();
        return sendJsonResponse(res, true, 200, `Rută cu ID-ul ${routeId} a fost ștearsă!`, []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea rutei!", { details: error.message });
    }
});

// // Listare toate rutele
// router.get('/getRoutes', userAuthMiddleware, async (req, res) => {
//     try {
//         const routes = await db('routes').select('*');
//         return sendJsonResponse(res, true, 200, "Lista tuturor rutelor:", { routes });
//     } catch (error) {
//         return sendJsonResponse(res, false, 500, "Eroare la preluarea rutelor!", { details: error.message });
//     }
// });

// Listare curieri pentru o rută
router.get('/getCouriers/:routeId', userAuthMiddleware, async (req, res) => {
    const { routeId } = req.params;
    try {
        const route = await db('routes').where({ id: routeId }).first();
        if (!route) return sendJsonResponse(res, false, 404, "Ruta nu există!", []);
        const curieri = await db('users').where({ route_id: routeId });
        return sendJsonResponse(res, true, 200, `Lista curierilor pentru ruta ${route.area}:`, { curieri });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la preluarea curierilor!", { details: error.message });
    }
});


router.get('/getCouriersByAdminId', userAuthMiddleware, async (req, res) => {
    try {
        const routes = await db('routes')
            .where('routes.admin_id', req.user.id)
            .select('routes.*');

        console.log('routes', routes);

        if (routes.length === 0) {
            return sendJsonResponse(res, true, 200, "Nu există curieri pentru această rută.", []);
        }

        const results = await Promise.all(routes.map(async route => {
            const couriers = await db('user_routes')
                .leftJoin('users', 'user_routes.courier_id', 'users.id')
                .join('user_rights', 'users.id', 'user_rights.user_id')
                .join('rights', 'user_rights.right_id', 'rights.id')
                .where('rights.right_code', 2)
                .where('user_routes.route_id', route.id)
                .select(
                    'users.name',
                    'users.email',
                    'users.phone'
                );
            return {
                ...route,
                couriers
            };
        }));

        return sendJsonResponse(res, true, 200, "Curierii au fost preluate cu succes!", results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la preluarea curierilor!", { details: error.message });
    }
});

router.get('/getRoutesByCourierId', userAuthMiddleware, async (req, res) => {
    try {
        const routes = await db('routes')
            .join('user_routes', 'routes.id', 'user_routes.route_id')
            .join('user_rights', 'user_routes.courier_id', 'user_rights.user_id')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 2)
            .where('user_routes.courier_id', req.user.id)
            .select('routes.*');

        console.log('routes', routes);

        if (routes.length === 0) {
            return sendJsonResponse(res, true, 200, "Nu există rute pentru acest curier.", []);
        }

        return sendJsonResponse(res, true, 200, "Rutele au fost preluate cu succes!", routes);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la preluarea rutelelor!", { details: error.message });
    }
});

router.post('/addCourierToRoute/:routeId', userAuthMiddleware, async (req, res) => {
    const { courier_id } = req.body;
    const userId = req.user?.id;
    const routeId = req.params.routeId;

    const userRights = await db('user_rights').where({ user_id: userId }).first();
    const adminRole = userRights.right_id;
    try {
        if (adminRole === 2) {
            return sendJsonResponse(res, false, 403, "Doar administratorii pot adăuga curieri la rute!", []);
        }
        await db('user_routes').insert({ courier_id: courier_id, route_id: routeId });
        const courier = await db('users').where({ id: courier_id }).first();
        return sendJsonResponse(res, true, 200, "Curierul a fost adăugat la ruta!", { courier });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea curierului la ruta!", { details: error.message });
    }
});

// router.delete('/deleteCourierFromRoute/:routeId', userAuthMiddleware, async (req, res) => {
//     const { routeId } = req.params;
//     const { courier_id } = req.body;
//     try {
//         const route = await db('routes').where({ id: routeId }).first();
//         if (!route) return sendJsonResponse(res, false, 404, "Rută inexistentă!", []);
//         await db('user_routes').where({ user_id: courier_id, route_id: routeId }).del();
//         return sendJsonResponse(res, true, 200, `Curierul a fost șters de la ruta!`, []);
//     } catch (error) {
//         return sendJsonResponse(res, false, 500, "Eroare la ștergerea curierului de la ruta!", { details: error.message });
//     }
// });



router.get('/getCouriersByRouteId/:routeId', userAuthMiddleware, async (req, res) => {
    try {
        const { routeId } = req.params;
        const couriers = await db('user_routes')
            .join('users', 'user_routes.courier_id', 'users.id')
            .join('routes', 'user_routes.route_id', 'routes.id')
            .where('user_routes.route_id', routeId)
            .where('routes.admin_id', req.user.id)

            .select(
                'users.id',
                'users.name',
                'users.email',
            )
        if (couriers.length === 0) {
            return sendJsonResponse(res, false, 404, 'Nu există curieri!', []);
        }
        return sendJsonResponse(res, true, 200, 'Curierii au fost găsiți!', couriers);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea curierilor!', { details: error.message });
    }
});



export default router;
